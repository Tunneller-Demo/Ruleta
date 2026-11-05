import { test } from 'node:test';
import assert from 'node:assert/strict';

import { coloresDeSectores, PALETA } from '../src/rueda.js';

test('hay un color por sector y todos son de la paleta', () => {
  for (let cantidad = 0; cantidad <= 20; cantidad++) {
    const colores = coloresDeSectores(cantidad);
    assert.equal(colores.length, cantidad);
    assert.ok(colores.every((color) => PALETA.includes(color)));
  }
});

test('dos sectores vecinos nunca comparten color, tampoco el último con el primero', () => {
  for (let cantidad = 2; cantidad <= 20; cantidad++) {
    const colores = coloresDeSectores(cantidad);
    colores.forEach((color, i) => {
      const siguiente = colores[(i + 1) % cantidad];
      assert.notEqual(color, siguiente, `con ${cantidad} sectores, el ${i} y el siguiente`);
    });
  }
});
