// Panel: indicadores clave y gráficos (Chart.js), tema oscuro.
window.CO2 = window.CO2 || {};

(function () {
  const { fmt } = CO2.calculo;
  const graficos = {};
  let anioElegidoPorUsuario = false;

  // Paleta categórica validada para fondo oscuro (#161b22): daltonismo, separación y contraste >= 3:1.
  // El orden es fijo: cada categoría tiene siempre el mismo color.
  const COLOR_CATEGORIA = {
    Papel: '#3987e5',
    Cartón: '#d95926',
    Impresión: '#199e70',
    Librería: '#c98500',
    Limpieza: '#d55181',
    Tissue: '#0ca30c',
    Plásticos: '#9085e9',
    Servicios: '#e66767',
    Otro: '#7d8896',
  };
  const ACENTO = '#2dd4bf';
  const ANTERIOR = '#4b5563';
  const VIRGEN = COLOR_CATEGORIA.Papel;
  const RECICLADO = COLOR_CATEGORIA.Impresión;
  const SUPERFICIE = '#161b22';
  const TEXTO = '#a6b1bf';
  const GRILLA = '#232a33';
  const EJE = '#363f4b';

  const sumar = (lista, fn) => lista.reduce((acc, r) => acc + fn(r), 0);
  const kg = (r) => r.resultado.kgco2e;
  const esPapel = (r) => CO2.categoriaDe(r) === 'Papel';
  const esReciclado = (r) => (CO2.buscarInsumo(r.insumo_codigo)?.reciclado || 0) > 0;
  const delAnio = (anio) => CO2.state.registros.filter((r) => CO2.anioDe(r) === anio);
  const NBSP = ' ';

  function porCategoria(lista) {
    const tot = {};
    lista.forEach((r) => (tot[CO2.categoriaDe(r)] = (tot[CO2.categoriaDe(r)] || 0) + kg(r)));
    return tot;
  }

  // ---------- Indicadores ----------
  function stat({ titulo, valor, unidad = '', detalle = '', principal = false, extra = '' }) {
    return `<div class="stat${principal ? ' stat-principal' : ''}">
      <dt>${titulo}</dt>
      <dd><span class="stat-valor">${valor}</span>${unidad ? `<span class="stat-unidad">${unidad}</span>` : ''}
        ${extra}
        ${detalle ? `<span class="stat-detalle">${detalle}</span>` : ''}</dd>
    </div>`;
  }

  function delta(actual, anterior, anio) {
    if (!(anterior > 0)) return `sin datos de ${anio - 1}`;
    const v = ((actual - anterior) / anterior) * 100;
    const clase = v > 0 ? 'sube' : 'baja';
    const signo = v > 0 ? '+' : v < 0 ? '−' : '';
    return `<span class="delta ${clase}">${signo}${fmt(Math.abs(v), 1)}${NBSP}%</span> vs. ${anio - 1}`;
  }

  // ---------- Gráficos ----------
  function configurarChart() {
    Object.assign(Chart.defaults, { color: TEXTO, borderColor: GRILLA, maintainAspectRatio: false });
    Chart.defaults.font.family = "'IBM Plex Sans', system-ui, sans-serif";
    Chart.defaults.font.size = 12;
    Object.assign(Chart.defaults.plugins.legend.labels, { boxWidth: 10, boxHeight: 10, useBorderRadius: true, borderRadius: 2, padding: 14 });
    Object.assign(Chart.defaults.plugins.tooltip, {
      backgroundColor: '#0a0e13',
      borderColor: EJE,
      borderWidth: 1,
      titleColor: '#e6edf3',
      bodyColor: '#e6edf3',
      padding: 10,
      cornerRadius: 6,
      boxPadding: 4,
    });
  }

  function dibujar(id, config) {
    graficos[id]?.destroy();
    graficos[id] = new Chart(document.getElementById(id), config);
  }

  const ejeValor = (extra = {}) => ({
    beginAtZero: true,
    border: { display: false },
    grid: { color: GRILLA },
    ticks: { callback: (v) => fmt(v, 1) },
    ...extra,
  });
  const ejeCategoria = (extra = {}) => ({ grid: { display: false }, border: { color: EJE }, ...extra });
  const barra = { borderRadius: 4, borderSkipped: 'start', maxBarThickness: 34 };

  function graficarCategorias(lista, total) {
    const tot = porCategoria(lista);
    const cats = CO2.CATEGORIAS.filter((c) => tot[c] > 0).concat(tot.Otro ? ['Otro'] : []);
    dibujar('g-categorias', {
      type: 'doughnut',
      data: {
        labels: cats,
        datasets: [{
          data: cats.map((c) => tot[c]),
          backgroundColor: cats.map((c) => COLOR_CATEGORIA[c]),
          borderColor: SUPERFICIE,
          borderWidth: 2,
          hoverOffset: 6,
        }],
      },
      options: {
        cutout: '64%',
        plugins: {
          legend: {
            position: 'right',
            labels: {
              // El porcentaje va en la leyenda: el color no es la única forma de leer el dato.
              generateLabels: (chart) =>
                Chart.overrides.doughnut.plugins.legend.labels.generateLabels(chart).map((l) => ({
                  ...l,
                  fontColor: TEXTO,
                  text: `${l.text}  ${fmt((chart.data.datasets[0].data[l.index] / total) * 100, 1)} %`,
                })),
            },
          },
          tooltip: { callbacks: { label: (c) => ` ${fmt(c.parsed, 1)} kg CO₂e (${fmt((c.parsed / total) * 100, 1)} %)` } },
        },
      },
    });
  }

  function graficarComparacion(anio, lista, listaAnt) {
    const act = porCategoria(lista);
    const ant = porCategoria(listaAnt);
    const cats = CO2.CATEGORIAS.filter((c) => act[c] > 0 || ant[c] > 0);
    dibujar('g-comparacion', {
      type: 'bar',
      data: {
        labels: cats,
        datasets: [
          { label: String(anio - 1), data: cats.map((c) => ant[c] || 0), backgroundColor: ANTERIOR, ...barra },
          { label: String(anio), data: cats.map((c) => act[c] || 0), backgroundColor: ACENTO, ...barra },
        ],
      },
      options: {
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position: 'top', align: 'end' },
          tooltip: { callbacks: { label: (c) => ` ${c.dataset.label}: ${fmt(c.parsed.y, 1)} kg CO₂e` } },
        },
        scales: { x: ejeCategoria(), y: ejeValor() },
      },
    });
  }

  function graficarEvolucion(anios) {
    dibujar('g-evolucion', {
      type: 'line',
      data: {
        labels: anios,
        datasets: [{
          label: 't CO₂e',
          // Un año sin registros queda como hueco (null), no como 0.
          data: anios.map((a) => (delAnio(a).length ? sumar(delAnio(a), kg) / 1000 : null)),
          spanGaps: false,
          cubicInterpolationMode: 'monotone',
          borderColor: ACENTO,
          backgroundColor: 'rgba(45, 212, 191, 0.10)',
          borderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: ACENTO,
          pointBorderColor: SUPERFICIE,
          pointBorderWidth: 2,
          fill: true,
        }],
      },
      options: {
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (c) => ` ${fmt(c.parsed.y, 2)} t CO₂e` } },
        },
        scales: { x: ejeCategoria(), y: ejeValor({ ticks: { callback: (v) => fmt(v, 2) } }) },
      },
    });
  }

  function graficarPapel(anios) {
    const kgPor = (a, rec) => sumar(delAnio(a).filter((r) => esPapel(r) && esReciclado(r) === rec), (r) => r.resultado.cantidadBase);
    dibujar('g-papel', {
      type: 'bar',
      data: {
        labels: anios,
        datasets: [
          { label: 'Virgen', data: anios.map((a) => kgPor(a, false)), backgroundColor: VIRGEN, borderRadius: 0, maxBarThickness: 42 },
          {
            label: 'Reciclado',
            data: anios.map((a) => kgPor(a, true)),
            backgroundColor: RECICLADO,
            borderColor: SUPERFICIE,
            borderWidth: { bottom: 2 }, // separación de 2 px entre segmentos
            borderSkipped: false,
            borderRadius: { topLeft: 4, topRight: 4 },
            maxBarThickness: 42,
          },
        ],
      },
      options: {
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position: 'top', align: 'end' },
          tooltip: { callbacks: { label: (c) => ` ${c.dataset.label}: ${fmt(c.parsed.y, 0)} kg` } },
        },
        scales: { x: ejeCategoria({ stacked: true }), y: ejeValor({ stacked: true, ticks: { callback: (v) => fmt(v, 0) } }) },
      },
    });
  }

  function graficarEdificios(lista) {
    const tot = {};
    lista.forEach((r) => {
      const n = CO2.nombreEdificio(r.edificio_id);
      tot[n] = (tot[n] || 0) + kg(r);
    });
    const orden = Object.entries(tot).sort((a, b) => b[1] - a[1]);
    dibujar('g-edificios', {
      type: 'bar',
      data: {
        labels: orden.map(([n]) => n),
        datasets: [{ label: 'kg CO₂e', data: orden.map(([, v]) => v), backgroundColor: ACENTO, ...barra, maxBarThickness: 20 }],
      },
      options: {
        indexAxis: 'y',
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (c) => ` ${fmt(c.parsed.x, 1)} kg CO₂e` } },
        },
        scales: { x: ejeValor(), y: { grid: { display: false }, border: { color: EJE } } },
      },
    });
  }

  // ---------- Render ----------
  function render() {
    const sel = document.getElementById('filtro-periodo-ind');
    const conDatos = [...new Set(CO2.state.registros.map(CO2.anioDe))].sort();
    if (!anioElegidoPorUsuario && conDatos.length) sel.value = String(conDatos.at(-1));

    const anio = Number(sel.value);
    const lista = delAnio(anio);
    const listaAnt = delAnio(anio - 1);
    const vacio = document.getElementById('panel-vacio');
    const datos = document.getElementById('panel-datos');

    if (!lista.length) {
      vacio.hidden = false;
      datos.hidden = true;
      document.getElementById('vacio-titulo').textContent = `No hay registros de ${anio}`;
      document.getElementById('vacio-texto').textContent = conDatos.length
        ? `Hay datos de ${conDatos.join(', ')}. Elegí otro año arriba o cargá compras de ${anio}.`
        : 'Los indicadores aparecen cuando cargás la primera compra o importás la planilla del relevamiento.';
      return;
    }
    vacio.hidden = true;
    datos.hidden = false;

    // ---- Cálculos ----
    const total = sumar(lista, kg);
    const totalAnt = sumar(listaAnt, kg);
    const papel = lista.filter(esPapel);
    const kgPapel = sumar(papel, (r) => r.resultado.cantidadBase);
    const kgReciclado = sumar(papel.filter(esReciclado), (r) => r.resultado.cantidadBase);
    const pctReciclado = kgPapel ? (kgReciclado / kgPapel) * 100 : 0;
    const evitadas = sumar(lista, (r) => r.resultado.kgco2eEvitados || 0);
    const fV = CO2.buscarFactor('PAPEL_A4_VIRGEN');
    const fR = CO2.buscarFactor('PAPEL_A4_RECICLADO');
    const potencial = fV && fR ? CO2.calculo.evitadasPorReciclado(kgPapel - kgReciclado, fV.valor, fR.valor) : 0;
    const matricula = CO2.periodoPorAnio(anio)?.matricula;
    const pesoHoja = CO2.calculo.pesoHojaKg('A4', CO2.config.GRAMAJE_DEFAULT);
    const hojas = kgPapel / pesoHoja;
    const tot = porCategoria(lista);
    const [catTop, kgTop] = Object.entries(tot).sort((a, b) => b[1] - a[1])[0];

    document.getElementById('kpis').innerHTML = [
      stat({ titulo: 'Emisiones totales', valor: fmt(total / 1000, 2), unidad: 't CO₂e', detalle: delta(total, totalAnt, anio), principal: true }),
      stat({ titulo: 'Papel comprado', valor: fmt(kgPapel, 0), unidad: 'kg', detalle: `${fmt(hojas, 0)} hojas A4 equivalentes` }),
      stat({
        titulo: 'Papel reciclado',
        valor: fmt(pctReciclado, 1),
        unidad: '%',
        extra: `<div class="medidor" role="img" aria-label="${fmt(pctReciclado, 1)} % reciclado"><span style="width:${Math.min(100, pctReciclado)}%"></span></div>`,
        detalle: `${fmt(kgReciclado, 0)} kg de ${fmt(kgPapel, 0)} kg`,
      }),
      stat({ titulo: 'Emisiones evitadas', valor: fmt(evitadas, 1), unidad: 'kg CO₂e', detalle: 'Por el papel reciclado comprado' }),
      stat({
        titulo: 'Hojas por estudiante',
        valor: matricula ? fmt(hojas / matricula, 1) : 'Sin dato',
        detalle: matricula ? `${fmt(total / matricula, 3)} kg CO₂e por estudiante` : 'Cargá la matrícula en Factores y referencias',
      }),
    ].join('');

    let resumen = `${catTop} es la categoría con más emisiones en ${anio} (${fmt((kgTop / total) * 100, 1)}${NBSP}% del total).`;
    if (potencial > 0.05) resumen += ` Si todo el papel virgen hubiera sido reciclado, se habrían evitado ${fmt(potencial, 1)}${NBSP}kg${NBSP}CO₂e más.`;
    document.getElementById('resumen').textContent = resumen;

    // ---- Gráficos ----
    if (typeof Chart === 'undefined') {
      document.querySelectorAll('#vista-panel .lienzo').forEach((l) => {
        if (!l.querySelector('.sin-grafico')) {
          l.insertAdjacentHTML('beforeend', '<p class="sin-grafico">No se pudo cargar la librería de gráficos. Revisá la conexión a internet y recargá la página.</p>');
        }
      });
      return;
    }
    const anios = CO2.state.periodos.map((p) => p.anio).sort();
    graficarCategorias(lista, total);
    graficarComparacion(anio, lista, listaAnt);
    graficarEvolucion(anios);
    graficarPapel(anios);
    graficarEdificios(lista);
  }

  function iniciar() {
    if (typeof Chart !== 'undefined') configurarChart();
    const sel = document.getElementById('filtro-periodo-ind');
    sel.innerHTML = CO2.state.periodos.map((p) => `<option value="${p.anio}">${p.anio}</option>`).join('');
    sel.value = String(CO2.state.periodos.at(-1)?.anio ?? '');
    sel.addEventListener('change', () => {
      anioElegidoPorUsuario = true;
      render();
    });
  }

  CO2.visualizacion = { iniciar, render };
})();
