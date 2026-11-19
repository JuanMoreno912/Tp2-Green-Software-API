# 9. Guion para el video de presentación

Duración sugerida: **5 a 7 minutos**. Abrir la app con `npm run dev` y entrar a `http://localhost:5500/?demo=1` para que tenga datos de ejemplo.

| Tiempo | Qué se muestra | Qué se dice |
|---|---|---|
| 0:00 – 0:30 | Portada / integrantes | Grupo, dimensión 14: papel, insumos y servicios operativos. Alcance 3, categoría 1 del GHG Protocol (bienes y servicios adquiridos). |
| 0:30 – 1:30 | `docs/01-modelo-medicion.md` | Qué se mide y qué no (para no contar dos veces con otras dimensiones). Fórmula: cantidad × conversión × factor. Conversión de resmas a kg con el gramaje. |
| 1:30 – 2:15 | App → **Factores y referencias** | Factores DESNZ 2024 verificados y cuáles son supuestos. Contar que el primer valor que dio la IA estaba desactualizado y se corrigió con la fuente. |
| 2:15 – 3:30 | App → **Cargar compra** | Cargar 120 resmas de papel reciclado: mostrar el cálculo en vivo paso a paso, la fecha solo desde el calendario, las validaciones (calidad A sin comprobante). Mostrar un servicio en pesos con tipo de cambio. |
| 3:30 – 4:15 | App → **Registros** | Trazabilidad ("Ver cálculo"), filtros, importar la planilla del relevamiento, exportar CSV. |
| 4:15 – 5:30 | App → **Panel** | Emisiones totales y variación, papel reciclado, emisiones evitadas, hojas por estudiante. Gráficos: categorías, comparación interanual, evolución, papel virgen vs reciclado, edificios. |
| 5:30 – 6:15 | `docs/02-modelo-datos.md` y `05-integracion-api.md` | Entidades propuestas (insumo, conversión de unidad). La API central todavía no está publicada; el módulo se conecta cambiando la URL en `config.js`. |
| 6:15 – 7:00 | Cierre | Relevamiento: qué datos se pidieron y a quién; limitaciones (factores del Reino Unido, compras sin edificio). Uso de IA y cómo se validó. |

**Consejos:** grabar en 1920×1080, con el zoom del navegador al 100 %. Antes de grabar, borrar los datos de prueba propios y entrar con `?demo=1`.
