import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  MAXIMO_OPCIONES,
  anadirOpcion,
  borrarOpcion,
  vaciar,
  sePuedeAnadir,
  sePuedeGirar,
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
