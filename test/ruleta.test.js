import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  MAXIMO_OPCIONES,
  anadirOpcion,
  borrarOpcion,
  vaciar,
  sePuedeAnadir,
  sePuedeGirar,
  serializar,
  deserializar,
  girar,
  numeroAleatorio,
  anguloFinal,
  VUELTAS,
} from '../src/ruleta.js';

const ruletaCon = (cantidad) =>
  Array.from({ length: cantidad }, (_, i) => `Opción ${i + 1}`);

test('añadir recorta los espacios del principio y del final', () => {
  const { opciones, motivo } = anadirOpcion([], '  Pizza  ');
  assert.deepEqual(opciones, ['Pizza']);
  assert.equal(motivo, null);
});

test('añadir rechaza el texto vacío o solo con espacios', () => {
  for (const texto of ['', '   ', '\t\n']) {
    const { opciones, motivo } = anadirOpcion(['Sushi'], texto);
    assert.deepEqual(opciones, ['Sushi']);
    assert.equal(motivo, 'vacia');
  }
});

test('añadir permite Opciones repetidas', () => {
  const { opciones, motivo } = anadirOpcion(['Pizza', 'Sushi'], 'Pizza');
  assert.deepEqual(opciones, ['Pizza', 'Sushi', 'Pizza']);
  assert.equal(motivo, null);
});

test(`añadir rechaza la Opción ${MAXIMO_OPCIONES + 1} porque la Ruleta está llena`, () => {
  const llena = ruletaCon(MAXIMO_OPCIONES);
  const { opciones, motivo } = anadirOpcion(llena, 'Una más');
  assert.equal(opciones, llena);
  assert.equal(motivo, 'llena');
});

test('añadir no modifica la Ruleta recibida y devuelve una inmutable', () => {
  const original = ['Pizza'];
  const { opciones } = anadirOpcion(original, 'Sushi');
  assert.deepEqual(original, ['Pizza']);
  assert.ok(Object.isFrozen(opciones));
});

test('borrar por posición con repetidas borra solo la aparición indicada', () => {
  const opciones = borrarOpcion(['Pizza', 'Sushi', 'Pizza', 'Tacos'], 2);
  assert.deepEqual(opciones, ['Pizza', 'Sushi', 'Tacos']);
  assert.ok(Object.isFrozen(opciones));
});

test('borrar una posición que no existe deja la Ruleta igual', () => {
  assert.deepEqual(borrarOpcion(['Pizza'], 5), ['Pizza']);
  assert.deepEqual(borrarOpcion(['Pizza'], -1), ['Pizza']);
});

test('vaciar deja la Ruleta sin Opciones', () => {
  assert.deepEqual(vaciar(), []);
});

test('se puede girar con al menos 2 Opciones', () => {
  assert.equal(sePuedeGirar(ruletaCon(0)), false);
  assert.equal(sePuedeGirar(ruletaCon(1)), false);
  assert.equal(sePuedeGirar(ruletaCon(2)), true);
});

test(`se puede añadir mientras haya menos de ${MAXIMO_OPCIONES} Opciones`, () => {
  assert.equal(MAXIMO_OPCIONES, 20);
  assert.equal(sePuedeAnadir(ruletaCon(19)), true);
  assert.equal(sePuedeAnadir(ruletaCon(20)), false);
});

test('serializar y luego deserializar devuelve la misma Ruleta, en orden y con repetidas', () => {
  const original = ['Pizza', 'Sushi', 'Pizza', 'Tacos'];
  const opciones = deserializar(serializar(original));
  assert.deepEqual(opciones, original);
  assert.ok(Object.isFrozen(opciones));
});

test('serializar guarda la Ruleta como un array JSON', () => {
  assert.deepEqual(JSON.parse(serializar(['Pizza', 'Sushi'])), ['Pizza', 'Sushi']);
});

test('deserializar un dato ausente o un JSON roto devuelve la Ruleta vacía', () => {
  for (const texto of [null, undefined, '', '{roto', '["Pizza"']) {
    assert.deepEqual(deserializar(texto), []);
  }
});

test('deserializar algo que no es un array devuelve la Ruleta vacía', () => {
  for (const texto of ['null', '"Pizza"', '42', 'true', '{"opciones":["Pizza"]}']) {
    assert.deepEqual(deserializar(texto), []);
  }
});

test('deserializar un array con elementos que no son texto devuelve la Ruleta vacía', () => {
  for (const texto of ['["Pizza", 3]', '["Pizza", null]', '[["Pizza"]]', '[{"texto":"Pizza"}]']) {
    assert.deepEqual(deserializar(texto), []);
  }
});

test('deserializar recorta los espacios y descarta las Opciones vacías', () => {
  assert.deepEqual(deserializar('["  Pizza ", "", "   ", "Sushi"]'), ['Pizza', 'Sushi']);
});

test(`deserializar más de ${MAXIMO_OPCIONES} Opciones conserva solo las ${MAXIMO_OPCIONES} primeras`, () => {
  const opciones = deserializar(JSON.stringify(ruletaCon(MAXIMO_OPCIONES + 5)));
  assert.deepEqual(opciones, ruletaCon(MAXIMO_OPCIONES));
});

const fuenteFija = (valor) => () => valor;
const CASI_UNO = 1 - Number.EPSILON;

test('un Giro con la fuente en 0 cae en el primer sector', () => {
  assert.equal(girar(ruletaCon(5), fuenteFija(0)), 0);
});

test('un Giro con la fuente casi en 1 cae en el último sector', () => {
  for (let cantidad = 2; cantidad <= MAXIMO_OPCIONES; cantidad++) {
    assert.equal(girar(ruletaCon(cantidad), fuenteFija(CASI_UNO)), cantidad - 1);
  }
});

test('para cada sector hay un valor de la fuente que lo elige', () => {
  for (let cantidad = 2; cantidad <= MAXIMO_OPCIONES; cantidad++) {
    for (let indice = 0; indice < cantidad; indice++) {
      const valor = (indice + 0.5) / cantidad;
      assert.equal(girar(ruletaCon(cantidad), fuenteFija(valor)), indice);
    }
  }
});

test('con Opciones repetidas cada aparición es un sector propio', () => {
  const opciones = ['Pizza', 'Sushi', 'Pizza'];
  const elegidos = [0.1, 0.5, 0.9].map((valor) => girar(opciones, fuenteFija(valor)));
  assert.deepEqual(elegidos, [0, 1, 2]);
});

test('con menos de 2 Opciones no hay Giro', () => {
  assert.equal(girar(ruletaCon(0), fuenteFija(0)), null);
  assert.equal(girar(ruletaCon(1), fuenteFija(0)), null);
});

test('sin fuente inyectada el Giro usa crypto.getRandomValues', (t) => {
  const getRandomValues = t.mock.method(globalThis.crypto, 'getRandomValues', (array) => {
    array[0] = 2 ** 32 - 1;
    return array;
  });
  assert.equal(girar(ruletaCon(4)), 3);
  assert.equal(getRandomValues.mock.callCount(), 1);
});

test('numeroAleatorio devuelve un número en [0, 1)', () => {
  for (let i = 0; i < 100; i++) {
    const valor = numeroAleatorio();
    assert.ok(valor >= 0 && valor < 1, `${valor}`);
  }
});

// Ángulo, en [0, 360), en el que queda el centro de un sector tras rotar la rueda.
const centroTrasGirar = (angulo, indice, cantidad) => {
  const paso = 360 / cantidad;
  return (((angulo + indice * paso + paso / 2) % 360) + 360) % 360;
};
const bajoElIndicador = (grados) => Math.min(grados, 360 - grados) < 1e-9;

test('el ángulo final deja el centro del sector bajo el indicador e incluye varias vueltas', () => {
  assert.ok(VUELTAS >= 3);
  for (let cantidad = 2; cantidad <= MAXIMO_OPCIONES; cantidad++) {
    for (let indice = 0; indice < cantidad; indice++) {
      const angulo = anguloFinal(indice, cantidad);
      assert.ok(bajoElIndicador(centroTrasGirar(angulo, indice, cantidad)), `${indice} de ${cantidad}`);
      assert.ok(angulo >= VUELTAS * 360, `${indice} de ${cantidad}: ${angulo}`);
      assert.ok(angulo < (VUELTAS + 1) * 360, `${indice} de ${cantidad}: ${angulo}`);
    }
  }
});

test('el ángulo final sigue hacia delante desde el ángulo en que quedó la rueda', () => {
  const desde = anguloFinal(2, 7);
  for (let indice = 0; indice < 7; indice++) {
    const angulo = anguloFinal(indice, 7, { desde });
    assert.ok(bajoElIndicador(centroTrasGirar(angulo, indice, 7)));
    assert.ok(angulo >= desde + VUELTAS * 360);
    assert.ok(angulo < desde + (VUELTAS + 1) * 360);
  }
});

test('sin vueltas, el ángulo final avanza menos de una vuelta', () => {
  const angulo = anguloFinal(1, 4, { desde: 100, vueltas: 0 });
  assert.ok(bajoElIndicador(centroTrasGirar(angulo, 1, 4)));
  assert.ok(angulo >= 100 && angulo < 460);
});
