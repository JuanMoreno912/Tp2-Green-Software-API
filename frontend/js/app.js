// Estado global, navegación y utilidades compartidas.
window.CO2 = window.CO2 || {};

(function () {
  const state = { edificios: [], periodos: [], insumos: [], factores: [], registros: [] };
  CO2.state = state;

  CO2.buscarInsumo = (codigo) => state.insumos.find((i) => i.codigo === codigo);
  CO2.buscarFactor = (codigo) => state.factores.find((f) => f.insumo_codigo === codigo);
  CO2.nombreEdificio = (id) => state.edificios.find((e) => e.id === Number(id))?.nombre ?? '—';
  CO2.periodo = (id) => state.periodos.find((p) => p.id === Number(id));

  const esc = (s) =>
    String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  CO2.esc = esc;

  /**
   * Calcula emisiones (y evitadas si es papel reciclado) para un dato de actividad.
   * Devuelve el registro listo para enviar a la API.
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
    return { ...dato, resultado };
  };

  // ---------- Mensajes ----------
  let timer;
  CO2.mensaje = function (texto, tipo = 'ok') {
    const el = document.getElementById('mensaje');
    el.textContent = texto;
    el.className = 'mensaje ' + tipo;
    clearTimeout(timer);
    timer = setTimeout(() => el.classList.add('oculto'), 5000);
  };

  // ---------- Pestañas ----------
  function activarTab(nombre) {
    document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('activa', b.dataset.tab === nombre));
    document.querySelectorAll('.panel').forEach((p) => p.classList.toggle('oculto', p.id !== 'tab-' + nombre));
    if (nombre === 'registros') CO2.registros.render();
    if (nombre === 'indicadores') CO2.visualizacion.render();
  }

  CO2.recargarRegistros = async function () {
    state.registros = await CO2.api.getRegistros();
  };

  CO2.iniciar = async function () {
    document.getElementById('modo-api').textContent = CO2.config.USE_MOCK ? 'Modo prueba (sin API)' : 'API conectada';
    document.querySelectorAll('.tab').forEach((b) => b.addEventListener('click', () => activarTab(b.dataset.tab)));

    try {
      const [edificios, periodos, insumos, factores, registros] = await Promise.all([
        CO2.api.getEdificios(),
        CO2.api.getPeriodos(),
        CO2.api.getInsumos(),
        CO2.api.getFactores(),
        CO2.api.getRegistros(),
      ]);
      Object.assign(state, { edificios, periodos, insumos, factores, registros });
    } catch (e) {
      CO2.mensaje('No se pudieron cargar los datos de la API: ' + e.message, 'error');
      return;
    }

    CO2.carga.iniciar();
    CO2.registros.iniciar();
    CO2.visualizacion.iniciar();
  };
})();
