// Módulo de carga: formulario, validaciones y vista previa del cálculo.
window.CO2 = window.CO2 || {};

(function () {
  const { fmt } = CO2.calculo;
  let form;

  const opciones = (sel, items, valor, texto) => {
    sel.innerHTML = items.map((i) => `<option value="${CO2.esc(valor(i))}">${CO2.esc(texto(i))}</option>`).join('');
  };

  function leerFormulario() {
    const f = new FormData(form);
    return {
      periodo_id: Number(f.get('periodo_id')),
      edificio_id: Number(f.get('edificio_id')),
      insumo_codigo: f.get('insumo_codigo'),
      cantidad: Number(f.get('cantidad')),
      unidad: f.get('unidad'),
      gramaje: Number(f.get('gramaje')) || CO2.config.GRAMAJE_DEFAULT,
      fecha: f.get('fecha'),
      comprobante: f.get('comprobante').trim(),
      calidad: f.get('calidad'),
      observaciones: f.get('observaciones').trim(),
    };
  }

  // Devuelve un objeto { campo: mensaje } con los errores encontrados.
  function validar(d) {
    const errores = {};
    if (!d.periodo_id) errores.periodo_id = 'Elegí un período.';
    if (!d.edificio_id) errores.edificio_id = 'Elegí un edificio.';
    if (!CO2.buscarInsumo(d.insumo_codigo)) errores.insumo_codigo = 'Elegí un insumo.';
    if (!Number.isFinite(d.cantidad) || d.cantidad <= 0) errores.cantidad = 'La cantidad debe ser mayor a 0.';
    else if (d.cantidad > 1e7) errores.cantidad = 'La cantidad parece demasiado grande.';

    const insumo = CO2.buscarInsumo(d.insumo_codigo);
    if (insumo && !insumo.unidades.includes(d.unidad)) errores.unidad = 'Unidad no válida para este insumo.';
    if (usaGramaje(insumo, d.unidad) && (d.gramaje < 40 || d.gramaje > 300)) {
      errores.gramaje = 'El gramaje debe estar entre 40 y 300 g/m².';
    }
    if (!d.fecha) errores.fecha = 'Ingresá la fecha del comprobante.';
    else {
      const anio = Number(d.fecha.slice(0, 4));
      const p = CO2.periodo(d.periodo_id);
      if (p && anio !== p.anio) errores.fecha = `La fecha debe pertenecer al año ${p.anio}.`;
    }
    if (d.calidad === 'A' && !d.comprobante) errores.comprobante = 'Con calidad A se requiere el n.º de comprobante.';
    return errores;
  }

  const usaGramaje = (insumo, unidad) => insumo?.categoria === 'Papel' && (unidad === 'resma' || unidad === 'hoja');

  function mostrarErrores(errores) {
    form.querySelectorAll('.error-campo').forEach((e) => e.remove());
    form.querySelectorAll('.invalido').forEach((e) => e.classList.remove('invalido'));
    Object.entries(errores).forEach(([campo, msg]) => {
      const input = form.elements[campo];
      if (!input) return;
      input.classList.add('invalido');
      const span = document.createElement('span');
      span.className = 'error-campo';
      span.textContent = msg;
      input.insertAdjacentElement('afterend', span);
    });
  }

  function actualizarUnidades() {
    const insumo = CO2.buscarInsumo(form.elements.insumo_codigo.value);
    const sel = form.elements.unidad;
    const previa = sel.value;
    opciones(sel, insumo ? insumo.unidades : [], (u) => u, (u) => u);
    if (insumo?.unidades.includes(previa)) sel.value = previa;
    actualizarVisibilidad();
  }

  function actualizarVisibilidad() {
    const insumo = CO2.buscarInsumo(form.elements.insumo_codigo.value);
    document.getElementById('campo-gramaje').classList.toggle('oculto', !usaGramaje(insumo, form.elements.unidad.value));
    document.getElementById('estimador-examenes').classList.toggle('oculto', insumo?.categoria !== 'Papel');
  }

  function actualizarPreview() {
    const d = leerFormulario();
    const res = document.getElementById('preview-resultado');
    const pasos = document.getElementById('preview-pasos');
    const fuente = document.getElementById('preview-factor');
    pasos.innerHTML = '';
    fuente.textContent = '';
    if (!d.cantidad || d.cantidad <= 0 || !CO2.buscarInsumo(d.insumo_codigo)) {
      res.textContent = '—';
      return;
    }
    try {
      const { resultado: r } = CO2.procesarRegistro(d);
      res.innerHTML = `${fmt(r.kgco2e, 2)} <small>kg CO₂e</small>`;
      r.formula.split(' | ').forEach((p) => {
        const li = document.createElement('li');
        li.textContent = p;
        pasos.appendChild(li);
      });
      if (r.kgco2eEvitados > 0) {
        fuente.textContent = `Emisiones evitadas vs. papel virgen: ${fmt(r.kgco2eEvitados, 2)} kg CO₂e`;
      }
    } catch (e) {
      res.textContent = '—';
      fuente.textContent = e.message;
    }
  }

  function estimadorExamenes() {
    const v = (id) => Number(document.getElementById(id).value) || 0;
    const total = CO2.calculo.hojasExamenes({
      hojasPorExamen: v('ex-hojas'),
      alumnosPorMesa: v('ex-alumnos'),
      catedras: v('ex-catedras'),
      turnos: v('ex-turnos'),
    });
    document.getElementById('ex-total').textContent = fmt(total, 0);
    return total;
  }

  async function onSubmit(ev) {
    ev.preventDefault();
    const d = leerFormulario();
    const errores = validar(d);
    mostrarErrores(errores);
    if (Object.keys(errores).length) {
      CO2.mensaje('Revisá los campos marcados.', 'error');
      return;
    }
    const btn = form.querySelector('button[type=submit]');
    btn.disabled = true;
    try {
      const registro = CO2.procesarRegistro(d);
      await CO2.api.guardarRegistro(registro);
      await CO2.recargarRegistros();
      CO2.mensaje(`Guardado: ${fmt(registro.resultado.kgco2e, 2)} kg CO₂e.`);
      form.elements.cantidad.value = '';
      form.elements.comprobante.value = '';
      form.elements.observaciones.value = '';
      actualizarPreview();
    } catch (e) {
      CO2.mensaje('Error al guardar: ' + e.message, 'error');
    } finally {
      btn.disabled = false;
    }
  }

  function iniciar() {
    form = document.getElementById('form-carga');
    const s = CO2.state;
    opciones(form.elements.periodo_id, s.periodos, (p) => p.id, (p) => p.anio);
    opciones(form.elements.edificio_id, s.edificios, (e) => e.id, (e) => e.nombre);
    opciones(form.elements.insumo_codigo, s.insumos, (i) => i.codigo, (i) => `${i.categoria} — ${i.nombre}`);

    // Período por defecto: el año más reciente
    const ultimo = s.periodos[s.periodos.length - 1];
    if (ultimo) form.elements.periodo_id.value = ultimo.id;

    actualizarUnidades();

    form.elements.insumo_codigo.addEventListener('change', actualizarUnidades);
    form.elements.unidad.addEventListener('change', actualizarVisibilidad);
    form.addEventListener('input', actualizarPreview);
    form.addEventListener('change', actualizarPreview);
    form.addEventListener('submit', onSubmit);
    form.addEventListener('reset', () =>
      setTimeout(() => {
        mostrarErrores({});
        if (ultimo) form.elements.periodo_id.value = ultimo.id;
        actualizarUnidades();
        actualizarPreview();
      })
    );

    document.querySelectorAll('#estimador-examenes input').forEach((i) => i.addEventListener('input', estimadorExamenes));
    document.getElementById('ex-usar').addEventListener('click', () => {
      form.elements.unidad.value = 'hoja';
      form.elements.cantidad.value = estimadorExamenes();
      form.elements.calidad.value = 'C';
      form.elements.observaciones.value = 'Estimación de papel de exámenes finales';
      actualizarVisibilidad();
      actualizarPreview();
    });
    estimadorExamenes();
  }

  CO2.carga = { iniciar, validar };
})();
