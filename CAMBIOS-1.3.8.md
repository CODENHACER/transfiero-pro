# CAMBIOS EN LA VERSIÓN 1.3.8

**De qué se corrige:** la función «Carpeta de descarga» introducida en 1.3.7 no funcionaba
en el uso real, aunque en las pruebas automáticas sí. Eran dos errores distintos que se
tapan el uno al otro.

## Error 1: el permiso de la carpeta se comprobaba mal

`queryPermission()` de la File System Access API **resuelve con una cadena** (`"granted"`,
`"denied"` o `"prompt"`), no con un objeto. El código de 1.3.7 hacía:

```js
(await handle.queryPermission({ mode: "readwrite" })).state   // siempre undefined
```

`"granted".state` es `undefined`, así que el chequeo `=== "granted"` fallaba **siempre**:
aunque el usuario eligiera carpeta, los archivos iban a las descargas normales del navegador
y el aviso «Permitir acceso» aparecía sin necesidad. Ahora se normaliza el resultado
(`permState()`), admitiendo cadena u objeto por si cambia en el futuro.

## Error 2: el selector de carpetas no es fiable en el panel lateral

Bug conocido de Chrome en extensiones (crbug.com/40240444): al llamar a
`showDirectoryPicker()` desde el **panel lateral** (o el popup) de una extensión, el
diálogo se abre, el usuario elige la carpeta… y Chrome devuelve `AbortError`, como si
hubiera cancelado. Es indistinguible de una cancelación, así que la función «no hacía
nada» en silencio. En macOS llega a cerrar Chrome. La solución verificada por otras
extensiones es elegir la carpeta en una **pestaña completa** de la extensión.

## Qué cambia

- Nueva página `extension/select-folder.html` + `extension/select-folder.js`: pestaña
  propia (origen de la extensión) donde el selector nativo sí funciona. Guarda el handle
  en IndexedDB (mismo origen que el panel), deja el permiso concedido y persistente si
  Chrome lo permite (122+), guarda el nombre en los ajustes y **se cierra sola** al terminar.
- En Ajustes, el botón **Elegir carpeta…** ya no abre el selector desde el panel: abre esa
  pestaña (`chrome.tabs.create`, sin permisos nuevos del manifest).
- El panel lateral se entera de la carpeta elegida por `BroadcastChannel` (y también por
  `chrome.storage.onChanged` como refuerzo) y refresca la interfaz al instante.
- Si el usuario cierra el selector sin elegir, la pestaña muestra un mensaje claro y se
  puede volver a intentar (nunca en silencio).
- El aviso «Permitir acceso» solo aparece cuando el permiso está realmente en `prompt`
  o `denied`. Si la carpeta no está disponible (renombrada, disco externo desconectado),
  no se molesta al usuario: los archivos van a Descargas y la carpeta vuelve a usarse
  sola cuando reaparezca.
- El permiso se hace **persistente** al elegir la carpeta (`persistPermission`, Chrome
  122+), para no volver a pedirlo tras reiniciar el navegador. En versiones anteriores
  el panel seguirá mostrando el botón «Permitir acceso» cuando haga falta.

## Comprobaciones recomendadas antes de publicar

1. Cargar la extensión descomprimida (`extension/`) en `chrome://extensions`.
2. Abrir el panel lateral → Ajustes → **Elegir carpeta…**: debe abrirse una pestaña y,
   al elegir carpeta, mostrar «Carpeta elegida: …» y cerrarse sola.
3. Comprobar en Ajustes que aparece «Actual: «…»» con la carpeta elegida.
4. Enviarse un archivo desde el móvil: debe guardarse en la carpeta elegida y la fila
   del historial debe decir «Guardado en «…»».
5. Repetir tras reiniciar Chrome: si vuelve a pedir permiso (Chrome anterior a 122),
   aparece «Permitir acceso» en la tarjeta de recibidos.
