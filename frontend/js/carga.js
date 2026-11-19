// Módulo de carga: formulario, validaciones, edición y cálculo en vivo.
window.CO2 = window.CO2 || {};

(function () {
  const { fmt } = CO2.calculo;
  let form;
  let editandoId = null;

  const NOMBRE_UNIDAD = {
    resma: 'resma (500 hojas)',
    hoja: 'hoja',
    kg: 'kg (kilogramos)',
    g: 'g (gramos)',
    t: 't (toneladas)',
    litro: 'litro',
    unidad: 'unidad',
    ARS: 'ARS (pesos)',
    USD: 'USD (dólares)',
  };

  const usaGramaje = (insumo, unidad) => insumo?.categoria === 'Papel' && (unidad === 'resma' || unidad === 'hoja');
  const usaCambio = (unidad) => unidad === 'ARS';

  // ---------- Lectura y validación ----------
  function leerFormulario() {
    const f = new FormData(form);
    return {
      periodo_id: Number(f.get('periodo_id')),
      edificio_id: Number(f.get('edificio_id')),
      insumo_codigo: f.get('insumo_codigo'),
      cantidad: Number(f.get('cantidad')),
      unidad: f.get('unidad'),
      gramaje: Number(f.get('gramaje')) || CO2.config.GRAMAJE_DEFAULT,
      tipo_cambio: Number(f.get('tipo_cambio')) || null,
      fecha: f.get('fecha'),
      comprobante: (f.get('comprobante') || '').trim(),
      calidad: f.get('calidad'),
      observaciones: (f.get('observaciones') || '').trim(),
    };
  }

  /** Devuelve { campo: mensaje } con los errores. También la usa la importación de CSV. */
  function validar(d) {
    const errores = {};
    const insumo = CO2.buscarInsumo(d.insumo_codigo);
    const p = CO2.periodo(d.periodo_id);

    if (!p) errores.periodo_id = 'Elegí un año válido.';
    if (!CO2.state.edificios.some((e) => e.id === Number(d.edificio_id))) errores.edificio_id = 'Elegí un edificio.';
    if (!insumo) errores.insumo_codigo = 'Elegí un insumo.';

    if (!Number.isFinite(d.cantidad) || d.cantidad <= 0) errores.cantidad = 'La cantidad debe ser mayor a 0.';
    else if (d.cantidad > 1e9) errores.cantidad = 'La cantidad parece demasiado grande. Revisá la unidad.';

    if (insumo && !insumo.unidades.includes(d.unidad)) errores.unidad = `Unidad no válida para este insumo (${insumo.unidades.join(', ')}).`;
    if (usaGramaje(insumo, d.unidad) && (d.gramaje < 40 || d.gramaje > 300)) errores.gramaje = 'El gramaje debe estar entre 40 y 300 g/m².';
    if (usaCambio(d.unidad) && !(d.tipo_cambio > 0)) errores.tipo_cambio = 'Ingresá el tipo de cambio del día del comprobante.';

    if (!d.fecha || !/^\d{4}-\d{2}-\d{2}$/.test(d.fecha)) errores.fecha = 'Elegí la fecha del comprobante.';
    else if (p && Number(d.fecha.slice(0, 4)) !== p.anio) errores.fecha = `La fecha debe ser del año ${p.anio}.`;

    if (!['A', 'B', 'C'].includes(d.calidad)) errores.calidad = 'La calidad debe ser A, B o C.';
    else if (d.calidad === 'A' && !d.comprobante) errores.comprobante = 'Con calidad A hace falta el número de comprobante.';
    return errores;
  }

  function mostrarErrores(errores) {
    form.querySelectorAll('.error-campo').forEach((e) => e.remove());
    form.querySelectorAll('.invalido').forEach((e) => e.classList.remove('invalido'));
    Object.entries(errores).forEach(([campo, msg]) => {
      const input = form.elements[campo];
      if (!input || !input.insertAdjacentElement) return;
      input.classList.add('invalido');
      const span = document.createElement('span');
      span.className = 'error-campo';
      span.textContent = msg;
      input.insertAdjacentElement('afterend', span);
    });
  }

  // ---------- Campos dependientes ----------
  function actualizarUnidades() {
    const insumo = CO2.buscarInsumo(form.elements.insumo_codigo.value);
    const sel = form.elements.unidad;
    const previa = sel.value;
    sel.innerHTML = (insumo ? insumo.unidades : [])
      .map((u) => `<option value="${CO2.esc(u)}">${CO2.esc(NOMBRE_UNIDAD[u] || u)}</option>`)
      .join('');
    if (insumo?.unidades.includes(previa)) sel.value = previa;
    actualizarVisibilidad();
  }

  function actualizarVisibilidad() {
    const insumo = CO2.buscarInsumo(form.elements.insumo_codigo.value);
    const unidad = form.elements.unidad.value;
    document.getElementById('campo-gramaje').hidden = !usaGramaje(insumo, unidad);
    document.getElementById('campo-cambio').hidden = !usaCambio(unidad);
    document.getElementById('estimador-examenes').hidden = insumo?.categoria !== 'Papel';
  }

  function configurarFecha() {
    const input = form.elements.fecha;
    const p = CO2.periodo(form.elements.periodo_id.value);
    if (!p) return;
    input.min = `${p.anio}-01-01`;
    input.max = `${p.anio}-12-31`;
    if (input.value && !input.value.startsWith(String(p.anio))) input.value = '';
  }

  function abrirCalendario(ev) {
    ev.preventDefault();
    try {
      form.elements.fecha.showPicker();
    } catch {
      /* navegadores sin showPicker: se abre con el ícono */
    }
  }

  // ---------- Cálculo en vivo ----------
  function actualizarPreview() {
    const d = leerFormulario();
    const insumo = CO2.buscarInsumo(d.insumo_codigo);
    const total = document.getElementById('preview-resultado');
    const lista = document.getElementById('preview-pasos');
    const evitadas = document.getElementById('preview-evitadas');
    const fuente = document.getElementById('preview-factor');
    const cabecera = document.getElementById('calculo-insumo');

    lista.innerHTML = '';
    evitadas.textContent = '';
    fuente.textContent = '';
    fuente.classList.remove('error');
    total.textContent = '0 kg CO₂e';

    if (!insumo) {
      cabecera.textContent = 'Elegí un insumo y escribí una cantidad.';
      return;
    }
    const p = CO2.periodo(d.periodo_id);
    cabecera.innerHTML = `<strong>${CO2.esc(insumo.nombre)}</strong>${CO2.esc(CO2.nombreEdificio(d.edificio_id))} · ${p ? p.anio : ''}`;

    const mensaje = (texto) => {
      const li = document.createElement('li');
      li.className = 'mensaje';
      li.textContent = texto;
      lista.appendChild(li);
    };

    if (!d.cantidad || d.cantidad <= 0) return mensaje('Escribí la cantidad comprada para ver el cálculo.');

    try {
      const { resultado: r, lineas } = CO2.procesarRegistro(d);
      lineas.forEach((l) => {
        const li = document.createElement('li');
        li.innerHTML =
          `<span class="op">${CO2.esc(l.op)}</span>` +
          (l.nota ? `<small>${CO2.esc(l.nota)}</small>` : '') +
          `<span class="res">= ${CO2.esc(l.res)}</span>`;
        lista.appendChild(li);
      });
      total.textContent = `${fmt(r.kgco2e, 2)} kg CO₂e`;
      if (r.kgco2eEvitados > 0) {
        evitadas.textContent = `Por ser reciclado evita ${fmt(r.kgco2eEvitados, 2)} kg CO₂e frente al papel virgen.`;
      }
      fuente.textContent = `Fuente del factor: ${r.factorFuente}.`;
    } catch (e) {
      mensaje(e.message);
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

  // ---------- Edición ----------
  function salirDeEdicion() {
    editandoId = null;
    document.getElementById('aviso-edicion').hidden = true;
    document.getElementById('btn-guardar').textContent = 'Guardar registro';
  }

  /** Carga un registro existente en el formulario para editarlo. */
  function editar(registro) {
    // No se usa form.reset(): su manejador sale del modo edición.
    editandoId = registro.id;
    form.elements.periodo_id.value = registro.periodo_id;
    configurarFecha();
    form.elements.edificio_id.value = registro.edificio_id;
    form.elements.insumo_codigo.value = registro.insumo_codigo;
    actualizarUnidades();
    form.elements.unidad.value = registro.unidad;
    form.elements.cantidad.value = registro.cantidad;
    form.elements.gramaje.value = registro.gramaje || CO2.config.GRAMAJE_DEFAULT;
    form.elements.tipo_cambio.value = registro.tipo_cambio || '';
    form.elements.fecha.value = registro.fecha || '';
    form.elements.comprobante.value = registro.comprobante || '';
    form.elements.calidad.value = registro.calidad || 'A';
    form.elements.observaciones.value = registro.observaciones || '';
    actualizarVisibilidad();
    mostrarErrores({});
    actualizarPreview();
    document.getElementById('aviso-edicion').hidden = false;
    document.getElementById('btn-guardar').textContent = 'Guardar cambios';
    CO2.irA('carga');
    form.elements.insumo_codigo.focus();
  }

  async function onSubmit(ev) {
    ev.preventDefault();
    const d = leerFormulario();
    const errores = validar(d);
    mostrarErrores(errores);
    if (Object.keys(errores).length) {
      CO2.mensaje('No se guardó: corregí los campos marcados en rojo.', 'error');
      form.querySelector('.invalido')?.focus();
      return;
    }
    const btn = document.getElementById('btn-guardar');
    btn.disabled = true;
    try {
      const { lineas, ...registro } = CO2.procesarRegistro(d);
      if (editandoId) {
        await CO2.api.actualizarRegistro(editandoId, registro);
        CO2.mensaje(`Cambios guardados: ${fmt(registro.resultado.kgco2e, 2)} kg CO₂e.`);
        salirDeEdicion();
      } else {
        await CO2.api.guardarRegistro(registro);
        CO2.mensaje(`Registro guardado: ${fmt(registro.resultado.kgco2e, 2)} kg CO₂e.`);
      }
      await CO2.recargarRegistros();
      form.elements.cantidad.value = '';
      form.elements.comprobante.value = '';
      form.elements.observaciones.value = '';
      actualizarPreview();
    } catch (e) {
      CO2.mensaje('No se pudo guardar: ' + e.message, 'error');
    } finally {
      btn.disabled = false;
    }
  }

  // ---------- Inicio ----------
  function iniciar() {
    form = document.getElementById('form-carga');
    const s = CO2.state;

    form.elements.periodo_id.innerHTML = s.periodos.map((p) => `<option value="${p.id}">${p.anio}</option>`).join('');
    form.elements.edificio_id.innerHTML = s.edificios.map((e) => `<option value="${e.id}">${CO2.esc(e.nombre)}</option>`).join('');
    form.elements.insumo_codigo.innerHTML = CO2.CATEGORIAS.map((cat) => {
      const items = s.insumos.filter((i) => i.categoria === cat);
      if (!items.length) return '';
      return `<optgroup label="${CO2.esc(cat)}">${items
        .map((i) => `<option value="${CO2.esc(i.codigo)}">${CO2.esc(i.nombre)}</option>`)
        .join('')}</optgroup>`;
    }).join('');

    const ultimo = s.periodos[s.periodos.length - 1];
    if (ultimo) form.elements.periodo_id.value = ultimo.id;
    actualizarUnidades();
    configurarFecha();

    const fecha = form.elements.fecha;
    fecha.addEventListener('keydown', (ev) => {
      if (ev.key !== 'Tab') ev.preventDefault(); // no se puede tipear; Tab sigue navegando
      if (ev.key === 'Enter' || ev.key === ' ') abrirCalendario(ev);
    });
    fecha.addEventListener('paste', (ev) => ev.preventDefault());
    fecha.addEventListener('click', abrirCalendario);

    form.elements.periodo_id.addEventListener('change', configurarFecha);
    form.elements.insumo_codigo.addEventListener('change', actualizarUnidades);
    form.elements.unidad.addEventListener('change', actualizarVisibilidad);
    form.addEventListener('input', actualizarPreview);
    form.addEventListener('change', actualizarPreview);
    form.addEventListener('submit', onSubmit);
    form.addEventListener('reset', () =>
      setTimeout(() => {
        mostrarErrores({});
        salirDeEdicion();
        if (ultimo) form.elements.periodo_id.value = ultimo.id;
        actualizarUnidades();
        configurarFecha();
        actualizarPreview();
      })
    );
    document.getElementById('cancelar-edicion').addEventListener('click', () => form.reset());

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
    actualizarPreview();
  }

  CO2.carga = { iniciar, validar, editar };
})();
