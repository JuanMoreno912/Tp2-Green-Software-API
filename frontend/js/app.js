// Estado global, navegación entre vistas y utilidades compartidas.
window.CO2 = window.CO2 || {};

(function () {
  const state = { edificios: [], periodos: [], insumos: [], factores: [], registros: [] };
  CO2.state = state;

  // Orden fijo de categorías: el color de cada una no cambia entre gráficos.
  CO2.CATEGORIAS = ['Papel', 'Cartón', 'Impresión', 'Librería', 'Limpieza', 'Tissue', 'Plásticos', 'Servicios'];

  CO2.buscarInsumo = (codigo) => state.insumos.find((i) => i.codigo === codigo);
  CO2.buscarFactor = (codigo) => state.factores.find((f) => f.insumo_codigo === codigo);
  CO2.nombreEdificio = (id) => state.edificios.find((e) => e.id === Number(id))?.nombre ?? 'Sin edificio';
  CO2.periodo = (id) => state.periodos.find((p) => p.id === Number(id));
  CO2.periodoPorAnio = (anio) => state.periodos.find((p) => p.anio === Number(anio));
  CO2.anioDe = (registro) => CO2.periodo(registro.periodo_id)?.anio ?? Number(registro.periodo_id);
  CO2.categoriaDe = (registro) => CO2.buscarInsumo(registro.insumo_codigo)?.categoria ?? 'Otro';

  const esc = (s) =>
    String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  CO2.esc = esc;

  /**
   * Calcula emisiones (y evitadas si es papel reciclado) para un dato de actividad.
   * Devuelve { ...dato, resultado, lineas }. `lineas` es solo para mostrar en pantalla.
   */
  CO2.procesarRegistro = function (dato) {
    const insumo = CO2.buscarInsumo(dato.insumo_codigo);
    if (!insumo) throw new Error('Insumo inexistente: ' + dato.insumo_codigo);
    const factor = CO2.buscarFactor(insumo.codigo);
    const resultado = CO2.calculo.calcular(dato, insumo, factor);

    resultado.kgco2eEvitados = 0;
    if (insumo.categoria === 'Papel' && insumo.reciclado > 0) {
      const fVirgen = CO2.buscarFactor(insumo.codigo.replace('RECICLADO', 'VIRGEN'));
      if (fVirgen) {
        resultado.kgco2eEvitados = CO2.calculo.evitadasPorReciclado(resultado.cantidadBase, fVirgen.valor, factor.valor);
      }
    }
    const { lineas, ...guardable } = resultado;
    return { ...dato, resultado: guardable, lineas };
  };

  // ---------- Aviso flotante ----------
  let timer;
  CO2.mensaje = function (texto, tipo = 'ok') {
    const el = document.getElementById('aviso');
    el.textContent = texto;
    el.className = 'aviso' + (tipo === 'error' ? ' error' : '');
    el.hidden = false;
    clearTimeout(timer);
    timer = setTimeout(() => (el.hidden = true), tipo === 'error' ? 7000 : 4000);
  };

  // ---------- Navegación ----------
  const VISTAS = {
    panel: 'Panel',
    carga: 'Cargar compra',
    registros: 'Registros',
    factores: 'Factores y referencias',
  };

  function mostrarVista(nombre) {
    if (!VISTAS[nombre]) nombre = 'panel';
    document.querySelectorAll('.vista').forEach((v) => (v.hidden = v.id !== 'vista-' + nombre));
    document.querySelectorAll('.menu-item').forEach((a) => {
      if (a.dataset.vista === nombre) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    document.getElementById('titulo-vista').textContent = VISTAS[nombre];
    document.getElementById('miga-vista').textContent = VISTAS[nombre];
    document.getElementById('selector-anio').hidden = nombre !== 'panel';
    document.title = `${VISTAS[nombre]} · Campus CO₂`;

    if (nombre === 'panel') CO2.visualizacion.render();
    if (nombre === 'registros') CO2.registros.render();
    if (nombre === 'factores') CO2.factores.render();
  }
  CO2.irA = (nombre) => {
    if (location.hash === '#' + nombre) mostrarVista(nombre);
    else location.hash = nombre;
  };

  // ---------- Estado de la API ----------
  function mostrarEstadoApi(estado, texto) {
    const el = document.getElementById('estado-api');
    el.className = 'estado ' + estado;
    el.textContent = texto;
    el.title = texto;
  }

  CO2.recargarRegistros = async function () {
    state.registros = await CO2.api.getRegistros();
  };

  CO2.iniciar = async function () {
    mostrarEstadoApi('', CO2.config.USE_MOCK ? 'Modo prueba (sin API)' : 'Conectando con la API…');

    try {
      const [edificios, periodos, insumos, factores, registros] = await Promise.all([
        CO2.api.getEdificios(),
        CO2.api.getPeriodos(),
        CO2.api.getInsumos(),
        CO2.api.getFactores(),
        CO2.api.getRegistros(),
      ]);
      Object.assign(state, { edificios, periodos, insumos, factores, registros });
      if (!CO2.config.USE_MOCK) mostrarEstadoApi('conectada', 'API de la cátedra conectada');
    } catch (e) {
      mostrarEstadoApi('error', 'Sin conexión con la API');
      CO2.mensaje('No se pudieron leer los datos de la API (' + e.message + '). Revisá la URL en config.js.', 'error');
      return;
    }

    CO2.carga.iniciar();
    CO2.registros.iniciar();
    CO2.factores.iniciar();
    CO2.visualizacion.iniciar();

    document.querySelectorAll('[data-ejemplos]').forEach((b) => {
      b.hidden = !CO2.config.USE_MOCK;
      b.addEventListener('click', () => CO2.cargarEjemplos());
    });

    // ?demo=1 carga los datos de ejemplo (útil para capturas y para la presentación)
    if (CO2.config.USE_MOCK && new URLSearchParams(location.search).has('demo') && !state.registros.length) {
      await CO2.cargarEjemplos(false);
    }

    window.addEventListener('hashchange', () => mostrarVista(location.hash.slice(1)));
    mostrarVista(location.hash.slice(1));
  };
})();
