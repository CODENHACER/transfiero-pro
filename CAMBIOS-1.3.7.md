# Cambios de la versión 1.3.7 — Carpeta de descarga

Nueva función PRO: elegir **en qué carpeta del PC** se guardan los archivos recibidos del móvil
(en Ajustes → **Carpeta de descarga** → **Elegir carpeta…**), usando la File System Access API
del navegador. Sin permisos nuevos en el manifest y con retorno automático a la descarga normal
de Chrome si la carpeta deja de estar disponible.

## Archivos añadidos

| Archivo | Descripción |
|---|---|
| `extension/shared/fsdir.js` | Módulo nuevo: selector de carpeta, handle en IndexedDB, permisos, guardado con nombres únicos (`foto (1).jpg`). |
| `shared/fsdir.js` | Copia raíz para mantener `extension/shared/` y `shared/` sincronizados (lo usa la página del móvil). |
| `CAMBIOS-1.3.7.md` | Este documento. |

## Archivos modificados

| Archivo | Cambio |
|---|---|
| `extension/manifest.json` | Versión 1.3.6 → **1.3.7** (nada más). |
| `extension/app.html` | Fila "Carpeta de descarga" en Ajustes (`btnPickDir`, `btnClearDir`, `dlName`) y aviso "Permitir acceso" (`dlBar`, `btnGrantDir`) en la tarjeta de recibidos. |
| `extension/app.js` | Import de `fsdir.js`; `saveReceived()` con cola de escrituras (carpeta si hay permiso, descarga normal si no); fila con destino («Guardado en …»); `updateDlUI()`, `refreshDlBar()`; handlers de los 3 botones; `init()` restaura la carpeta guardada y repara ajustes/handle desparejados. |
| `extension/style.css` | Estilos `.dl-setting`, `.dl-now`, `.dl-actions`, `.dlbar`. |
| `extension/help.html` | Nueva sección "Carpeta de descarga" (después de "Historial local"). |
| `extension/shared/store.js` | Ajuste por defecto `dlFolder: null`. |
| `extension/shared/i18n.js` | Bloque `V137_KEYS` (es·en·ca): 12 claves nuevas + `help.settings` ampliado. |
| `extension/shared/lang-fr.js` | Claves nuevas en francés. |
| `extension/shared/lang-de.js` | Claves nuevas en alemán. |
| `extension/shared/lang-ro.js` | Claves nuevas en rumano. |
| `shared/store.js`, `shared/i18n.js`, `shared/lang-fr.js`, `shared/lang-de.js`, `shared/lang-ro.js` | Copias raíz sincronizadas con `extension/shared/`. |
| `README.md` | Historial de versiones 1.3.7. |
| `PRIVACIDAD.md` | Nota sobre la carpeta elegida (handle solo en IndexedDB local, sin permisos nuevos); fecha → noviembre de 2026. |

## Archivos eliminados

| Archivo | Motivo |
|---|---|
| `select-folder.html` | Resto de un intento anterior: estaba en la raíz (origen github.io), donde `chrome.storage` y los handles de la extensión no funcionan. La función ahora vive dentro de la extensión. |
| `select-folder.js` | Ídem. |

## Claves i18n nuevas (es·en·ca·fr·de·ro)

`set.dl`, `set.dl.d`, `set.dl.btn`, `set.dl.reset`, `set.dl.now`, `set.dl.cur`, `set.dl.err`,
`set.dl.ask`, `set.dl.grant`, `recv.savedIn`, `recv.savedDl`, `help.dl_h`, `help.dl`
(+ `help.settings` ampliado en todos los idiomas).

## Sugerencia de commit

```
Carpetas de descarga elegible en 1.3.7: File System Access API con handle en
IndexedDB, botón "Permitir acceso" si el permiso caduca y retorno automático a
las descargas de Chrome. Sin permisos nuevos. Textos en 6 idiomas.
Se eliminan select-folder.html/js (intento anterior no funcional).
```
