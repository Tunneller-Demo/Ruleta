// Reglas de la Ruleta, sin DOM: funciones puras sobre una Ruleta inmutable (un array congelado de Opciones).

export const MAXIMO_OPCIONES = 20;
export const MINIMO_PARA_GIRAR = 2;

const congelar = (opciones) => Object.freeze([...opciones]);

// Devuelve { opciones, motivo }. Si la Opción no se añade, `opciones` es la misma
// Ruleta recibida y `motivo` es 'vacia' o 'llena'; si se añade, `motivo` es null.
export function anadirOpcion(opciones, texto) {
  const opcion = String(texto).trim();
  if (opcion === '') return { opciones, motivo: 'vacia' };
  if (!sePuedeAnadir(opciones)) return { opciones, motivo: 'llena' };
  return { opciones: congelar(opciones.concat(opcion)), motivo: null };
}

// Borra por posición, no por texto, para que las repetidas se borren de una en una.
export function borrarOpcion(opciones, posicion) {
  if (!Number.isInteger(posicion) || posicion < 0 || posicion >= opciones.length) {
    return opciones;
  }
  return congelar(opciones.filter((_, i) => i !== posicion));
}

export function vaciar() {
  return congelar([]);
}

export function sePuedeAnadir(opciones) {
  return opciones.length < MAXIMO_OPCIONES;
}

export function sePuedeGirar(opciones) {
  return opciones.length >= MINIMO_PARA_GIRAR;
}
