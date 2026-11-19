// Registros: tabla con trazabilidad, filtros, total, edición, importación y exportación CSV.
window.CO2 = window.CO2 || {};

(function () {
  const { fmt } = CO2.calculo;
  const PLURAL = { resma: 'resmas', hoja: 'hojas', litro: 'litros', unidad: 'unidades' };
  const unidadTexto = (u, n) => (n === 1 ? u : PLURAL[u] || u);

  // Columnas de la plantilla de relevamiento / importación
  const COLUMNAS_PLANTILLA = ['anio', 'edificio', 'insumo_codigo', 'cantidad', 'unidad', 'gramaje', 'tipo_cambio', 'fecha', 'comprobante', 'calidad', 'observaciones'];

  function filtrados() {
    const anio = document.getElementById('filtro-periodo-reg').value;
    const cat = document.getElementById('filtro-categoria-reg').value;
    return CO2.state.registros
      .filter((r) => !anio || CO2.anioDe(r) === Number(anio))
      .filter((r) => !cat || CO2.categoriaDe(r) === cat)
      .sort((a, b) => CO2.anioDe(b) - CO2.anioDe(a) || (b.fecha || '').localeCompare(a.fecha || ''));
  }

  function render() {
    const tbody = document.querySelector('#tabla-registros tbody');
    const tfoot = document.querySelector('#tabla-registros tfoot');
    const lista = filtrados();
    document.getElementById('btn-csv').disabled = !lista.length;

    if (!lista.length) {
      const hayAlgo = CO2.state.registros.length > 0;
      tbody.innerHTML = `<tr><td colspan="8" class="vacio-tabla">${
        hayAlgo
          ? '<strong>Ningún registro coincide con los filtros.</strong>Cambiá el año o la categoría.'
          : '<strong>Todavía no hay registros.</strong>Cargá una compra, importá la planilla del relevamiento o probá con los datos de ejemplo.'
      }</td></tr>`;
      tfoot.innerHTML = '';
      return;
    }

    const editable = CO2.config.USE_MOCK;
    tbody.innerHTML = lista
      .map((r) => {
        const insumo = CO2.buscarInsumo(r.insumo_codigo);
        const pasos = r.resultado.formula.split(' | ').map((p) => `<li>${CO2.esc(p)}</li>`).join('');
        const nombre = CO2.esc(insumo?.nombre ?? r.insumo_codigo);
        const acciones = editable
          ? `<div class="acciones-fila">
               <button class="boton-fila" data-editar="${r.id}" aria-label="Editar ${nombre}">Editar</button>
               <button class="boton-fila peligro" data-borrar="${r.id}" aria-label="Borrar ${nombre}">Borrar</button>
             </div>`
          : '';
        return `<tr>
          <td class="mono">${CO2.anioDe(r)}</td>
          <td>${CO2.esc(CO2.nombreEdificio(r.edificio_id))}</td>
          <td>${nombre}${r.comprobante ? `<span class="sub">${CO2.esc(r.comprobante)}</span>` : ''}</td>
          <td class="num">${fmt(r.cantidad)} ${CO2.esc(unidadTexto(r.unidad, r.cantidad))}</td>
          <td class="num">${fmt(r.resultado.kgco2e, 2)}</td>
          <td><span class="calidad calidad-${CO2.esc(r.calidad)}" title="Calidad del dato ${CO2.esc(r.calidad)}">${CO2.esc(r.calidad)}</span></td>
          <td><details><summary>Ver cálculo</summary><ol class="pasos">${pasos}</ol></details></td>
          <td>${acciones}</td>
        </tr>`;
      })
      .join('');

    const total = lista.reduce((acc, r) => acc + r.resultado.kgco2e, 0);
    tfoot.innerHTML = `<tr>
      <td colspan="4">Total · ${lista.length} ${lista.length === 1 ? 'registro' : 'registros'}</td>
      <td class="num">${fmt(total, 2)}</td>
      <td colspan="3" class="mono">${fmt(total / 1000, 3)} t CO₂e</td>
    </tr>`;
  }

  // ---------- CSV: utilidades ----------
  const celda = (v) => {
    const s = String(v ?? '');
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  // Separador ";" y coma decimal: así lo abre bien Excel en español.
  const numeroCsv = (v) => (typeof v === 'number' ? String(Math.round(v * 1e6) / 1e6).replace('.', ',') : v);

  function descargar(nombre, filas) {
    const blob = new Blob(['﻿' + filas.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = nombre;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  /** Parser CSV simple con soporte de comillas. Detecta ";" o "," como separador. */
  function parsearCsv(texto) {
    texto = texto.replace(/^﻿/, '');
    const primera = texto.split(/\r?\n/, 1)[0];
    const sep = primera.split(';').length >= primera.split(',').length ? ';' : ',';
    const filas = [];
    let fila = [];
    let campo = '';
    let comillas = false;
    for (let i = 0; i < texto.length; i++) {
      const c = texto[i];
      if (comillas) {
        if (c === '"' && texto[i + 1] === '"') { campo += '"'; i++; }
        else if (c === '"') comillas = false;
        else campo += c;
      } else if (c === '"') comillas = true;
      else if (c === sep) { fila.push(campo); campo = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && texto[i + 1] === '\n') i++;
        fila.push(campo); filas.push(fila); fila = []; campo = '';
      } else campo += c;
    }
    if (campo || fila.length) { fila.push(campo); filas.push(fila); }
    return { sep, filas: filas.filter((f) => f.some((v) => v.trim() !== '')) };
  }

  // ---------- Exportar ----------
  function exportarCsv() {
    const lista = filtrados();
    const columnas = [
      ['anio', (r) => CO2.anioDe(r)],
      ['edificio', (r) => CO2.nombreEdificio(r.edificio_id)],
      ['categoria', (r) => CO2.categoriaDe(r)],
      ['insumo_codigo', (r) => r.insumo_codigo],
      ['insumo', (r) => CO2.buscarInsumo(r.insumo_codigo)?.nombre ?? r.insumo_codigo],
      ['cantidad', (r) => r.cantidad],
      ['unidad', (r) => r.unidad],
      ['cantidad_base', (r) => r.resultado.cantidadBase],
      ['factor_id', (r) => r.resultado.factorId],
      ['factor_kgco2e', (r) => r.resultado.factorValor],
      ['kgco2e', (r) => r.resultado.kgco2e],
      ['kgco2e_evitados', (r) => r.resultado.kgco2eEvitados || 0],
      ['alcance', (r) => r.resultado.alcance],
      ['fecha', (r) => r.fecha],
      ['comprobante', (r) => r.comprobante],
      ['calidad', (r) => r.calidad],
      ['formula', (r) => r.resultado.formula],
      ['observaciones', (r) => r.observaciones],
    ];
    const filas = [columnas.map(([n]) => n).join(';')].concat(
      lista.map((r) => columnas.map(([, f]) => celda(numeroCsv(f(r)))).join(';'))
    );
    descargar(`campusco2-papel-insumos-${new Date().toISOString().slice(0, 10)}.csv`, filas);
    CO2.mensaje(`CSV exportado con ${lista.length} registros.`);
  }

  function descargarPlantilla() {
    const ejemplo = ['2025', 'Edificio Central', 'PAPEL_A4_VIRGEN', '120', 'resma', '75', '', '15/03/2025', 'FC B 0003-00012345', 'A', 'Compra anual de Compras'];
    const codigos = CO2.state.insumos.map((i) => `${i.codigo} (${i.unidades.join('/')})`).join(' | ');
    const edificios = CO2.state.edificios.map((e) => e.nombre).join(' | ');
    descargar('plantilla-relevamiento-papel-insumos.csv', [
      COLUMNAS_PLANTILLA.join(';'),
      ejemplo.map(celda).join(';'),
      celda(`# Insumos válidos: ${codigos}`),
      celda(`# Edificios: ${edificios}`),
      celda('# Fecha: dd/mm/aaaa o aaaa-mm-dd. Calidad: A (comprobante), B (registro interno), C (estimación). Borrá estas líneas con # antes de importar.'),
    ]);
  }

  // ---------- Importar ----------
  function normalizarFecha(v) {
    v = (v || '').trim();
    const m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
    return v;
  }
  const numero = (v) => {
    v = String(v ?? '').trim();
    if (!v) return NaN;
    // "1.234,5" → 1234.5 ; "1234.5" → 1234.5
    if (v.includes(',')) v = v.replace(/\./g, '').replace(',', '.');
    return Number(v);
  };

  async function importarCsv(archivo) {
    const caja = document.getElementById('resultado-importacion');
    const texto = await archivo.text();
    const { filas } = parsearCsv(texto);
    const datos = filas.filter((f) => !f[0].trim().startsWith('#'));
    if (datos.length < 2) {
      caja.className = 'importacion con-errores';
      caja.innerHTML = 'El archivo no tiene filas para importar. Usá la plantilla como base.';
      caja.hidden = false;
      return;
    }

    const cabecera = datos[0].map((h) => h.trim().toLowerCase());
    const faltan = ['anio', 'edificio', 'insumo_codigo', 'cantidad', 'unidad', 'fecha', 'calidad'].filter((c) => !cabecera.includes(c));
    if (faltan.length) {
      caja.className = 'importacion con-errores';
      caja.innerHTML = `Faltan columnas en el archivo: <strong>${CO2.esc(faltan.join(', '))}</strong>. Descargá la plantilla para ver el formato.`;
      caja.hidden = false;
      return;
    }

    const validos = [];
    const errores = [];
    datos.slice(1).forEach((f, i) => {
      const col = (n) => (f[cabecera.indexOf(n)] ?? '').trim();
      const ed = col('edificio');
      const edificio = CO2.state.edificios.find((e) => String(e.id) === ed || e.nombre.toLowerCase() === ed.toLowerCase());
      const periodo = CO2.periodoPorAnio(col('anio'));
      const dato = {
        periodo_id: periodo?.id,
        edificio_id: edificio?.id,
        insumo_codigo: col('insumo_codigo').toUpperCase(),
        cantidad: numero(col('cantidad')),
        unidad: col('unidad'),
        gramaje: numero(col('gramaje')) || CO2.config.GRAMAJE_DEFAULT,
        tipo_cambio: numero(col('tipo_cambio')) || null,
        fecha: normalizarFecha(col('fecha')),
        comprobante: col('comprobante'),
        calidad: col('calidad').toUpperCase(),
        observaciones: col('observaciones'),
      };
      const errs = CO2.carga.validar(dato);
      if (!edificio) errs.edificio_id = `edificio "${ed}" no existe`;
      if (Object.keys(errs).length) {
        errores.push(`Fila ${i + 2}: ${Object.values(errs).join(' ')}`);
        return;
      }
      try {
        const { lineas, ...registro } = CO2.procesarRegistro(dato);
        validos.push(registro);
      } catch (e) {
        errores.push(`Fila ${i + 2}: ${e.message}`);
      }
    });

    for (const r of validos) await CO2.api.guardarRegistro(r);
    await CO2.recargarRegistros();
    render();

    caja.className = 'importacion ' + (errores.length ? 'con-errores' : 'ok');
    caja.innerHTML =
      `Se importaron <strong>${validos.length}</strong> de ${datos.length - 1} filas.` +
      (errores.length
        ? ` Las siguientes no se importaron; corregilas en el archivo y volvé a importarlas:<ul>${errores
            .slice(0, 20)
            .map((e) => `<li>${CO2.esc(e)}</li>`)
            .join('')}${errores.length > 20 ? `<li>… y ${errores.length - 20} más</li>` : ''}</ul>`
        : '');
    caja.hidden = false;
    CO2.mensaje(`Importación terminada: ${validos.length} registros nuevos.`);
  }

  // ---------- Datos de ejemplo ----------
  async function cargarEjemplos(avisar = true) {
    if (!CO2.config.USE_MOCK) return CO2.mensaje('Los datos de ejemplo solo se cargan en modo prueba.', 'error');
    const nuevos = CO2.mock.ejemplos.map(([anio, edificio, codigo, cantidad, unidad], i) => {
      const { lineas, ...registro } = CO2.procesarRegistro({
        periodo_id: anio,
        edificio_id: edificio,
        insumo_codigo: codigo,
        cantidad,
        unidad,
        gramaje: CO2.config.GRAMAJE_DEFAULT,
        tipo_cambio: null,
        fecha: `${anio}-0${(i % 9) + 1}-15`,
        comprobante: 'EJEMPLO-' + (i + 1),
        calidad: 'C',
        observaciones: 'Dato de ejemplo (no real)',
      });
      return { ...registro, id: Date.now() + i };
    });
    const sinEjemplos = CO2.state.registros.filter((r) => !String(r.comprobante).startsWith('EJEMPLO-'));
    CO2.api.reemplazarRegistrosLocales([...sinEjemplos, ...nuevos]);
    await CO2.recargarRegistros();
    render();
    CO2.visualizacion.render();
    if (avisar) CO2.mensaje(`Se cargaron ${nuevos.length} registros de ejemplo.`);
  }
  CO2.cargarEjemplos = cargarEjemplos;

  // ---------- Inicio ----------
  function iniciar() {
    const selAnio = document.getElementById('filtro-periodo-reg');
    selAnio.innerHTML =
      '<option value="">Todos</option>' +
      CO2.state.periodos.map((p) => `<option value="${p.anio}">${p.anio}</option>`).join('');
    const selCat = document.getElementById('filtro-categoria-reg');
    selCat.innerHTML =
      '<option value="">Todas</option>' + CO2.CATEGORIAS.map((c) => `<option>${CO2.esc(c)}</option>`).join('');
    selAnio.addEventListener('change', render);
    selCat.addEventListener('change', render);

    document.getElementById('btn-csv').addEventListener('click', exportarCsv);
    document.getElementById('btn-plantilla').addEventListener('click', descargarPlantilla);
    const archivo = document.getElementById('archivo-csv');
    document.getElementById('btn-importar').addEventListener('click', () => archivo.click());
    archivo.addEventListener('change', async () => {
      if (archivo.files[0]) await importarCsv(archivo.files[0]);
      archivo.value = '';
    });

    document.querySelector('#tabla-registros tbody').addEventListener('click', async (ev) => {
      const editar = ev.target.closest('[data-editar]')?.dataset.editar;
      if (editar) {
        const r = CO2.state.registros.find((x) => x.id === Number(editar));
        if (r) CO2.carga.editar(r);
        return;
      }
      const id = ev.target.closest('[data-borrar]')?.dataset.borrar;
      if (!id || !confirm('¿Borrar este registro? No se puede deshacer.')) return;
      await CO2.api.eliminarRegistro(Number(id));
      await CO2.recargarRegistros();
      render();
      CO2.mensaje('Registro borrado.');
    });
  }

  CO2.registros = { iniciar, render, parsearCsv, importarCsv };
})();
