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
| Servicios contratados | Limpieza tercerizada (otros servicios: a agregar con su factor) | ARS o USD (monto gastado) |

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
| 1 g | kg | ÷ 1000 | 0,001 kg | — |
| 1 t | kg | × 1000 | 1000 kg | — |
| 1 ARS | USD | ÷ tipo de cambio del comprobante | — | — |

El gramaje es un dato de la carga (por defecto 75 g/m²) para que la conversión sea trazable.

### Estimación de papel de exámenes finales

El enunciado propone estimar el papel de exámenes como **3 × Cát × T** (3 hojas por examen × cátedras × turnos). El módulo lo generaliza:

```
hojas = hojas_por_examen × alumnos_promedio_por_mesa × cantidad_de_cátedras × turnos_por_año
```

## 1.5 Factores de emisión

Los factores oficiales los proveerá la **API central de la cátedra**. Mientras tanto, el módulo usa estos valores, contrastados con la fuente el 18/11/2026:

| N.º | Insumo | FE | Unidad | Fuente | Estado |
|---|---|---|---|---|---|
| 101 | Papel A4 virgen | 1,33932 | kg CO₂e/kg | DESNZ 2024, *Paper — primary material production* (1339,32 kg CO₂e/t) | Verificado |
| 102 | Papel A4 100 % reciclado | 1,04432 | kg CO₂e/kg | DESNZ 2024, *Paper — closed-loop source* (1044,32 kg CO₂e/t) | Verificado |
| 103 | Papel oficio virgen | 1,33932 | kg CO₂e/kg | Igual que 101 | Verificado |
| 104 | Cartón y embalajes | 1,19397 | kg CO₂e/kg | DESNZ 2024, *Board — primary material production* (1193,97 kg CO₂e/t) | Verificado |
| 105 | Tóner / cartucho | 5,0 | kg CO₂e/unidad | Supuesto. Los estudios de fabricantes informan entre 3,2 y 16,1 kg por cartucho según rendimiento y alcance | Supuesto |
| 106 | Artículos de librería plásticos | 3,165 | kg CO₂e/kg | DESNZ 2024, *Average plastics — primary material production* | Verificado |
| 107 | Productos de limpieza | 1,5 | kg CO₂e/kg | Supuesto del grupo: no hay factor oficial por kg de producto | Supuesto |
| 108 | Papel higiénico y toallas | 1,33932 | kg CO₂e/kg | Aproximación con el factor de papel virgen | Supuesto |
| 109 | Bolsas y descartables plásticos | 3,165 | kg CO₂e/kg | Igual que 106 | Verificado |
| 110 | Servicio de limpieza tercerizado | 0,167 | kg CO₂e/USD | EPA USEEIO v1.2, *Janitorial services* (NAICS 561720). Factor de EE.UU. por dólar gastado | Supuesto |

**Sobre las fuentes:**
- **DESNZ** (Department for Energy Security and Net Zero, Reino Unido) publica cada año los *Greenhouse gas reporting: conversion factors*. Los valores de "material use" cubren extracción, procesamiento, fabricación y transporte hasta el punto de venta (*cradle to gate*). Se tomaron de la edición 2024, consultada a través de la base de Climatiq, que replica los datos oficiales.
- Las ediciones anteriores (2021–2022) daban valores menores para el papel: 0,919 virgen y 0,739 reciclado. Por eso es importante citar el año de la edición.
- No se encontraron factores argentinos oficiales para estos materiales. Usar factores del Reino Unido es una **limitación**: la matriz energética y los procesos de fabricación de los proveedores locales son distintos.
- Para **servicios** se usa un factor *spend-based* (emisiones por dólar gastado). Hace falta convertir los pesos a dólares con el tipo de cambio del comprobante. Es el método menos preciso y se usa solo cuando no hay cantidades físicas.

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

- t CO₂e totales del año y variación contra el año anterior.
- kg de papel comprados y **hojas por estudiante**.
- kg CO₂e por estudiante.
- Distribución de emisiones por categoría de insumo.
- Comparación por categoría con el año anterior.
- Emisiones por edificio.
- Evolución interanual.
- % de papel reciclado sobre el total.
- Emisiones evitadas (reales y potenciales).

## 1.9 Ejemplo de cálculo completo

120 resmas A4 de 75 g/m², 100 % recicladas:

```
Peso por resma = 0,210 m × 0,297 m × 75 g/m² × 500 hojas = 2 338,875 g = 2,338875 kg
Cantidad base  = 120 × 2,338875 kg                         = 280,665 kg
Emisiones      = 280,665 kg × 1,04432 kg CO₂e/kg           = 293,10 kg CO₂e
Evitadas       = 280,665 kg × (1,33932 − 1,04432)          =  82,80 kg CO₂e
```
