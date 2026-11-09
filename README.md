# TRANSFIERO PRO

Repositorio de la versión de pago de TRANSFIERO (extensión de Chrome para enviar archivos entre PC y móvil).

El repositorio de la versión gratuita (TRANSFIERO, color morado) es independiente: `transfiero-extension-server`.

## Estructura

- `extension/`: código de la extensión TRANSFIERO PRO (es el mismo que se sube a la Chrome Web Store).
- `phone/` y `shared/`: página del móvil, publicada con GitHub Pages en `https://codenhacer.github.io/transfiero-pro/phone/`.
- `server/`: servidor de emparejamiento (Node.js). Se despliega en Render; actualmente la versión PRO usa el mismo servidor que la gratuita.

## Publicación

1. GitHub Pages: Settings → Pages → Source: Deploy from a branch → `main` / `(root)`.
2. La extensión se carga desde `extension/` con "Cargar descomprimida", o se empaqueta comprimiendo el contenido de esa carpeta.
