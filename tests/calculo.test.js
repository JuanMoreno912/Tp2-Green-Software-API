// Tests del módulo de cálculo. Ejecutar con:  npm test
// Carga los scripts del navegador en un contexto aislado (no hace falta navegador).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const JS = path.join(__dirname, '..', 'frontend', 'js');
const contexto = { window: {}, console };
contexto.window = contexto;
vm.createContext(contexto);
for (const archivo of ['config.js', 'mock-data.js', 'calculo.js']) {
  vm.runInContext(fs.readFileSync(path.join(JS, archivo), 'utf8'), contexto, { filename: archivo });
}
const { calculo, mock } = contexto.CO2;

const insumo = (codigo) => mock.insumos.find((i) => i.codigo === codigo);
const factor = (codigo) => mock.factores.find((f) => f.insumo_codigo === codigo);
const cerca = (real, esperado, tol = 1e-6) =>
  assert.ok(Math.abs(real - esperado) <= tol, `esperaba ${esperado}, obtuve ${real}`);

test('peso de una hoja A4 de 75 g/m²', () => {
  cerca(calculo.pesoHojaKg('A4', 75), 0.21 * 0.297 * 75 / 1000);
});

test('una resma A4 de 75 g/m² pesa 2,338875 kg', () => {
  const { k } = calculo.factorConversion('resma', insumo('PAPEL_A4_VIRGEN'), 75);
  cerca(k, 2.338875);
});

test('una resma oficio de 80 g/m² pesa 3,075840 kg', () => {
  const { k } = calculo.factorConversion('resma', insumo('PAPEL_OFICIO_VIRGEN'), 80);
  cerca(k, 0.216 * 0.356 * 80 / 1000 * 500);
});

test('conversiones de g, t y litro a kg', () => {
  const carton = insumo('CARTON');
  cerca(calculo.factorConversion('g', carton, 75).k, 0.001);
  cerca(calculo.factorConversion('t', carton, 75).k, 1000);
  cerca(calculo.factorConversion('litro', insumo('LIMPIEZA'), 75).k, 1.0);
});

test('120 resmas de papel reciclado: kg, emisiones y fórmula trazable', () => {
  const r = calculo.calcular({ cantidad: 120, unidad: 'resma', gramaje: 75 }, insumo('PAPEL_A4_RECICLADO'), factor('PAPEL_A4_RECICLADO'));
  cerca(r.cantidadBase, 280.665);
  cerca(r.kgco2e, 280.665 * 1.04432);
  assert.equal(r.factorId, 102);
  assert.equal(r.alcance, '3');
  assert.match(r.formula, /120 resma/);
  assert.match(r.formula, /Factor #102/);
});

test('emisiones evitadas por papel reciclado', () => {
  cerca(calculo.evitadasPorReciclado(280.665, 1.33932, 1.04432), 280.665 * 0.295);
});

test('servicios en pesos se convierten a dólares con el tipo de cambio', () => {
  const r = calculo.calcular({ cantidad: 12000000, unidad: 'ARS', tipo_cambio: 1200 }, insumo('SERVICIO_LIMPIEZA'), factor('SERVICIO_LIMPIEZA'));
  cerca(r.cantidadBase, 10000);
  cerca(r.kgco2e, 1670, 1e-6);
});

test('servicios en pesos sin tipo de cambio dan error claro', () => {
  assert.throws(
    () => calculo.calcular({ cantidad: 1000, unidad: 'ARS' }, insumo('SERVICIO_LIMPIEZA'), factor('SERVICIO_LIMPIEZA')),
    /tipo de cambio/
  );
});

test('unidad incompatible da error', () => {
  assert.throws(() => calculo.factorConversion('litro', insumo('CARTON'), 75), /No hay conversión/);
});

test('sin factor de emisión da error', () => {
  assert.throws(() => calculo.calcular({ cantidad: 1, unidad: 'kg' }, insumo('CARTON'), undefined), /No hay factor/);
});

test('estimador de exámenes: 3 hojas × 20 alumnos × 100 cátedras × 6 turnos', () => {
  assert.equal(calculo.hojasExamenes({ hojasPorExamen: 3, alumnosPorMesa: 20, catedras: 100, turnos: 6 }), 36000);
});

test('todos los insumos tienen un factor con la misma unidad base', () => {
  for (const i of mock.insumos) {
    const f = factor(i.codigo);
    assert.ok(f, `falta factor para ${i.codigo}`);
    assert.equal(f.unidad, i.unidad_base, `unidad del factor de ${i.codigo}`);
  }
});
