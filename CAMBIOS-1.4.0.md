# CAMBIOS EN LA VERSIÓN 1.4.0

**De qué va esta versión:** las tres funciones más pedidas — textos y enlaces entre
dispositivos, el móvil recordado (conexión sin QR) y las descargas ordenadas — más un
arreglo de unos textos de ayuda desfasados.

Base: la 1.3.6 limpia. La función «elegir carpeta de descarga» de las versiones
1.3.7 y 1.3.8 queda aparcada definitivamente (no se incluye): su lugar lo ocupa el
guardado ordenado descrito abajo, que funciona siempre y sin diálogos de permisos.

## 1. Textos, enlaces y códigos (PC ↔ móvil)

- Nueva caja **«Texto, enlace o código…»** en el panel del PC (tarjeta *Enviar al
  móvil*) y en la página del móvil (sección *Enviar al PC*).
- Un texto corto viaja en un único mensaje cifrado del canal de datos (`{t:"text"}`),
  sin progresos ni empaquetado: llega al instante. Ideal para códigos de
  verificación (2FA), enlaces, direcciones o contraseñas.
- Lo recibido aparece como una fila más, con vista previa de texto, botón
  **Copiar** y, si es un enlace (`http…`), botón **Abrir**.
- En el PC también puedes **arrastrar texto seleccionado** a la zona de envío o
  **pegarlo en el panel con Ctrl+V** (fuera de los campos de escritura).
- **Enter** envía; **Shift+Enter** hace salto de línea.
- Los textos quedan en el **historial** igual que los archivos (con su contenido,
  para poder copiarlos después). Si borras el historial, se borran también.

## 2. Tu móvil recordado — conectar sin escanear el QR

- La primera vez que conectas por QR y verificas el código de 6 cifras, el PC y el
  móvil intercambian un **secreto aleatorio por el canal ya cifrado** (nunca pasa
  por el servidor de emparejamiento). A partir de ahí:
  - En el PC aparece la lista **«Tus dispositivos»** bajo el código QR, con el
    nombre del móvil (modelo de Android, «iPhone», etc.) y los botones
    **Conectar** y **Olvidar**. Máximo 5 dispositivos.
  - En el móvil, la página de TRANSFIERO se abre sin enlace y **se conecta sola**
    al último PC; también muestra la lista de tus PCs con botón de conexión y de
    «Olvidar».
- **Conectar** desde el PC no necesita QR: ambos entran en una sala derivada del
  secreto (el servidor solo ve un identificador sin significado).
- **Verificación automática:** en lugar del código de 6 cifras, cada extremo
  calcula una prueba HMAC del secreto sobre las huellas DTLS de *esta* conexión.
  Solo coincide si hablan directamente: si hubiera un intermediario, las huellas
  no cuadrarían y la conexión se cancela con «Verificación de seguridad fallada».
- Si el móvil no tiene la página abierta, el PC lo reintenta 3 veces (12 s cada
  intento) y luego vuelve al QR avisando que no lo encontró.
- La página del móvil reintentará la sala sola (3 s → 15 s) y se reconecta cuando
  el PC pulse **Conectar** de nuevo. Con **«Dejar de esperar»** se para y aparece la
  lista de PCs.
- El flujo QR de las versiones anteriores queda **intacto**: primera conexión,
  código de 6 cifras, «No coinciden», todo igual.

## 3. Descargas ordenadas (botones Mostrar / Abrir)

- En **Ajustes → «Cómo guardar lo recibido»** hay tres opciones:
  1. **Todo junto en Descargas** (como siempre).
  2. **En la subcarpeta TRANSFIERO** → `Descargas/TRANSFIERO/`.
  3. **En subcarpetas por mes** → `Descargas/TRANSFIERO/2026-11/`.
- Lo recibido del móvil se guarda con la API `chrome.downloads` (nuevo permiso
  **downloads**, el único que añade esta versión), sin diálogos y sin duplicar
  nombres (`uniquify`).
- Cada archivo recibido y su entrada del historial tienen botones **Mostrar**
  (abre la carpeta) y **Abrir** (abre el archivo con su aplicación).
- La fila de recibidos indica dónde ha caído: «Recibido: foto.jpg · guardado en
  TRANSFIERO».
- Fuera de la extensión (página del móvil abierta como web) se mantiene la
  descarga clásica del navegador.

## 4. Arreglos varios

- **Arreglo (ayuda):** en francés, alemán y rumano, la sección «Ajustes» de las
  Instrucciones prometía una opción de carpeta de descarga que no existía (resto
  de versiones anteriores). Redefinida en los 6 idiomas acorde a los ajustes
  reales de la 1.4.
- **Arreglo (móvil):** al abrir la página del móvil sin enlace válido, antes se
  quedaba un panel confuso; ahora la pantalla de espera explica qué hacer y, si
  hay PCs recordados, se conecta sola.
- Nueva sección en las Instrucciones («Tu móvil, recordado», «Enviar textos,
  enlaces y códigos», «Dónde se guarda lo recibido») en los 6 idiomas
  (es · en · ca · fr · de · ro).
- El manifest pasa a 1.4.0 y añade solo el permiso `downloads`.
- El servidor de emparejamiento no cambia. La versión gratuita no cambia.

## Comprobaciones recomendadas antes de publicar

1. Cargar la extensión descomprimida (`extension/`) en `chrome://extensions`.
2. **QR intacto:** conectar el móvil escaneando el QR y verificar el código de
   6 cifras como siempre.
3. **Textos:** escribir un texto en el panel y enviarlo con Enter al móvil;
   responder desde el móvil; comprobar Copiar y Abrir en un enlace; probar
   Ctrl+V en el panel y arrastrar texto seleccionado a la zona de envío.
4. **Móvil recordado:** tras conectar por QR, recargar la página del móvil (sin
   enlace): debe entrar sola y esperar al PC; en el PC, pulsar **Conectar** en
   «Tus dispositivos»: debe conectar en 1–2 s sin QR y sin código.
5. **Olvidar:** pulsar **Olvidar** en el PC y comprobar que desaparece de la
   lista (y que el móvil vuelve a mostrar la pantalla de escaneo).
6. **Móvil apagado:** con el móvil sin la página abierta, pulsar **Conectar** en
   el PC: reintentos y al final «No se ha encontrado el móvil» + QR de vuelta.
7. **Descargas:** en Ajustes probar las 3 opciones de guardado y enviarse un
   archivo desde el móvil; comprobar la subcarpeta y los botones Mostrar/Abrir
   del historial.
8. **Idiomas:** pasar por los 6 idiomas en Ajustes y revisar que no queda
   ningún texto en inglés (sobre todo la Ayuda).
9. Historial: los textos recibidos aparecen con botón Copiar y al borrar el
   historial desaparecen.
