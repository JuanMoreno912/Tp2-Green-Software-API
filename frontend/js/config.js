// Configuración del módulo. Cuando la cátedra publique la API central,
// cambiar API_BASE_URL, poner USE_MOCK en false y ajustar ENDPOINTS.
window.CO2 = window.CO2 || {};

CO2.config = {
  API_BASE_URL: 'http://localhost:3000/api', // TODO: URL de la API de la cátedra
  USE_MOCK: true, // true = datos de prueba guardados en el navegador

  DIMENSION_ID: 14,
  DIMENSION_NOMBRE: 'Papel, insumos y servicios operativos',
  ALCANCE: '3',

  ENDPOINTS: {
    edificios: '/edificios',
    periodos: '/periodos',
    insumos: '/dimensiones/14/insumos',
    factores: '/factores-emision?dimension_id=14',
    datosActividad: '/datos-actividad',
    resultados: '/resultados-emisiones?dimension_id=14',
    resultadosPost: '/resultados-emisiones',
    emisionesEvitadas: '/emisiones-evitadas',
  },

  GRAMAJE_DEFAULT: 75, // g/m²
  DENSIDAD_LIMPIEZA: 1.0, // kg/L (supuesto: productos base acuosa)

  // Área de una hoja en m² según formato
  AREA_HOJA_M2: {
    A4: 0.21 * 0.297,
    OFICIO: 0.216 * 0.356,
  },
  HOJAS_POR_RESMA: 500,
};
