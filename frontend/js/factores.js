// Factores de emisión (con su fuente y si están verificados) y datos de referencia (matrícula).
window.CO2 = window.CO2 || {};

(function () {
  const { fmt } = CO2.calculo;

  function renderFactores() {
    const tbody = document.querySelector('#tabla-factores tbody');
    tbody.innerHTML = CO2.state.factores
      .map((f) => {
        const insumo = CO2.buscarInsumo(f.insumo_codigo);
        const estado = f.verificado
          ? '<span class="estado-factor verificado">Verificado</span>'
          : '<span class="estado-factor supuesto">Supuesto</span>';
        return `<tr>
          <td class="mono">#${f.id}</td>
          <td>${CO2.esc(insumo?.nombre ?? f.insumo_codigo)}<span class="sub">${CO2.esc(insumo?.categoria ?? '')}</span></td>
          <td class="num">${fmt(f.valor, 5)}</td>
          <td class="mono">kg CO₂e/${CO2.esc(f.unidad)}</td>
          <td>${CO2.esc(f.fuente)}<span class="sub">Año de referencia ${f.anio}</span></td>
          <td>${estado}</td>
        </tr>`;
      })
      .join('');
  }

  function renderReferencias() {
    const form = document.getElementById('form-referencias');
    const editable = CO2.config.USE_MOCK;
    form.innerHTML =
      CO2.state.periodos
        .map(
          (p) => `<label class="campo">Matrícula ${p.anio}
            <input type="number" min="1" step="1" name="m-${p.anio}" value="${p.matricula ?? ''}" ${editable ? '' : 'disabled'} />
          </label>`
        )
        .join('') +
      (editable
        ? '<div class="acciones"><button type="submit" class="boton">Guardar matrícula</button><span class="ayuda">Valor provisorio: 10.000 estudiantes por año hasta tener el dato real.</span></div>'
        : '<p class="ayuda">En modo API la matrícula la provee la base central.</p>');
  }

  async function guardar(ev) {
    ev.preventDefault();
    const valores = {};
    for (const p of CO2.state.periodos) {
      const v = Number(ev.target.elements['m-' + p.anio].value);
      if (!(v > 0)) {
        CO2.mensaje(`La matrícula de ${p.anio} debe ser un número mayor a 0.`, 'error');
        return;
      }
      valores[p.anio] = v;
    }
    await CO2.api.guardarMatricula(valores);
    CO2.state.periodos = await CO2.api.getPeriodos();
    CO2.mensaje('Matrícula guardada. Los indicadores por estudiante ya usan los valores nuevos.');
  }

  function render() {
    renderFactores();
    renderReferencias();
  }

  function iniciar() {
    document.getElementById('form-referencias').addEventListener('submit', guardar);
  }

  CO2.factores = { iniciar, render };
})();
