// Reglas de la Ruleta, sin DOM: funciones puras sobre una Ruleta inmutable (un array congelado de Opciones).
// La única excepción es la fuente de aleatoriedad por defecto del Giro, que se puede inyectar.

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

export function serializar(opciones) {
  return JSON.stringify(opciones);
}

// Nunca lanza: ante un dato que no sea una lista de textos devuelve la Ruleta vacía,
// y a una lista válida le aplica las mismas reglas que al añadir (recorte, vacías y máximo).
export function deserializar(texto) {
  let datos;
  try {
    datos = JSON.parse(texto);
  } catch {
    return vaciar();
  }
  if (!Array.isArray(datos) || !datos.every((opcion) => typeof opcion === 'string')) {
    return vaciar();
  }
  const opciones = datos.map((opcion) => opcion.trim()).filter((opcion) => opcion !== '');
  return congelar(opciones.slice(0, MAXIMO_OPCIONES));
}

// Vueltas completas que da la rueda en cada Giro antes de frenar en el Resultado.
export const VUELTAS = 5;

// Número en [0, 1) sacado de la fuente de aleatoriedad criptográfica del navegador.
export function numeroAleatorio() {
  const [valor] = globalThis.crypto.getRandomValues(new Uint32Array(1));
  return valor / 2 ** 32;
}

// Devuelve la posición del sector del Resultado, con la misma probabilidad para cada uno,
// o null si no se puede girar. `aleatorio` devuelve un número en [0, 1).
export function girar(opciones, aleatorio = numeroAleatorio) {
  if (!sePuedeGirar(opciones)) return null;
  const indice = Math.floor(aleatorio() * opciones.length);
  return Math.min(Math.max(indice, 0), opciones.length - 1);
}

// Ángulo en grados, en sentido horario, al que se rota la rueda para que el centro del sector
// `indice` quede bajo el indicador (arriba). Es el menor que da al menos `vueltas` completas
// desde `desde`, el ángulo en que quedó la rueda, para que siempre gire hacia delante.
export function anguloFinal(indice, cantidad, { desde = 0, vueltas = VUELTAS } = {}) {
  const paso = 360 / cantidad;
  const destino = normalizar(-(indice * paso + paso / 2));
  const minimo = desde + vueltas * 360;
  const resto = normalizar(minimo - destino);
  return resto === 0 ? minimo : minimo + 360 - resto;
}

// Lleva un ángulo en grados a [0, 360).
function normalizar(grados) {
  return ((grados % 360) + 360) % 360;
}
