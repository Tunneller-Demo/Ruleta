// Conecta el DOM con las reglas de la Ruleta.

import {
  MAXIMO_OPCIONES,
  MINIMO_PARA_GIRAR,
  anadirOpcion,
  borrarOpcion,
  vaciar,
  sePuedeAnadir,
  sePuedeGirar,
  girar,
  anguloFinal,
} from './ruleta.js';
import { cargar, guardar } from './persistencia.js';
import { dibujarRueda } from './rueda.js';

const elementos = {
  formulario: document.getElementById('formulario'),
  campo: document.getElementById('campo'),
  anadir: document.getElementById('anadir'),
  lista: document.getElementById('lista'),
  listaVacia: document.getElementById('lista-vacia'),
  contador: document.getElementById('contador'),
  vaciar: document.getElementById('vaciar'),
  girar: document.getElementById('girar'),
  aviso: document.getElementById('aviso'),
  rueda: document.getElementById('rueda'),
  sectores: document.getElementById('rueda-sectores'),
  resultado: document.getElementById('resultado'),
};

// Duración del Giro en milisegundos: normal y con movimiento reducido.
const DURACION_GIRO = 4000;
const DURACION_GIRO_REDUCIDO = 300;
const movimientoReducido = window.matchMedia('(prefers-reduced-motion: reduce)');

let opciones = cargar();
let girando = false;
// Ángulo acumulado de la rueda, para que cada Giro siga hacia delante desde donde quedó.
let angulo = 0;

// Cada cambio de la Ruleta se guarda al momento. El Resultado anterior ya no corresponde a la rueda.
function actualizar(nuevas) {
  opciones = nuevas;
  guardar(opciones);
  elementos.resultado.textContent = '';
}

function avisoActual() {
  if (!sePuedeAnadir(opciones)) {
    return `La Ruleta está llena: caben ${MAXIMO_OPCIONES} Opciones como máximo.`;
  }
  if (!sePuedeGirar(opciones)) {
    return `Hacen falta al menos ${MINIMO_PARA_GIRAR} Opciones para girar.`;
  }
  return '';
}

// Con Opciones repetidas, el nombre accesible dice qué aparición borra cada ✕.
function nombreDeBorrar(opcion, posicion) {
  const apariciones = opciones.filter((otra) => otra === opcion).length;
  if (apariciones === 1) return `Borrar ${opcion}`;
  const numero = opciones.slice(0, posicion + 1).filter((otra) => otra === opcion).length;
  return `Borrar ${opcion} (${numero}.ª de ${apariciones})`;
}

function pintarLista() {
  const filas = opciones.map((opcion, posicion) => {
    const fila = document.createElement('li');
    fila.className = 'opcion';

    const texto = document.createElement('span');
    texto.className = 'opcion-texto';
    texto.textContent = opcion;

    const borrar = document.createElement('button');
    borrar.type = 'button';
    borrar.className = 'opcion-borrar';
    borrar.textContent = '✕';
    borrar.setAttribute('aria-label', nombreDeBorrar(opcion, posicion));
    borrar.dataset.posicion = String(posicion);
    borrar.disabled = girando;

    fila.append(texto, borrar);
    return fila;
  });
  elementos.lista.replaceChildren(...filas);
}

function nombreDeRueda() {
  if (opciones.length === 0) return 'Ruleta sin Opciones';
  if (opciones.length === 1) return 'Ruleta con 1 Opción';
  return `Ruleta con ${opciones.length} Opciones`;
}

function pintar() {
  pintarLista();
  dibujarRueda(elementos.sectores, opciones);
  elementos.rueda.setAttribute('aria-label', nombreDeRueda());
  const hayOpciones = opciones.length > 0;
  elementos.listaVacia.hidden = hayOpciones;
  elementos.contador.textContent = `(${opciones.length} de ${MAXIMO_OPCIONES})`;
  // Mientras gira no se puede volver a girar ni editar la Ruleta.
  elementos.campo.disabled = girando;
  elementos.vaciar.disabled = girando || !hayOpciones;
  elementos.anadir.disabled = girando || !sePuedeAnadir(opciones);
  elementos.girar.disabled = girando || !sePuedeGirar(opciones);
  elementos.aviso.textContent = avisoActual();
}

// Primero se sortea el Resultado y luego la rueda gira hasta él: la animación no influye en el sorteo.
function hacerGiro() {
  if (girando) return;
  const indice = girar(opciones);
  if (indice === null) return;
  const reducido = movimientoReducido.matches;
  const duracion = reducido ? DURACION_GIRO_REDUCIDO : DURACION_GIRO;
  angulo = anguloFinal(indice, opciones.length, reducido ? { desde: angulo, vueltas: 0 } : { desde: angulo });

  girando = true;
  elementos.resultado.textContent = '';
  pintar();
  elementos.sectores.style.transitionDuration = `${duracion}ms`;
  elementos.sectores.style.transform = `rotate(${angulo}deg)`;

  // Un temporizador y no transitionend, que no salta si la pestaña está oculta.
  setTimeout(() => {
    girando = false;
    elementos.resultado.textContent = `Resultado: ${opciones[indice]}`;
    pintar();
    elementos.girar.focus();
  }, duracion);
}

elementos.formulario.addEventListener('submit', (evento) => {
  evento.preventDefault();
  const resultado = anadirOpcion(opciones, elementos.campo.value);
  if (resultado.motivo === null) {
    actualizar(resultado.opciones);
    elementos.campo.value = '';
  } else if (resultado.motivo === 'vacia') {
    elementos.campo.value = '';
  }
  pintar();
  elementos.campo.focus();
});

elementos.lista.addEventListener('click', (evento) => {
  const borrar = evento.target.closest('.opcion-borrar');
  if (!borrar) return;
  const posicion = Number(borrar.dataset.posicion);
  actualizar(borrarOpcion(opciones, posicion));
  pintar();
  // Deja el foco en una ✕ cercana para seguir borrando con el teclado.
  const botones = elementos.lista.querySelectorAll('.opcion-borrar');
  const siguiente = botones[Math.min(posicion, botones.length - 1)];
  (siguiente ?? elementos.campo).focus();
});

elementos.girar.addEventListener('click', hacerGiro);

elementos.vaciar.addEventListener('click', () => {
  if (!window.confirm('¿Vaciar la Ruleta? Se borrarán todas las Opciones.')) return;
  actualizar(vaciar());
  pintar();
  elementos.campo.focus();
});

pintar();
