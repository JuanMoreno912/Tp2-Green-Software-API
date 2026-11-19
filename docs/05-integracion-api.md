# 5. Integración con la API central

## 5.1 Estado al 18/11/2026

El enunciado indica que **la cátedra construye la base de datos central y una API REST común**, y que los grupos deben consumirla sin crear una API propia.

Búsqueda realizada en el aula virtual (curso *2026-4K4(4) Green Software*):

| Recurso | Qué contiene | ¿Es la API del TP? |
|---|---|---|
| "Trabajo práctico 2 - Huella de Carbono de Campus" | Google Doc con el enunciado (mismo texto que el PDF) | No incluye URL |
| "API Rest" (sección *Software*) | Swagger de la **Carbon Aware API** de la Green Software Foundation (`carbon-aware-api.azurewebsites.net`) | **No.** Devuelve intensidad de carbono de la red eléctrica por región; no tiene edificios, insumos ni datos de actividad |
| Foro "Avisos" | Sin publicaciones | — |
| "Entrega TP 2 - Campus NetZero" | Espacio de entrega (cierra 21/11/2026 23:59) | — |

**Conclusión:** la API central de la cátedra **todavía no fue publicada**. El módulo queda preparado para conectarse cambiando la configuración.

## 5.2 Cómo conectarla cuando esté disponible

En `frontend/js/config.js`:

```js
API_BASE_URL: 'https://<url-de-la-catedra>/api',
USE_MOCK: false,
ENDPOINTS: { ... } // ajustar a las rutas reales
```

Si los nombres de los campos difieren de los supuestos (ver 5.3), se ajustan solo en `api.js`; el resto del código no cambia.

## 5.3 Contrato supuesto (a confirmar con la cátedra)

Basado en la lista de tablas mínimas del enunciado.

| Método | Ruta | Uso en el módulo |
|---|---|---|
| GET | `/edificios` | Selector de edificio |
| GET | `/periodos` | Selector de año (y `matricula` para indicadores por estudiante) |
| GET | `/dimensiones/14/insumos` | Selector de insumo y unidades permitidas |
| GET | `/factores-emision?dimension_id=14` | Factor a aplicar en el cálculo |
| GET | `/resultados-emisiones?dimension_id=14` | Tabla de registros e indicadores |
| POST | `/datos-actividad` | Dato relevado (cantidad, unidad, edificio, período, comprobante, calidad) |
| POST | `/resultados-emisiones` | Resultado calculado + fórmula + factor usado |
| POST | `/emisiones-evitadas` | Ahorro por papel reciclado |

Ejemplo de cuerpo para `POST /datos-actividad`:

```json
{
  "dimension_id": 14,
  "edificio_id": 1,
  "periodo_id": 2025,
  "insumo_codigo": "PAPEL_A4_RECICLADO",
  "unidad": "resma",
  "cantidad": 120,
  "gramaje_gm2": 75,
  "comprobante": "FC B 0003-00012345",
  "fecha": "2025-03-10",
  "calidad": "A",
  "observaciones": ""
}
```

Ejemplo para `POST /resultados-emisiones`:

```json
{
  "dato_actividad_id": 431,
  "factor_emision_id": 102,
  "cantidad_base": 280.665,
  "kgco2e": 293.104,
  "alcance": "3",
  "formula": "120 resma × 2,3389 kg/resma (A4, 500 hojas, 75 g/m²) = 280,665 kg | 280,665 kg × 1,0443 kg CO₂e/kg = 293,104 kg CO₂e | Factor #102: ..."
}
```

## 5.4 Preguntas para la cátedra

1. URL base de la API y si requiere autenticación (token / API key).
2. ¿La API expone un catálogo de insumos para la dimensión 14, o lo propone cada grupo (entidad `insumo` de `docs/02-modelo-datos.md`)?
3. ¿Los factores de emisión los carga la cátedra o los grupos? ¿Con qué fuente oficial (p. ej. inventario nacional, DEFRA)?
4. ¿El `periodo_id` es el año o un id propio?
5. ¿Se puede editar o borrar un dato de actividad ya enviado?
6. ¿Está habilitado CORS para `http://localhost`?
