// Conecta el DOM con las reglas de la Ruleta.

import {
  MAXIMO_OPCIONES,
  MINIMO_PARA_GIRAR,
  anadirOpcion,
  borrarOpcion,
  vaciar,
  sePuedeAnadir,
  sePuedeGirar,
} from './ruleta.js';
import { cargar, guardar } from './persistencia.js';

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
};

let opciones = cargar();

// Cada cambio de la Ruleta se guarda al momento.
function actualizar(nuevas) {
  opciones = nuevas;
  guardar(opciones);
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

    fila.append(texto, borrar);
    return fila;
  });
  elementos.lista.replaceChildren(...filas);
}

function pintar() {
  pintarLista();
  const hayOpciones = opciones.length > 0;
  elementos.listaVacia.hidden = hayOpciones;
  elementos.contador.textContent = `(${opciones.length} de ${MAXIMO_OPCIONES})`;
  elementos.vaciar.disabled = !hayOpciones;
  elementos.anadir.disabled = !sePuedeAnadir(opciones);
  elementos.girar.disabled = !sePuedeGirar(opciones);
  elementos.aviso.textContent = avisoActual();
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

elementos.vaciar.addEventListener('click', () => {
  if (!window.confirm('¿Vaciar la Ruleta? Se borrarán todas las Opciones.')) return;
  actualizar(vaciar());
  pintar();
  elementos.campo.focus();
});

pintar();
