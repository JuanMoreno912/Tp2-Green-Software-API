# 8. Uso de IA y validación de lo generado

> Revisar y completar con la experiencia del grupo antes de entregar.

## 8.1 Herramienta usada

Claude Code (asistente de programación con IA), usado desde la aplicación de escritorio.

## 8.2 Qué se generó con IA

| Parte | Qué hizo la IA | Qué hizo / debe hacer el grupo |
|---|---|---|
| Lectura del enunciado | Resumen de los 8 componentes | Elegir la dimensión 14 |
| Modelo de medición (`01`) | Variables, fórmulas, conversiones; búsqueda de factores DESNZ 2024 y EPA | Revisar que los factores sean los que acepta la cátedra |
| Modelo de datos (`02`) | DER en Mermaid y diccionario de datos | Revisar contra el modelo de la cátedra |
| Relevamiento (`03`) | Qué pedir, a quién, modelo de nota y plantilla CSV | Hacer los pedidos y cargar los datos reales |
| Frontend | Código HTML/CSS/JS, validaciones, cálculo, gráficos, diseño, importación CSV | Probar con datos reales, revisar el código |
| Tests (`tests/`) | 12 pruebas automáticas del cálculo | Correr `npm test` antes de entregar |
| Búsqueda de la API | Revisión del aula virtual (ver `05-integracion-api.md`) | Consultar a la cátedra |

## 8.3 Cómo se validó

### Factores de emisión

El primer borrador de la IA usó valores de memoria (papel virgen 0,919 y reciclado 0,739 kg CO₂e/kg). Al **contrastarlos con la fuente** se encontró que esos números corresponden a ediciones anteriores de DEFRA (2021–2022). En la edición **DESNZ 2024** el papel virgen es 1,339 y el reciclado 1,044 kg CO₂e/kg. Se corrigieron todos los factores y ahora cada uno indica si está **verificado** o es un **supuesto** (sección *Factores y referencias* de la app).

Lección: los valores que da una IA "de memoria" pueden estar desactualizados; siempre hay que ir a la fuente y anotar el año de la edición.

### Cálculos

Verificados a mano y con tests automáticos (`npm test`). Ejemplo: 120 resmas A4 de 75 g/m², recicladas:

- peso por resma: 0,210 m × 0,297 m × 75 g/m² × 500 hojas = 2 338,875 g = 2,338875 kg
- 120 × 2,338875 = 280,665 kg
- 280,665 × 1,04432 = 293,10 kg CO₂e
- evitadas: 280,665 × (1,33932 − 1,04432) = 82,80 kg CO₂e

Servicios: 12 000 000 ARS ÷ 1 200 ARS/USD = 10 000 USD × 0,167 = 1 670 kg CO₂e.

### Errores que encontraron las pruebas

- Los tests detectaron que el cálculo aceptaba "litros de cartón" (la conversión por densidad se aplicaba a cualquier insumo en kg). Se corrigió para que el cálculo rechace unidades no permitidas para cada insumo.
- Al probar la edición de registros en el navegador se encontró que el formulario salía del modo edición antes de guardar. Se corrigió.
- La línea de evolución anual mostraba 0 en años sin datos (engañoso). Ahora esos años quedan vacíos.

### Interfaz

- Validaciones del formulario probadas con: cantidad vacía o negativa, fecha fuera del año, calidad A sin comprobante, pesos sin tipo de cambio.
- Importación CSV probada con filas válidas, edificio inexistente y fecha fuera del año.
- Probada en escritorio y en pantalla de celular (375 px) sin desbordes.
- Paleta de gráficos verificada con un validador de contraste y daltonismo.

## 8.4 Pendiente del grupo

- [ ] **Datos reales**: edificios, matrícula y cantidades compradas son de prueba.
- [ ] **Factores marcados como supuesto** (tóner, limpieza, tissue, servicios): buscar una fuente mejor o justificar el supuesto en la presentación.
- [ ] **Contrato de la API**: los endpoints son supuestos hasta que la cátedra publique la API.
- [ ] Revisión del código por al menos un integrante.
