// Datos de prueba que imitan lo que devolvería la API central.
// Edificios y matrícula son PROVISORIOS: reemplazar por datos reales / de la API.
window.CO2 = window.CO2 || {};

CO2.mock = {
  edificios: [
    { id: 1, nombre: 'Edificio Central' },
    { id: 2, nombre: 'Edificio de Aulas' },
    { id: 3, nombre: 'Laboratorios' },
    { id: 4, nombre: 'Biblioteca' },
    { id: 5, nombre: 'Administración' },
  ],

  // matricula: estudiantes (supuesto a relevar en Secretaría Académica).
  // Se puede editar desde la sección "Factores y referencias".
  periodos: [
    { id: 2023, anio: 2023, matricula: 10000 },
    { id: 2024, anio: 2024, matricula: 10000 },
    { id: 2025, anio: 2025, matricula: 10000 },
    { id: 2026, anio: 2026, matricula: 10000 },
  ],

  // unidades: unidades en las que se puede cargar. unidad_base: unidad del factor.
  insumos: [
    { id: 1, codigo: 'PAPEL_A4_VIRGEN', nombre: 'Papel A4 (virgen)', categoria: 'Papel', formato: 'A4', reciclado: 0, unidad_base: 'kg', unidades: ['resma', 'hoja', 'kg', 'g', 't'] },
    { id: 2, codigo: 'PAPEL_A4_RECICLADO', nombre: 'Papel A4 (100% reciclado)', categoria: 'Papel', formato: 'A4', reciclado: 100, unidad_base: 'kg', unidades: ['resma', 'hoja', 'kg', 'g', 't'] },
    { id: 3, codigo: 'PAPEL_OFICIO_VIRGEN', nombre: 'Papel oficio (virgen)', categoria: 'Papel', formato: 'OFICIO', reciclado: 0, unidad_base: 'kg', unidades: ['resma', 'hoja', 'kg', 'g', 't'] },
    { id: 4, codigo: 'CARTON', nombre: 'Cartón y embalajes', categoria: 'Cartón', unidad_base: 'kg', unidades: ['kg', 'g', 't'] },
    { id: 5, codigo: 'TONER', nombre: 'Tóner / cartucho', categoria: 'Impresión', unidad_base: 'unidad', unidades: ['unidad'] },
    { id: 6, codigo: 'LIBRERIA_PLASTICO', nombre: 'Artículos de librería plásticos', categoria: 'Librería', unidad_base: 'kg', unidades: ['kg', 'g', 't'] },
    { id: 7, codigo: 'LIMPIEZA', nombre: 'Productos de limpieza', categoria: 'Limpieza', unidad_base: 'kg', unidades: ['litro', 'kg', 'g', 't'] },
    { id: 8, codigo: 'TISSUE', nombre: 'Papel higiénico y toallas', categoria: 'Tissue', unidad_base: 'kg', unidades: ['kg', 'g', 't'] },
    { id: 9, codigo: 'BOLSAS_PLASTICO', nombre: 'Bolsas y descartables plásticos', categoria: 'Plásticos', unidad_base: 'kg', unidades: ['kg', 'g', 't'] },
    { id: 10, codigo: 'SERVICIO_LIMPIEZA', nombre: 'Servicio de limpieza tercerizado', categoria: 'Servicios', unidad_base: 'USD', unidades: ['ARS', 'USD'] },
  ],

  // valor: kg CO2e por unidad_base del insumo. verificado: el valor se contrastó con la fuente.
  factores: [
    { id: 101, insumo_codigo: 'PAPEL_A4_VIRGEN', valor: 1.33932, unidad: 'kg', anio: 2024, verificado: true,
      fuente: 'DESNZ 2024 — Paper, primary material production (1339,32 kg CO₂e/t)' },
    { id: 102, insumo_codigo: 'PAPEL_A4_RECICLADO', valor: 1.04432, unidad: 'kg', anio: 2024, verificado: true,
      fuente: 'DESNZ 2024 — Paper, closed-loop source (1044,32 kg CO₂e/t)' },
    { id: 103, insumo_codigo: 'PAPEL_OFICIO_VIRGEN', valor: 1.33932, unidad: 'kg', anio: 2024, verificado: true,
      fuente: 'DESNZ 2024 — Paper, primary material production (1339,32 kg CO₂e/t)' },
    { id: 104, insumo_codigo: 'CARTON', valor: 1.19397, unidad: 'kg', anio: 2024, verificado: true,
      fuente: 'DESNZ 2024 — Board, primary material production (1193,97 kg CO₂e/t)' },
    { id: 105, insumo_codigo: 'TONER', valor: 5.0, unidad: 'unidad', anio: 2024, verificado: false,
      fuente: 'Supuesto: estudios de fabricantes informan entre 3,2 y 16,1 kg CO₂e por cartucho' },
    { id: 106, insumo_codigo: 'LIBRERIA_PLASTICO', valor: 3.165, unidad: 'kg', anio: 2024, verificado: true,
      fuente: 'DESNZ 2024 — Average plastics, primary material production (3165 kg CO₂e/t)' },
    { id: 107, insumo_codigo: 'LIMPIEZA', valor: 1.5, unidad: 'kg', anio: 2024, verificado: false,
      fuente: 'Supuesto del grupo: sin factor oficial para productos de limpieza (rango 1–2 kg CO₂e/kg)' },
    { id: 108, insumo_codigo: 'TISSUE', valor: 1.33932, unidad: 'kg', anio: 2024, verificado: false,
      fuente: 'Aproximación: se usa el factor de papel virgen DESNZ 2024' },
    { id: 109, insumo_codigo: 'BOLSAS_PLASTICO', valor: 3.165, unidad: 'kg', anio: 2024, verificado: true,
      fuente: 'DESNZ 2024 — Average plastics, primary material production (3165 kg CO₂e/t)' },
    { id: 110, insumo_codigo: 'SERVICIO_LIMPIEZA', valor: 0.167, unidad: 'USD', anio: 2021, verificado: false,
      fuente: 'Aproximación: EPA USEEIO v1.2, Janitorial services NAICS 561720 (0,167 kg CO₂e/USD, EE.UU.)' },
  ],

  // Registros de ejemplo para probar los gráficos (botón "Cargar datos de ejemplo" o ?demo=1)
  ejemplos: [
    [2023, 1, 'PAPEL_A4_VIRGEN', 900, 'resma'], [2023, 2, 'PAPEL_A4_VIRGEN', 600, 'resma'],
    [2023, 5, 'TONER', 60, 'unidad'], [2023, 1, 'LIMPIEZA', 1800, 'litro'], [2023, 4, 'CARTON', 250, 'kg'],
    [2024, 1, 'PAPEL_A4_VIRGEN', 750, 'resma'], [2024, 2, 'PAPEL_A4_RECICLADO', 300, 'resma'],
    [2024, 5, 'TONER', 55, 'unidad'], [2024, 1, 'LIMPIEZA', 1700, 'litro'], [2024, 3, 'TISSUE', 900, 'kg'],
    [2024, 1, 'SERVICIO_LIMPIEZA', 9500, 'USD'],
    [2025, 1, 'PAPEL_A4_VIRGEN', 500, 'resma'], [2025, 2, 'PAPEL_A4_RECICLADO', 550, 'resma'],
    [2025, 5, 'TONER', 48, 'unidad'], [2025, 1, 'LIMPIEZA', 1650, 'litro'], [2025, 3, 'TISSUE', 850, 'kg'],
    [2025, 4, 'BOLSAS_PLASTICO', 220, 'kg'], [2025, 2, 'LIBRERIA_PLASTICO', 90, 'kg'],
    [2025, 1, 'SERVICIO_LIMPIEZA', 10200, 'USD'],
  ],
};
