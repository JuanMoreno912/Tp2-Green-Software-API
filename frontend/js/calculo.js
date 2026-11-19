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
  function factorConversion(unidad, insumo, gramaje, tipoCambio) {
    if (insumo.unidades && !insumo.unidades.includes(unidad)) {
      throw new Error(`No hay conversión de "${unidad}" para ${insumo.nombre} (unidades válidas: ${insumo.unidades.join(', ')})`);
    }
    if (unidad === insumo.unidad_base) return { k: 1, detalle: null };

    if (insumo.unidad_base === 'USD' && unidad === 'ARS') {
      if (!(tipoCambio > 0)) throw new Error('Para montos en pesos, ingresá el tipo de cambio (ARS por USD).');
      return { k: 1 / tipoCambio, detalle: `tipo de cambio ${fmt(tipoCambio, 2)} ARS/USD` };
    }

    if (insumo.unidad_base === 'kg') {
      if (unidad === 'g') return { k: 0.001, detalle: '1 g = 0,001 kg' };
      if (unidad === 't') return { k: 1000, detalle: '1 t = 1000 kg' };
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
  function calcular({ cantidad, unidad, gramaje, tipo_cambio }, insumo, factor) {
    if (!factor) throw new Error('No hay factor de emisión para ' + insumo.nombre);
    if (factor.unidad !== insumo.unidad_base) {
      throw new Error(`El factor está en ${factor.unidad} y el insumo en ${insumo.unidad_base}`);
    }
    const g = Number(gramaje) || cfg.GRAMAJE_DEFAULT;
    const { k, detalle } = factorConversion(unidad, insumo, g, Number(tipo_cambio));
    const cantidadBase = cantidad * k;
    const kgco2e = cantidadBase * factor.valor;
    const ub = insumo.unidad_base;

    // Líneas estructuradas (para mostrar) y texto plano (para guardar en la API)
    const lineas = [];
    if (k !== 1) {
      lineas.push({
        op: `${fmt(cantidad)} ${unidad} × ${fmt(k, k < 0.01 ? 6 : 4)} ${ub}/${unidad}`,
        res: `${fmt(cantidadBase, 3)} ${ub}`,
        nota: detalle,
      });
    }
    lineas.push({
      op: `${fmt(cantidadBase, 3)} ${ub} × ${fmt(factor.valor, 4)} kg CO₂e/${ub}`,
      res: `${fmt(kgco2e, 3)} kg CO₂e`,
      nota: `Factor #${factor.id}`,
    });

    const pasos = [];
    if (k !== 1) pasos.push(`${lineas[0].op} (${detalle}) = ${lineas[0].res}`);
    pasos.push(`${lineas.at(-1).op} = ${lineas.at(-1).res}`);
    pasos.push(`Factor #${factor.id}: ${factor.fuente} (${factor.anio})`);

    return {
      lineas,
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
