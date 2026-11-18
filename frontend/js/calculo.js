// Módulo de cálculo: conversión de unidades, aplicación del factor y trazabilidad.
window.CO2 = window.CO2 || {};

(function () {
  const cfg = CO2.config;

  const fmt = (n, dec = 2) =>
    Number(n).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: dec });

  function pesoHojaKg(formato, gramaje) {
    const area = cfg.AREA_HOJA_M2[formato];
    if (!area) throw new Error('Formato de hoja desconocido: ' + formato);
    return (area * gramaje) / 1000;
  }

  // Devuelve { k, detalle }: factor para pasar de `unidad` a la unidad base del insumo.
  function factorConversion(unidad, insumo, gramaje) {
    if (unidad === insumo.unidad_base) return { k: 1, detalle: null };

    if (insumo.unidad_base === 'kg') {
      if (unidad === 'hoja') {
        return { k: pesoHojaKg(insumo.formato, gramaje), detalle: `${insumo.formato}, ${gramaje} g/m²` };
      }
      if (unidad === 'resma') {
        return {
          k: pesoHojaKg(insumo.formato, gramaje) * cfg.HOJAS_POR_RESMA,
          detalle: `${insumo.formato}, ${cfg.HOJAS_POR_RESMA} hojas, ${gramaje} g/m²`,
        };
      }
      if (unidad === 'litro') {
        return { k: cfg.DENSIDAD_LIMPIEZA, detalle: `densidad supuesta ${cfg.DENSIDAD_LIMPIEZA} kg/L` };
      }
    }
    throw new Error(`No hay conversión de "${unidad}" a "${insumo.unidad_base}"`);
  }

  /**
   * Calcula las emisiones de un dato de actividad.
   * @returns {{cantidadBase, kgco2e, factorId, factorValor, factorFuente, alcance, formula}}
   */
  function calcular({ cantidad, unidad, gramaje }, insumo, factor) {
    if (!factor) throw new Error('No hay factor de emisión para ' + insumo.nombre);
    if (factor.unidad !== insumo.unidad_base) {
      throw new Error(`El factor está en ${factor.unidad} y el insumo en ${insumo.unidad_base}`);
    }
    const g = Number(gramaje) || cfg.GRAMAJE_DEFAULT;
    const { k, detalle } = factorConversion(unidad, insumo, g);
    const cantidadBase = cantidad * k;
    const kgco2e = cantidadBase * factor.valor;
    const ub = insumo.unidad_base;

    const pasos = [];
    if (k !== 1) {
      pasos.push(`${fmt(cantidad)} ${unidad} × ${fmt(k, 6)} ${ub}/${unidad} (${detalle}) = ${fmt(cantidadBase, 3)} ${ub}`);
    }
    pasos.push(`${fmt(cantidadBase, 3)} ${ub} × ${fmt(factor.valor, 4)} kg CO₂e/${ub} = ${fmt(kgco2e, 3)} kg CO₂e`);
    pasos.push(`Factor #${factor.id}: ${factor.fuente} (${factor.anio})`);

    return {
      cantidadBase,
      kgco2e,
      factorId: factor.id,
      factorValor: factor.valor,
      factorFuente: factor.fuente,
      alcance: cfg.ALCANCE,
      formula: pasos.join(' | '),
    };
  }

  // Emisiones evitadas por usar papel reciclado en lugar de virgen.
  function evitadasPorReciclado(kgPapel, feVirgen, feReciclado) {
    return kgPapel * (feVirgen - feReciclado);
  }

  // Estimación de hojas de exámenes finales (enunciado: 3 × Cát × T).
  function hojasExamenes({ hojasPorExamen, alumnosPorMesa, catedras, turnos }) {
    return hojasPorExamen * alumnosPorMesa * catedras * turnos;
  }

  CO2.calculo = { fmt, pesoHojaKg, factorConversion, calcular, evitadasPorReciclado, hojasExamenes };
})();
