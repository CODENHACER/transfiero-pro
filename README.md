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

## Historial de versiones

### 1.3.7 — Carpeta de descarga

- **Novedad:** en Ajustes → **Carpeta de descarga** puedes pulsar **Elegir carpeta…** para que los archivos recibidos del móvil se guarden directamente en cualquier carpeta del equipo (no solo en las descargas de Chrome).
- La carpeta se recuerda entre sesiones (handle en IndexedDB). Si Chrome pide otra vez permiso, aparece un aviso con el botón **Permitir acceso** en el panel.
- Si la carpeta deja de estar disponible, se vuelve automáticamente al comportamiento anterior (descarga en la carpeta de descargas del navegador).
- Sin permisos nuevos en el manifest: se usa la File System Access API del navegador, sin `chrome.downloads`.
- Cada archivo recibido indica dónde se ha guardado («Guardado en …»).
- Textos nuevos en los 6 idiomas (es · en · ca · fr · de · ro), nueva sección en Instrucciones y nota en la política de privacidad.
- Se eliminan `select-folder.html` y `select-folder.js` (restos no funcionales de un intento anterior de esta misma función).
