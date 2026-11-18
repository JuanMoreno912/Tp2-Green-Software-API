// Módulo de visualización: indicadores y gráficos (Chart.js).
window.CO2 = window.CO2 || {};

(function () {
  const { fmt } = CO2.calculo;
  const graficos = {};
  const COLORES = ['#2f7d4f', '#5fa86f', '#a3c97a', '#e0b84c', '#d9814a', '#b4574f', '#6b8fb3', '#8a79b5', '#7a7a7a'];

  const sumar = (lista, fn) => lista.reduce((acc, r) => acc + fn(r), 0);
  const agrupar = (lista, clave) =>
    lista.reduce((acc, r) => {
      const k = clave(r);
      acc[k] = (acc[k] || 0) + r.resultado.kgco2e;
      return acc;
    }, {});

  const esPapel = (r) => CO2.buscarInsumo(r.insumo_codigo)?.categoria === 'Papel';
  const esReciclado = (r) => (CO2.buscarInsumo(r.insumo_codigo)?.reciclado || 0) > 0;

  function kpi(titulo, valor, unidad, extra = '') {
    return `<div class="kpi"><span class="kpi-titulo">${titulo}</span>
      <span class="kpi-valor">${valor}<small> ${unidad}</small></span>
      <span class="kpi-extra">${extra}</span></div>`;
  }

  function variacion(actual, anterior) {
    if (!anterior) return 'sin año anterior';
    const v = ((actual - anterior) / anterior) * 100;
    const flecha = v > 0 ? '▲' : v < 0 ? '▼' : '=';
    return `<span class="${v > 0 ? 'sube' : 'baja'}">${flecha} ${fmt(Math.abs(v), 1)}%</span> vs. año anterior`;
  }

  function dibujar(id, config) {
    graficos[id]?.destroy();
    graficos[id] = new Chart(document.getElementById(id), config);
  }

  function render() {
    if (typeof Chart === 'undefined') {
      CO2.mensaje('No se pudo cargar Chart.js (¿sin internet?). Los gráficos no se muestran.', 'error');
    }
    const anio = Number(document.getElementById('filtro-periodo-ind').value);
    const todos = CO2.state.registros;
    const delAnio = todos.filter((r) => r.periodo_id === anio);
    const delAnterior = todos.filter((r) => r.periodo_id === anio - 1);

    // ---- KPIs ----
    const total = sumar(delAnio, (r) => r.resultado.kgco2e);
    const totalAnt = sumar(delAnterior, (r) => r.resultado.kgco2e);
    const papel = delAnio.filter(esPapel);
    const kgPapel = sumar(papel, (r) => r.resultado.cantidadBase);
    const kgReciclado = sumar(papel.filter(esReciclado), (r) => r.resultado.cantidadBase);
    const evitadas = sumar(delAnio, (r) => r.resultado.kgco2eEvitados || 0);

    const fV = CO2.buscarFactor('PAPEL_A4_VIRGEN');
    const fR = CO2.buscarFactor('PAPEL_A4_RECICLADO');
    const potencial = fV && fR ? CO2.calculo.evitadasPorReciclado(kgPapel - kgReciclado, fV.valor, fR.valor) : 0;

    const matricula = CO2.periodo(anio)?.matricula;
    const pesoHoja = CO2.calculo.pesoHojaKg('A4', CO2.config.GRAMAJE_DEFAULT);
    const hojasPorEst = matricula ? kgPapel / pesoHoja / matricula : null;

    document.getElementById('kpis').innerHTML = [
      kpi('Emisiones totales', fmt(total / 1000, 2), 't CO₂e', variacion(total, totalAnt)),
      kpi('Papel consumido', fmt(kgPapel, 0), 'kg', `${fmt(kgPapel / pesoHoja, 0)} hojas A4 equiv.`),
      kpi('Hojas por estudiante', hojasPorEst != null ? fmt(hojasPorEst, 1) : '—', 'hojas', matricula ? `matrícula ${fmt(matricula, 0)}` : 'falta matrícula'),
      kpi('Papel reciclado', kgPapel ? fmt((kgReciclado / kgPapel) * 100, 1) : '0', '%', `${fmt(kgReciclado, 0)} kg`),
      kpi('Emisiones evitadas', fmt(evitadas, 1), 'kg CO₂e', 'por papel reciclado comprado'),
      kpi('Ahorro potencial', fmt(potencial, 1), 'kg CO₂e', 'si todo el papel fuera reciclado'),
    ].join('');

    if (typeof Chart === 'undefined') return;

    // ---- Distribución por categoría ----
    const porCat = agrupar(delAnio, (r) => CO2.buscarInsumo(r.insumo_codigo)?.categoria ?? 'Otro');
    dibujar('g-categorias', {
      type: 'doughnut',
      data: { labels: Object.keys(porCat), datasets: [{ data: Object.values(porCat), backgroundColor: COLORES }] },
      options: {
        plugins: {
          legend: { position: 'right' },
          tooltip: { callbacks: { label: (c) => `${c.label}: ${fmt(c.parsed, 1)} kg CO₂e (${fmt((c.parsed / total) * 100, 1)}%)` } },
        },
      },
    });

    // ---- Por edificio ----
    const porEd = agrupar(delAnio, (r) => CO2.nombreEdificio(r.edificio_id));
    dibujar('g-edificios', {
      type: 'bar',
      data: { labels: Object.keys(porEd), datasets: [{ label: 'kg CO₂e', data: Object.values(porEd), backgroundColor: '#2f7d4f' }] },
      options: { indexAxis: 'y', plugins: { legend: { display: false } } },
    });

    // ---- Evolución anual ----
    const anios = CO2.state.periodos.map((p) => p.anio);
    dibujar('g-evolucion', {
      type: 'line',
      data: {
        labels: anios,
        datasets: [{
          label: 't CO₂e',
          data: anios.map((a) => sumar(todos.filter((r) => r.periodo_id === a), (r) => r.resultado.kgco2e) / 1000),
          borderColor: '#2f7d4f',
          backgroundColor: 'rgba(47,125,79,.15)',
          fill: true,
          tension: 0.3,
        }],
      },
      options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } },
    });

    // ---- Papel virgen vs reciclado por año ----
    const kgPor = (a, rec) =>
      sumar(todos.filter((r) => r.periodo_id === a && esPapel(r) && esReciclado(r) === rec), (r) => r.resultado.cantidadBase);
    dibujar('g-papel', {
      type: 'bar',
      data: {
        labels: anios,
        datasets: [
          { label: 'Virgen', data: anios.map((a) => kgPor(a, false)), backgroundColor: '#b4574f' },
          { label: 'Reciclado', data: anios.map((a) => kgPor(a, true)), backgroundColor: '#5fa86f' },
        ],
      },
      options: { scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } } },
    });
  }

  function iniciar() {
    const sel = document.getElementById('filtro-periodo-ind');
    sel.innerHTML = CO2.state.periodos.map((p) => `<option value="${p.anio}">${p.anio}</option>`).join('');
    // Por defecto: último año con datos, o el último período
    const conDatos = CO2.state.registros.map((r) => r.periodo_id);
    sel.value = conDatos.length ? Math.max(...conDatos) : CO2.state.periodos.at(-1)?.anio;
    sel.addEventListener('change', render);
  }

  CO2.visualizacion = { iniciar, render };
})();
