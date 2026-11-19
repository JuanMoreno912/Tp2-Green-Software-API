# 3. Relevamiento

## 3.1 Qué información necesita el sistema

| Dato | Detalle | Dónde está | Quién lo proporciona |
|---|---|---|---|
| Compras de papel | Resmas por tipo (A4/oficio), gramaje, % reciclado, fecha, edificio destino | Facturas y órdenes de compra | Dirección de Compras / Departamento de Suministros |
| Papel de exámenes | Hojas por examen, cátedras, turnos, inscriptos por mesa | Bedelía / Departamentos de carrera | Bedelía, secretarías de departamento |
| Impresión institucional | Contadores de impresoras, impresiones tercerizadas | Dpto. Sistemas, contrato de impresión | Dpto. Sistemas / Imprenta |
| Tóners y cartuchos | Cantidad por modelo | Facturas / pedidos al depósito | Compras, Dpto. Sistemas |
| Artículos de librería | Cantidades por tipo | Facturas | Compras |
| Productos de limpieza | Litros/kg por producto | Remitos del servicio de limpieza | Intendencia / empresa contratista |
| Papel higiénico y toallas | Rollos/kg | Remitos | Intendencia |
| Servicios contratados | Monto anual (ARS) por servicio | Contratos / Tesorería | Secretaría Administrativa |
| Matrícula y personal | N.º de estudiantes y personal por año | Estadísticas académicas | Secretaría Académica |
| Edificios | Lista de edificios / sedes | Central (API) | Cátedra |

## 3.2 Planilla de relevamiento (a completar con datos reales)

| Período | Edificio | Insumo | Cantidad | Unidad | Gramaje | % reciclado | Comprobante | Fuente |
|---|---|---|---|---|---|---|---|---|
| 2025 | | Papel A4 | | resma | 75 | 0 | | Factura |
| 2025 | | Tóner | | unidad | — | — | | Factura |
| 2025 | | Lavandina | | litro | — | — | | Remito |

## 3.3 Datos relevados

> _Pendiente: completar con lo obtenido en las entrevistas/pedidos de información._

| Fecha | Área consultada | Contacto (cargo) | Pedido | Respuesta |
|---|---|---|---|---|
| | | | | |

## 3.4 Calidad y limitaciones de los datos

- **Compras centralizadas:** las facturas suelen no indicar el edificio de destino → se asigna por prorrateo (supuesto a documentar) o a "Sede central".
- **Facturas por monto sin cantidades:** cuando solo hay importes, se usa factor *spend-based* (kg CO₂e/ARS), con menor precisión.
- **Gramaje y % reciclado:** si no figura, se asume 75 g/m² y 0 % reciclado (escenario conservador).
- **Papel de exámenes:** se estima, no se mide; incertidumbre alta.
- **Factores de emisión:** internacionales (DEFRA/DESNZ, literatura), no específicos de Argentina.
- **Inflación:** los montos en ARS no son comparables entre años sin deflactar.

Escala de calidad usada en el campo `fuente_datos`:

| Nivel | Significado |
|---|---|
| A | Dato medido con comprobante (factura, remito) |
| B | Dato de registro interno sin comprobante |
| C | Estimación con supuestos documentados |

## 3.5 Cómo cargar lo relevado

1. En la app, **Registros → Descargar plantilla** baja `plantilla-relevamiento-papel-insumos.csv` (se abre con Excel).
2. Cada fila es una compra: año, edificio, código de insumo, cantidad, unidad, gramaje (solo papel), tipo de cambio (solo montos en pesos), fecha, comprobante, calidad (A/B/C) y observaciones.
3. **Registros → Importar CSV** valida cada fila con las mismas reglas que el formulario. Las filas con errores no se importan y se informan con su número de fila y el motivo.
4. La matrícula de cada año se carga en **Factores y referencias**.

## 3.6 Modelo de nota para pedir los datos

> **Asunto:** Pedido de información — Huella de carbono de la FRC (Cátedra Green Software)
>
> Estimados/as:
>
> Somos estudiantes de la cátedra Green Software (UTN FRC) y estamos midiendo la huella de carbono de la facultad, en la dimensión *papel, insumos y servicios operativos*. Les pedimos, si es posible, la siguiente información de los años 2023, 2024 y 2025:
>
> - Compras de **papel** (resmas por tamaño y gramaje, si es reciclado), con fecha y número de factura u orden de compra.
> - Compras de **tóners y cartuchos** (cantidad por modelo).
> - Compras de **artículos de librería** y **productos de limpieza** (cantidades o kg/litros).
> - **Papel higiénico y toallas** (kg o cantidad de bultos y su peso).
> - Monto anual pagado por **servicios tercerizados** (limpieza, imprenta, etc.).
> - Si existe, a qué **edificio** se destinó cada compra.
>
> Nos sirve en el formato en que lo tengan (planilla, listado o copia de facturas). Los datos se usan solo para el trabajo académico y los resultados se compartirán con la facultad.
>
> Muchas gracias.
> _Nombre, legajo y contacto del grupo_

| Destinatario sugerido | Qué pedirle |
|---|---|
| Dirección de Compras / Suministros | Papel, tóners, librería, cartón |
| Intendencia / Servicios generales | Limpieza, papel higiénico, bolsas, servicio tercerizado |
| Bedelía y departamentos | Cantidad de mesas de examen, inscriptos por mesa, hojas por examen |
| Secretaría Académica | Matrícula por año |
| Secretaría Administrativa / Tesorería | Montos de servicios contratados |
