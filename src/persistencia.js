// Guarda la Ruleta en localStorage. Si el navegador no deja guardar o leer, se ignora:
// la Ruleta funciona igual, solo que sin recordar sus Opciones.

import { serializar, deserializar, vaciar } from './ruleta.js';

const CLAVE = 'ruleta:v1';

export function cargar() {
  try {
    return deserializar(window.localStorage.getItem(CLAVE));
  } catch {
    return vaciar();
  }
}

export function guardar(opciones) {
  try {
    window.localStorage.setItem(CLAVE, serializar(opciones));
  } catch {
    // Sin almacenamiento disponible (modo privado, cuota llena, bloqueado…).
  }
}
