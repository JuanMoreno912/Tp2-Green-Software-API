// Tabla de registros cargados con su trazabilidad.
window.CO2 = window.CO2 || {};

(function () {
  const { fmt } = CO2.calculo;

  function render() {
    const sel = document.getElementById('filtro-periodo-reg');
    const filtro = sel.value;
    const tbody = document.querySelector('#tabla-registros tbody');
    const lista = CO2.state.registros
      .filter((r) => !filtro || r.periodo_id === Number(filtro))
      .sort((a, b) => b.periodo_id - a.periodo_id || (b.fecha || '').localeCompare(a.fecha || ''));

    if (!lista.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="vacio">No hay registros. Cargá datos o usá "Cargar datos de ejemplo".</td></tr>';
      return;
    }

    tbody.innerHTML = lista
      .map((r) => {
        const insumo = CO2.buscarInsumo(r.insumo_codigo);
        const pasos = r.resultado.formula.split(' | ').map((p) => `<li>${CO2.esc(p)}</li>`).join('');
        return `<tr>
          <td>${r.periodo_id}</td>
          <td>${CO2.esc(CO2.nombreEdificio(r.edificio_id))}</td>
          <td>${CO2.esc(insumo?.nombre ?? r.insumo_codigo)}</td>
          <td class="num">${fmt(r.cantidad)} ${CO2.esc(r.unidad)}</td>
          <td class="num"><strong>${fmt(r.resultado.kgco2e, 2)}</strong></td>
          <td><span class="calidad calidad-${CO2.esc(r.calidad)}">${CO2.esc(r.calidad)}</span></td>
          <td><details><summary>Ver cálculo</summary><ol class="pasos">${pasos}</ol></details></td>
          <td>${CO2.config.USE_MOCK ? `<button class="btn-icono" data-borrar="${r.id}" title="Eliminar">✕</button>` : ''}</td>
        </tr>`;
      })
      .join('');
  }

  async function cargarEjemplos() {
    if (!CO2.config.USE_MOCK) return CO2.mensaje('Los ejemplos solo se cargan en modo prueba.', 'error');
    const nuevos = CO2.mock.ejemplos.map(([anio, edificio, codigo, cantidad, unidad], i) => ({
      ...CO2.procesarRegistro({
        periodo_id: anio,
        edificio_id: edificio,
        insumo_codigo: codigo,
        cantidad,
        unidad,
        gramaje: CO2.config.GRAMAJE_DEFAULT,
        fecha: `${anio}-0${(i % 9) + 1}-15`,
        comprobante: 'EJEMPLO-' + (i + 1),
        calidad: 'C',
        observaciones: 'Dato de ejemplo (no real)',
      }),
      id: Date.now() + i,
    }));
    const sinEjemplos = CO2.state.registros.filter((r) => !String(r.comprobante).startsWith('EJEMPLO-'));
    CO2.api.reemplazarRegistrosLocales([...sinEjemplos, ...nuevos]);
    await CO2.recargarRegistros();
    render();
    CO2.mensaje(`Se cargaron ${nuevos.length} registros de ejemplo.`);
  }

  function iniciar() {
    const sel = document.getElementById('filtro-periodo-reg');
    sel.innerHTML =
      '<option value="">Todos los años</option>' +
      CO2.state.periodos.map((p) => `<option value="${p.id}">${p.anio}</option>`).join('');
    sel.addEventListener('change', render);

    document.getElementById('btn-ejemplos').addEventListener('click', cargarEjemplos);
    document.querySelector('#tabla-registros tbody').addEventListener('click', async (ev) => {
      const id = ev.target.dataset?.borrar;
      if (!id || !confirm('¿Eliminar este registro?')) return;
      await CO2.api.eliminarRegistro(Number(id));
      await CO2.recargarRegistros();
      render();
    });
  }

  CO2.registros = { iniciar, render };
})();
