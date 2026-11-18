# TPI 2 – Green Software · Campus CO₂

**Dimensión:** 14 — Papel, insumos y servicios operativos
**Institución:** UTN – Facultad Regional Córdoba
**Alcance:** 3 (Cat. 1 GHG Protocol: bienes y servicios adquiridos) + emisiones evitadas
**Periodicidad:** anual

Módulo frontend (HTML/CSS/JavaScript) de carga, cálculo y visualización de la huella de carbono de papel e insumos. Consume la API central de la cátedra; **no implementa una API propia**.

## Cómo ejecutarlo

Requiere Node.js 18 o superior (no hace falta `npm install`, no hay dependencias):

```bash
npm start
```

y abrir http://localhost:5500. Para usar otro puerto: `$env:PORT=5501; npm start` (PowerShell).
`server.js` solo sirve los archivos estáticos de `frontend/`; **no es una API**.
También se puede abrir `frontend/index.html` con doble clic o con Live Server.

Por ahora funciona en **modo prueba** (`USE_MOCK: true` en `frontend/js/config.js`): usa datos de ejemplo y guarda los registros en el navegador. Para probar los gráficos: pestaña *Registros* → **Cargar datos de ejemplo**.

Cuando la cátedra publique la API: cambiar `API_BASE_URL`, `USE_MOCK: false` y ajustar `ENDPOINTS` en `config.js`.

## Estructura

```
docs/
  01-modelo-medicion.md   Qué se mide, variables, fórmulas, factores, alcance
  02-modelo-datos.md      DER (Mermaid) y diccionario de datos
  03-relevamiento.md      Qué datos pedir, a quién, calidad y limitaciones
frontend/
  index.html
  css/styles.css
  js/
    config.js             URL de la API, endpoints, constantes
    mock-data.js          Datos de prueba (edificios, insumos, factores)
    api.js                Integración con la API central (o mock)
    calculo.js            Conversión de unidades, factor de emisión, trazabilidad
    app.js                Estado, navegación, procesamiento de registros
    carga.js              Formulario, validaciones, estimador de exámenes
    registros.js          Tabla de registros con el cálculo paso a paso
    visualizacion.js      KPIs y gráficos (Chart.js)
```

## Checklist de los 8 componentes

- [x] 1. Modelo de medición → `docs/01-modelo-medicion.md` (falta validar factores)
- [x] 2. Modelo de datos → `docs/02-modelo-datos.md` (ajustar a la API real)
- [ ] 3. Relevamiento → `docs/03-relevamiento.md` (plantilla lista; **faltan datos reales**)
- [x] 4. Módulo de carga (formulario + validaciones + estimador de exámenes)
- [ ] 5. Integración con API central (capa lista en `api.js`; **esperando endpoints de la cátedra**)
- [x] 6. Módulo de cálculo (conversión + factor + trazabilidad)
- [x] 7. Módulo de visualización (KPIs, distribución, edificios, evolución, papel reciclado)
- [ ] 8. Documentación final (arquitectura, API, capturas, resultados, uso de IA)
