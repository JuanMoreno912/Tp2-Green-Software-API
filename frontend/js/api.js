// Capa de integración con la API central de la cátedra.
// Con USE_MOCK = true responde con datos de prueba y guarda los registros en localStorage.
window.CO2 = window.CO2 || {};

(function () {
  const cfg = CO2.config;
  const STORAGE_KEY = 'campusco2-dim14-registros';

  // ---------- HTTP real ----------
  async function http(path, options = {}) {
    const res = await fetch(cfg.API_BASE_URL + path, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`API ${res.status} en ${path}: ${txt || res.statusText}`);
    }
    return res.status === 204 ? null : res.json();
  }

  // ---------- Mock ----------
  function leerLocal() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  }
  function guardarLocal(lista) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
    } catch (e) {
      console.warn('No se pudo guardar en localStorage', e);
    }
  }
  const demora = (data) => new Promise((r) => setTimeout(() => r(structuredClone(data)), 150));

  // Matrícula editada por el usuario en modo prueba: { "2025": 9800, ... }
  const KEY_MATRICULA = 'campusco2-dim14-matricula';
  function leerMatricula() {
    try {
      return JSON.parse(localStorage.getItem(KEY_MATRICULA)) || {};
    } catch {
      return {};
    }
  }

  // ---------- API pública ----------
  const api = {
    getEdificios: () => (cfg.USE_MOCK ? demora(CO2.mock.edificios) : http(cfg.ENDPOINTS.edificios)),
    getPeriodos: () => {
      if (!cfg.USE_MOCK) return http(cfg.ENDPOINTS.periodos);
      const editada = leerMatricula();
      return demora(CO2.mock.periodos.map((p) => ({ ...p, matricula: editada[p.anio] ?? p.matricula })));
    },

    /** Guarda la matrícula de un año (solo modo prueba; con la API la provee la cátedra). */
    async guardarMatricula(valores) {
      if (!cfg.USE_MOCK) throw new Error('La matrícula la administra la API central');
      try {
        localStorage.setItem(KEY_MATRICULA, JSON.stringify(valores));
      } catch (e) {
        console.warn('No se pudo guardar la matrícula', e);
      }
    },

    /** Reemplaza un registro existente (solo modo prueba). */
    async actualizarRegistro(id, registro) {
      if (!cfg.USE_MOCK) throw new Error('La edición todavía no está disponible en la API central');
      const lista = leerLocal().map((r) => (r.id === id ? { ...registro, id } : r));
      guardarLocal(lista);
      return demora({ ...registro, id });
    },
    getInsumos: () => (cfg.USE_MOCK ? demora(CO2.mock.insumos) : http(cfg.ENDPOINTS.insumos)),
    getFactores: () => (cfg.USE_MOCK ? demora(CO2.mock.factores) : http(cfg.ENDPOINTS.factores)),

    /** Lista los registros (dato de actividad + resultado) de la dimensión. */
    async getRegistros() {
      if (cfg.USE_MOCK) return demora(leerLocal());
      return http(cfg.ENDPOINTS.resultados);
    },

    /**
     * Envía el dato de actividad y su resultado de emisiones.
     * Si es papel reciclado, también envía la emisión evitada.
     */
    async guardarRegistro(registro) {
      if (cfg.USE_MOCK) {
        const lista = leerLocal();
        const nuevo = { ...registro, id: Date.now() + Math.floor(Math.random() * 1000) };
        lista.push(nuevo);
        guardarLocal(lista);
        return demora(nuevo);
      }

      const dato = await http(cfg.ENDPOINTS.datosActividad, {
        method: 'POST',
        body: JSON.stringify({
          dimension_id: cfg.DIMENSION_ID,
          edificio_id: registro.edificio_id,
          periodo_id: registro.periodo_id,
          insumo_codigo: registro.insumo_codigo,
          unidad: registro.unidad,
          cantidad: registro.cantidad,
          gramaje_gm2: registro.gramaje,
          tipo_cambio_ars_usd: registro.tipo_cambio || null,
          comprobante: registro.comprobante,
          fecha: registro.fecha,
          calidad: registro.calidad,
          observaciones: registro.observaciones,
        }),
      });
      const r = registro.resultado;
      const resultado = await http(cfg.ENDPOINTS.resultadosPost, {
        method: 'POST',
        body: JSON.stringify({
          dato_actividad_id: dato.id,
          factor_emision_id: r.factorId,
          cantidad_base: r.cantidadBase,
          kgco2e: r.kgco2e,
          alcance: r.alcance,
          formula: r.formula,
        }),
      });
      if (r.kgco2eEvitados > 0) {
        await http(cfg.ENDPOINTS.emisionesEvitadas, {
          method: 'POST',
          body: JSON.stringify({
            resultado_emision_id: resultado.id,
            kgco2e_evitados: r.kgco2eEvitados,
            descripcion: 'Uso de papel reciclado en lugar de virgen',
          }),
        });
      }
      return { ...registro, id: dato.id };
    },

    async eliminarRegistro(id) {
      if (!cfg.USE_MOCK) throw new Error('Eliminar no está disponible en la API central');
      guardarLocal(leerLocal().filter((r) => r.id !== id));
    },

    reemplazarRegistrosLocales(lista) {
      guardarLocal(lista);
    },
  };

  CO2.api = api;
})();
