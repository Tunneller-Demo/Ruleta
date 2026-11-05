// Dibuja la Ruleta en SVG: un sector igual por Opción, en el orden de la lista.
// El sector 0 empieza arriba, bajo el indicador, y los demás siguen en sentido horario.
// Solo se dibuja el grupo de sectores; el indicador está fuera y no gira con él.

const SVG = 'http://www.w3.org/2000/svg';
const RADIO = 96;
const INICIO_TEXTO = 30;
const FIN_TEXTO = 90;
const ELIPSIS = '…';
// Con 0 y 1 Opciones el texto va centrado en horizontal, algo por debajo del eje.
const DEBAJO_DEL_EJE = 24;
const LETRA_MINIMA = 7;
const LETRA_MAXIMA = 12;
// Margen para que el texto no roce los bordes del sector.
const HOLGURA = 0.85;

export const PALETA = Object.freeze(['#c2410c', '#0f766e', '#6d28d9', '#a16207']);

// Asigna la paleta en ciclo; si el último sector acabaría con el color del primero,
// toma uno que no coincide ni con el primero ni con el penúltimo.
export function coloresDeSectores(cantidad) {
  const colores = Array.from({ length: cantidad }, (_, i) => PALETA[i % PALETA.length]);
  if (cantidad > 1 && colores[cantidad - 1] === colores[0]) {
    colores[cantidad - 1] = PALETA.find(
      (color) => color !== colores[0] && color !== colores[cantidad - 2],
    );
  }
  return colores;
}

function crear(nombre, atributos = {}) {
  const elemento = document.createElementNS(SVG, nombre);
  for (const [atributo, valor] of Object.entries(atributos)) {
    elemento.setAttribute(atributo, String(valor));
  }
  return elemento;
}

// Ángulo en grados desde las 12, en sentido horario.
function punto(grados, radio) {
  const radianes = (grados * Math.PI) / 180;
  return [radio * Math.sin(radianes), -radio * Math.cos(radianes)];
}

function sector(desde, hasta, color) {
  const [x1, y1] = punto(desde, RADIO);
  const [x2, y2] = punto(hasta, RADIO);
  const arcoLargo = hasta - desde > 180 ? 1 : 0;
  return crear('path', {
    d: `M 0 0 L ${x1} ${y1} A ${RADIO} ${RADIO} 0 ${arcoLargo} 1 ${x2} ${y2} Z`,
    fill: color,
  });
}

// Recorta el texto ya insertado en el documento hasta que mida como mucho `maximo`.
function recortar(texto, opcion, maximo) {
  texto.textContent = opcion;
  if (texto.getComputedTextLength() <= maximo) return;
  const caracteres = Array.from(opcion);
  let cabe = 0;
  let sobra = caracteres.length;
  while (sobra - cabe > 1) {
    const medio = Math.floor((cabe + sobra) / 2);
    texto.textContent = caracteres.slice(0, medio).join('').trimEnd() + ELIPSIS;
    if (texto.getComputedTextLength() <= maximo) cabe = medio;
    else sobra = medio;
  }
  texto.textContent = caracteres.slice(0, cabe).join('').trimEnd() + ELIPSIS;
}

// El tamaño de letra cabe en el ancho del sector al principio del texto.
function tamanoDeLetra(cantidad) {
  const anchoInicial = (2 * Math.PI * INICIO_TEXTO) / cantidad;
  return Math.max(LETRA_MINIMA, Math.min(LETRA_MAXIMA, anchoInicial * HOLGURA));
}

// Con 0 y 1 Opciones no hay sectores: un círculo entero y el texto en horizontal.
function textoCentrado(atributos) {
  return crear('text', { ...atributos, y: DEBAJO_DEL_EJE, 'text-anchor': 'middle', 'dominant-baseline': 'central' });
}

export function dibujarRueda(grupo, opciones) {
  const cantidad = opciones.length;
  const letra = tamanoDeLetra(cantidad);

  if (cantidad === 0) {
    const aviso = textoCentrado({ class: 'rueda-aviso' });
    aviso.textContent = 'Añade Opciones';
    grupo.replaceChildren(crear('circle', { r: RADIO, class: 'rueda-vacia' }), aviso);
    return;
  }

  const colores = coloresDeSectores(cantidad);
  const dibujos = [];
  const textos = [];

  if (cantidad === 1) {
    const texto = textoCentrado({ class: 'rueda-texto', 'font-size': letra });
    dibujos.push(crear('circle', { r: RADIO, fill: colores[0] }), texto);
    textos.push({ texto, opcion: opciones[0], maximo: 2 * FIN_TEXTO * HOLGURA });
  } else {
    const paso = 360 / cantidad;
    opciones.forEach((opcion, i) => {
      // Texto en dirección radial, desde cerca del centro hacia el borde del sector.
      const centro = i * paso + paso / 2;
      const texto = crear('text', {
        class: 'rueda-texto',
        'font-size': letra,
        x: INICIO_TEXTO,
        'dominant-baseline': 'central',
        transform: `rotate(${centro - 90})`,
      });
      dibujos.push(sector(i * paso, (i + 1) * paso, colores[i]), texto);
      textos.push({ texto, opcion, maximo: FIN_TEXTO - INICIO_TEXTO });
    });
  }

  grupo.replaceChildren(...dibujos);
  // Se mide después de insertar, cuando el texto ya tiene tamaño.
  for (const { texto, opcion, maximo } of textos) recortar(texto, opcion, maximo);
}
