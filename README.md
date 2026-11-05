# Ruleta

Una Ruleta para tomar decisiones: escribe tus Opciones y deja que la Ruleta elija.

## Abrir la página

Es una web estática con módulos ES nativos, sin compilación ni dependencias. Sírvela desde la raíz del repositorio con cualquier servidor estático, por ejemplo:

```sh
python -m http.server 8000
```

y abre <http://localhost:8000>. (Abrir `index.html` directamente con `file://` no funciona porque los navegadores bloquean ahí los módulos ES.)

## Pruebas

Las reglas de la Ruleta viven en `src/ruleta.js`, sin DOM, y se prueban con el ejecutor integrado de Node (versión 20 o posterior):

```sh
node --test
```

Las pruebas están en `test/` y la página no las carga.
