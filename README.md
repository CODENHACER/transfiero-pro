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

### 1.4.0 — Textos, móvil recordado y descargas ordenadas

- **Novedad (textos):** envía textos, enlaces y códigos (2FA, contraseñas…) entre el PC y el móvil en un mensaje cifrado que llega al instante. En el PC también arrastrando texto o pegándolo con Ctrl+V. Botones Copiar y Abrir en lo recibido, y quedan en el historial.
- **Novedad (dispositivos):** tu móvil queda **recordado** tras la primera conexión por QR. En el PC aparece la lista «Tus dispositivos» con botón **Conectar** (sin escanear nada) y en el móvil la página se conecta sola al último PC. Verificación automática por prueba del canal: si la conexión no es directa, se cancela.
- **Novedad (guardado):** Ajustes → «Cómo guardar lo recibido»: todo junto en Descargas, en la subcarpeta `TRANSFIERO` o por meses (`TRANSFIERO/2026-11`). Los archivos recibidos tienen botones **Mostrar** y **Abrir**.
- Añadido el permiso `downloads` (el único nuevo; se usa para guardar lo recibido sin diálogos y abrir su carpeta).
- **Arreglo:** la ayuda en francés, alemán y rumano prometía un ajuste de carpeta inexistente; reescrita la sección en los 6 idiomas. Mejorada la pantalla del móvil al abrirla sin enlace.
- La función «elegir carpeta» de las 1.3.7/1.3.8 queda aparcada (detalles en `CAMBIOS-1.4.0.md`); la base de esta versión es la 1.3.6.
- El servidor de emparejamiento y la versión gratuita no cambian.

### 1.3.8 — Carpeta de descarga que funciona de verdad

- **Arreglo:** la función de elegir carpeta de descarga de la 1.3.7 nunca llegaba a usarse por dos errores distintos (detalles en `CAMBIOS-1.3.8.md`).
- El selector nativo de carpetas ahora se abre en una **pestaña propia de la extensión** (`select-folder.html`), porque en el panel lateral Chrome cancela el selector aunque el usuario elija carpeta (bug conocido de Chrome en extensiones).
- La carpeta elegida queda guardada (IndexedDB) y el panel lateral se actualiza solo al cerrar la pestaña; la pestaña se cierra ella sola al terminar.
- Arreglado el estado del permiso (`queryPermission` devuelve una cadena, no un objeto) y el aviso «Permitir acceso», que ahora solo aparece cuando de verdad hace falta.
- Si la carpeta no está disponible (renombrada, disco desconectado), los archivos van a Descargas sin avisos molestos, y la carpeta vuelve a funcionar sola cuando reaparezca.
- Textos nuevos en los 6 idiomas (es · en · ca · fr · de · ro) y sección de Instrucciones actualizada.
- Sin permisos nuevos en el manifest.

### 1.3.7 — Carpeta de descarga

- **Novedad:** en Ajustes → **Carpeta de descarga** puedes pulsar **Elegir carpeta…** para que los archivos recibidos del móvil se guarden directamente en cualquier carpeta del equipo (no solo en las descargas de Chrome).
- La carpeta se recuerda entre sesiones (handle en IndexedDB). Si Chrome pide otra vez permiso, aparece un aviso con el botón **Permitir acceso** en el panel.
- Si la carpeta deja de estar disponible, se vuelve automáticamente al comportamiento anterior (descarga en la carpeta de descargas del navegador).
- Sin permisos nuevos en el manifest: se usa la File System Access API del navegador, sin `chrome.downloads`.
- Cada archivo recibido indica dónde se ha guardado («Guardado en …»).
- Textos nuevos en los 6 idiomas (es · en · ca · fr · de · ro), nueva sección en Instrucciones y nota en la política de privacidad.
- Se eliminan `select-folder.html` y `select-folder.js` (restos no funcionales de un intento anterior de esta misma función).
