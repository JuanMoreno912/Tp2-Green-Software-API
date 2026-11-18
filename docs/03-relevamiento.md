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
