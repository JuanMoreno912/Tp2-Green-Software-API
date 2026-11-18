# 1. Modelo de medición — Dimensión 14: Papel, insumos y servicios operativos

## 1.1 Qué se mide

Las emisiones de gases de efecto invernadero (GEI) **asociadas a la producción de los bienes consumibles y servicios operativos que compra la Facultad Regional Córdoba (UTN-FRC)** durante un año calendario:

| Categoría | Ejemplos | Unidad de carga habitual |
|---|---|---|
| Papel | Resmas A4/oficio, papel de exámenes, impresiones de imprenta | resma, hoja, kg |
| Cartón y embalajes | Cajas, sobres, carpetas | kg, unidad |
| Insumos de impresión | Tóners, cartuchos de tinta | unidad |
| Insumos de librería | Biromes, marcadores, carpetas plásticas | unidad, kg |
| Productos de limpieza | Lavandina, detergente, desinfectantes | litro, kg |
| Papel higiénico y toallas | Rollos, toallas de papel | rollo, kg |
| Bolsas y descartables plásticos | Bolsas de residuos, vasos | kg, unidad |
| Servicios contratados | Limpieza tercerizada, imprenta externa, mantenimiento | ARS (monto gastado) |

**No se mide** (para evitar doble conteo con otras dimensiones): electricidad de impresoras (Dim. 1 / 9), residuos generados (Dim. 12), equipos tecnológicos (Dim. 9), insumos de laboratorio (Dim. 10), alimentos (Dim. 11).

## 1.2 Alcance

**Alcance 3 — Categoría 1 del GHG Protocol: "Bienes y servicios adquiridos"**. Son emisiones indirectas: ocurren en la cadena de producción de los proveedores, no dentro de la facultad.

Además, el módulo calcula **emisiones evitadas** (potenciales) para el indicador de *sustitución por papel reciclado* (ver 1.6).

## 1.3 Variables

| Variable | Símbolo | Unidad | Origen |
|---|---|---|---|
| Cantidad adquirida | `Q` | unidad de carga (resma, hoja, kg, L, unidad, ARS) | Facturas / órdenes de compra |
| Factor de conversión a unidad base | `k` | kg/resma, kg/hoja, kg/L | Tabla de conversiones (gramaje, densidad) |
| Cantidad en unidad base | `Q_b = Q × k` | kg, unidad o ARS | Calculado |
| Factor de emisión | `FE` | kg CO₂e / unidad base | API de la cátedra (tabla `factores_emision`) |
| Emisiones | `E` | kg CO₂e | Calculado |
| Edificio | — | — | Selección |
| Período | — | año | Selección |
| Contenido reciclado | `%rec` | % | Factura / ficha del producto |

## 1.4 Fórmula general

```
E [kg CO₂e] = Q × k × FE
E [t CO₂e]  = E [kg CO₂e] / 1000
```

Total anual de la dimensión:

```
E_total = Σ (Q_i × k_i × FE_i)     para cada registro i del período
```

### Conversiones de unidades

| De | A | Cálculo | Valor (75 g/m²) | Valor (80 g/m²) |
|---|---|---|---|---|
| 1 hoja A4 | kg | 0,210 m × 0,297 m × gramaje | 0,00468 kg | 0,00499 kg |
| 1 resma A4 (500 hojas) | kg | 500 × peso hoja | 2,339 kg | 2,495 kg |
| 1 hoja oficio (216 × 356 mm) | kg | área × gramaje | 0,00577 kg | 0,00615 kg |
| 1 L producto de limpieza | kg | densidad ≈ 1,0 kg/L (supuesto, base acuosa) | 1,0 kg | — |

El gramaje es un dato de la carga (por defecto 75 g/m²) para que la conversión sea trazable.

### Estimación de papel de exámenes finales

El enunciado propone estimar el papel de exámenes como **3 × Cát × T** (3 hojas por examen × cátedras × turnos). El módulo lo generaliza:

```
hojas = hojas_por_examen × alumnos_promedio_por_mesa × cantidad_de_cátedras × turnos_por_año
```

## 1.5 Factores de emisión (provisorios)

Los factores oficiales los provee la **API central de la cátedra**. Hasta que estén disponibles, el módulo usa estos valores de referencia, **que deben validarse** antes de la entrega:

| Insumo | FE | Unidad | Fuente de referencia |
|---|---|---|---|
| Papel virgen | 0,919 | kg CO₂e/kg | DEFRA/DESNZ, "Paper and board: paper", producción primaria (a verificar versión) |
| Papel 100 % reciclado | 0,739 | kg CO₂e/kg | DEFRA/DESNZ, closed-loop (a verificar) |
| Cartón | 0,821 | kg CO₂e/kg | DEFRA/DESNZ, "Paper and board: board" (a verificar) |
| Tóner/cartucho | 5,0 | kg CO₂e/unidad | Estimación de ciclo de vida (literatura, rango 4–6 kg) |
| Plástico (promedio) | 3,116 | kg CO₂e/kg | DEFRA/DESNZ, "Plastics: average plastics" (a verificar) |
| Productos de limpieza | 1,5 | kg CO₂e/kg | Supuesto del grupo (rango bibliográfico 1–2) |
| Papel higiénico / toallas | 1,1 | kg CO₂e/kg | Supuesto del grupo (tissue, a verificar) |
| Servicios contratados | — | kg CO₂e/ARS | Factor *spend-based* (EEIO); pendiente definir con la cátedra |

> ⚠️ Los valores marcados "a verificar" se cargaron como referencia de trabajo y **no son definitivos**. Ver `docs/08-uso-ia.md`.

## 1.6 Emisiones evitadas (indicador propio)

Ahorro potencial si todo el papel virgen se reemplazara por reciclado:

```
E_evitadas = kg_papel_virgen × (FE_virgen − FE_reciclado)
```

Y ahorro real por el papel reciclado ya comprado:

```
E_evitadas_real = kg_papel_reciclado × (FE_virgen − FE_reciclado)
```

## 1.7 Periodicidad

**Anual** (año calendario, enero–diciembre). Las facturas se cargan con su fecha y se agrupan por período.

## 1.8 Indicadores de la dimensión

- t CO₂e totales del año.
- kg de papel consumidos y **hojas por estudiante**.
- Distribución de emisiones por categoría de insumo.
- Emisiones por edificio.
- Evolución interanual.
- % de papel reciclado sobre el total.
- Emisiones evitadas (reales y potenciales).
