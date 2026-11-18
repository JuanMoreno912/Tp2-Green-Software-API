// Datos de prueba que imitan lo que devolvería la API central.
// Edificios, matrícula y factores son PROVISORIOS: reemplazar por datos reales / de la API.
window.CO2 = window.CO2 || {};

CO2.mock = {
  edificios: [
    { id: 1, nombre: 'Edificio Central' },
    { id: 2, nombre: 'Edificio de Aulas' },
    { id: 3, nombre: 'Laboratorios' },
    { id: 4, nombre: 'Biblioteca' },
    { id: 5, nombre: 'Administración' },
  ],

  // matricula: estudiantes (supuesto a relevar en Secretaría Académica)
  periodos: [
    { id: 2023, anio: 2023, matricula: 10000 },
    { id: 2024, anio: 2024, matricula: 10000 },
    { id: 2025, anio: 2025, matricula: 10000 },
    { id: 2026, anio: 2026, matricula: 10000 },
  ],

  // unidades: unidades en las que se puede cargar. unidad_base: unidad del factor.
  insumos: [
    { id: 1, codigo: 'PAPEL_A4_VIRGEN', nombre: 'Papel A4 (virgen)', categoria: 'Papel', formato: 'A4', reciclado: 0, unidad_base: 'kg', unidades: ['resma', 'hoja', 'kg'] },
    { id: 2, codigo: 'PAPEL_A4_RECICLADO', nombre: 'Papel A4 (100% reciclado)', categoria: 'Papel', formato: 'A4', reciclado: 100, unidad_base: 'kg', unidades: ['resma', 'hoja', 'kg'] },
    { id: 3, codigo: 'PAPEL_OFICIO_VIRGEN', nombre: 'Papel oficio (virgen)', categoria: 'Papel', formato: 'OFICIO', reciclado: 0, unidad_base: 'kg', unidades: ['resma', 'hoja', 'kg'] },
    { id: 4, codigo: 'CARTON', nombre: 'Cartón y embalajes', categoria: 'Cartón', unidad_base: 'kg', unidades: ['kg'] },
    { id: 5, codigo: 'TONER', nombre: 'Tóner / cartucho', categoria: 'Impresión', unidad_base: 'unidad', unidades: ['unidad'] },
    { id: 6, codigo: 'LIBRERIA_PLASTICO', nombre: 'Artículos de librería plásticos', categoria: 'Librería', unidad_base: 'kg', unidades: ['kg'] },
    { id: 7, codigo: 'LIMPIEZA', nombre: 'Productos de limpieza', categoria: 'Limpieza', unidad_base: 'kg', unidades: ['litro', 'kg'] },
    { id: 8, codigo: 'TISSUE', nombre: 'Papel higiénico y toallas', categoria: 'Tissue', unidad_base: 'kg', unidades: ['kg'] },
    { id: 9, codigo: 'BOLSAS_PLASTICO', nombre: 'Bolsas y descartables plásticos', categoria: 'Plásticos', unidad_base: 'kg', unidades: ['kg'] },
  ],

  // valor: kg CO2e por unidad_base del insumo
  factores: [
    { id: 101, insumo_codigo: 'PAPEL_A4_VIRGEN', valor: 0.919, unidad: 'kg', fuente: 'DEFRA/DESNZ — Paper and board: paper (a verificar)', anio: 2023 },
    { id: 102, insumo_codigo: 'PAPEL_A4_RECICLADO', valor: 0.739, unidad: 'kg', fuente: 'DEFRA/DESNZ — closed-loop (a verificar)', anio: 2023 },
    { id: 103, insumo_codigo: 'PAPEL_OFICIO_VIRGEN', valor: 0.919, unidad: 'kg', fuente: 'DEFRA/DESNZ — Paper and board: paper (a verificar)', anio: 2023 },
    { id: 104, insumo_codigo: 'CARTON', valor: 0.821, unidad: 'kg', fuente: 'DEFRA/DESNZ — Paper and board: board (a verificar)', anio: 2023 },
    { id: 105, insumo_codigo: 'TONER', valor: 5.0, unidad: 'unidad', fuente: 'Estimación de ciclo de vida (rango 4–6 kg)', anio: 2023 },
    { id: 106, insumo_codigo: 'LIBRERIA_PLASTICO', valor: 3.116, unidad: 'kg', fuente: 'DEFRA/DESNZ — Plastics: average (a verificar)', anio: 2023 },
    { id: 107, insumo_codigo: 'LIMPIEZA', valor: 1.5, unidad: 'kg', fuente: 'Supuesto del grupo (rango 1–2)', anio: 2023 },
    { id: 108, insumo_codigo: 'TISSUE', valor: 1.1, unidad: 'kg', fuente: 'Supuesto del grupo (a verificar)', anio: 2023 },
    { id: 109, insumo_codigo: 'BOLSAS_PLASTICO', valor: 3.116, unidad: 'kg', fuente: 'DEFRA/DESNZ — Plastics: average (a verificar)', anio: 2023 },
  ],

  // Registros de ejemplo para probar los gráficos (botón "Cargar datos de ejemplo")
  ejemplos: [
    [2023, 1, 'PAPEL_A4_VIRGEN', 900, 'resma'], [2023, 2, 'PAPEL_A4_VIRGEN', 600, 'resma'],
    [2023, 5, 'TONER', 60, 'unidad'], [2023, 1, 'LIMPIEZA', 1800, 'litro'], [2023, 4, 'CARTON', 250, 'kg'],
    [2024, 1, 'PAPEL_A4_VIRGEN', 750, 'resma'], [2024, 2, 'PAPEL_A4_RECICLADO', 300, 'resma'],
    [2024, 5, 'TONER', 55, 'unidad'], [2024, 1, 'LIMPIEZA', 1700, 'litro'], [2024, 3, 'TISSUE', 900, 'kg'],
    [2025, 1, 'PAPEL_A4_VIRGEN', 500, 'resma'], [2025, 2, 'PAPEL_A4_RECICLADO', 550, 'resma'],
    [2025, 5, 'TONER', 48, 'unidad'], [2025, 1, 'LIMPIEZA', 1650, 'litro'], [2025, 3, 'TISSUE', 850, 'kg'],
    [2025, 4, 'BOLSAS_PLASTICO', 220, 'kg'], [2025, 2, 'LIBRERIA_PLASTICO', 90, 'kg'],
  ],
};
