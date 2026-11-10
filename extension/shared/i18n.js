import { FR } from "./lang-fr.js";
import { DE } from "./lang-de.js";
import { RO } from "./lang-ro.js";
// Traducciones de TRANSFIERO Pro: español (es), inglés (en) y catalán (ca).
// Las claves con data-i18n se traducen al cambiar de idioma; los textos dinámicos usan say().
const DICT = {
  es: {
    "btn.settings": "Ajustes", "btn.help": "Instrucciones", "btn.back": "Volver",
    "btn.copy": "Copiar enlace", "btn.copied": "¡Copiado!", "btn.retry": "Reintentar",
    "btn.newqr": "Nuevo código QR", "btn.save": "Guardar", "btn.end": "Terminar sesión",
    "btn.match": "Coinciden", "btn.nomatch": "No coinciden", "btn.clear": "Borrar historial",

    "st.wait": "Esperando al móvil…", "st.verify": "Verifica el código",
    "st.channel": "Conectando el canal…", "st.connected": "Conectado",
    "st.ended": "Sesión terminada", "st.server": "Sin conexión con el servidor",
    "st.nophone": "Aún no hay conexión con el móvil", "st.connecting": "Conectando…",

    "msg.server": "No se puede contactar con el servidor de emparejamiento. Comprueba tu conexión a internet e inténtalo de nuevo.",
    "msg.lost": "Se ha perdido la conexión de emparejamiento. Pulsa Reintentar y vuelve a escanear.",
    "msg.failed": "No se pudo conectar. Asegúrate de que PC y móvil estén en la misma red Wi-Fi o con datos activos.",
    "msg.closed": "La conexión con el móvil se ha cerrado.",
    "msg.error": "Error al establecer la conexión. Inténtalo de nuevo.",
    "msg.cancel": "Cancelado: los códigos no coincidían. Vuelve a escanear el QR.",

    "pair.title": "1. Escanea el código con tu móvil",
    "pair.desc": "Abre la cámara de tu Android o iPhone y apunta al código QR.",
    "pair.linkhint": "Haz clic en este enlace en caso de que el código QR no funcione:",
    "pair.linktext": "Abrir enlace en el móvil",

    "verify.title": "2. Comprueba el código",
    "verify.desc": "Debe ser idéntico al que aparece en la pantalla de tu móvil.",

    "send.title": "Enviar al móvil", "send.drop": "Arrastra archivos aquí o", "send.choose": "elígelos",
    "send.idle": "Todavía no has enviado nada.", "send.progress": "Enviando {name} · {pct}%",
    "send.done": "Enviado: {n} archivo(s).", "send.error": "Error al enviar. Inténtalo de nuevo.",
    "recv.title": "Recibido del móvil", "recv.idle": "Esperando archivos…",
    "recv.progress": "Recibiendo {name} · {pct}%", "recv.got": "Recibido: {name}",
    "hist.title": "Historial", "hist.empty": "Aún no hay transferencias.",
    "hist.sent": "Enviado", "hist.recv": "Recibido",

    "ended.title": "Sesión terminada",

    "set.title": "Ajustes", "set.dark": "Modo noche", "set.dark.d": "Interfaz oscura, más cómoda de noche.",
    "set.prev": "Previsualización inteligente",
    "set.prev.d": "Miniaturas, medidas de imágenes y fragmentos de texto.",
    "set.hist": "Historial local",
    "set.hist.d": "Guarda solo nombres, tamaños y fechas, únicamente en este equipo.",
    "set.lang": "Idioma", "set.lang.auto": "Automático",

    "cat.image": "Imagen", "cat.video": "Vídeo", "cat.audio": "Audio", "cat.pdf": "Documento PDF",
    "cat.doc": "Documento de texto", "cat.sheet": "Hoja de cálculo", "cat.slide": "Presentación",
    "cat.zip": "Archivo comprimido", "cat.text": "Texto", "cat.other": "Archivo",

    "help.title": "Instrucciones de uso", "help.back": "← Volver a TRANSFIERO Pro",
    "help.intro_h": "¿Qué es TRANSFIERO Pro?",
    "help.intro": "<p>TRANSFIERO Pro envía fotos, vídeos, documentos y cualquier otro archivo entre tu ordenador y tu móvil, Android o iPhone. No necesitas cables ni instalar aplicaciones en el móvil: solo escanear un código QR.</p><p>Los archivos viajan directamente entre tus dispositivos y van cifrados. No se guardan en ningún servidor.</p>",
    "help.req_h": "Requisitos",
    "help.req": "<ul><li>Google Chrome o Microsoft Edge en Windows 11 (o en otro sistema con Chrome).</li><li>Un móvil Android (Chrome) o iPhone (Safari) con cámara.</li><li>PC y móvil conectados a la <strong>misma red Wi-Fi</strong>, o con datos móviles activos en el móvil.</li></ul>",
    "help.connect_h": "Conectar el móvil",
    "help.connect": "<ol><li>Pulsa el icono de TRANSFIERO en la barra de Chrome. Se abre el panel lateral y se queda abierto mientras trabajas.</li><li>Escanea el código QR con la cámara del móvil. Se abrirá una página en el navegador.</li><li>Si el QR no funciona, pulsa <strong>Abrir enlace en el móvil</strong> bajo el código.</li><li>Compara el código de 6 cifras: en el PC y en el móvil deben ser <strong>idénticos</strong>.</li><li>Si coinciden, pulsa <strong>Coinciden</strong> en ambos dispositivos. Si no, pulsa <strong>No coinciden</strong> y repite el proceso.</li></ol><p class=\"aviso\"><strong>Importante:</strong> mantén la pantalla del móvil encendida durante la transferencia.</p>",
    "help.send_h": "Enviar archivos del PC al móvil",
    "help.send": "<ol><li>Arrastra los archivos a la zona punteada, o pulsa <em>elígelos</em>.</li><li>Verás una vista previa de cada archivo y el progreso del envío.</li><li>En el móvil, pulsa <strong>Guardar</strong> para guardar el archivo en Fotos, Descargas o Archivos.</li></ol>",
    "help.recv_h": "Enviar archivos del móvil al PC",
    "help.recv": "<ol><li>En el móvil, pulsa <strong>Elegir fotos, vídeos o archivos</strong> y selecciona lo que quieras enviar.</li><li>En el PC, el archivo se descarga automáticamente a Descargas y aparece en la lista con su vista previa.</li><li>Si Chrome bloquea la descarga, pulsa <strong>Guardar</strong>. Si pregunta si permites varias descargas, responde que sí.</li></ol>",
    "help.prev_h": "Previsualización inteligente",
    "help.prev": "<p>Cada archivo muestra una vista previa adaptada a su tipo: miniatura de las imágenes con sus medidas, primeras líneas de los textos, reproductor de los vídeos y audios, y una etiqueta con el tipo de documento (PDF, hoja de cálculo, presentación…). Puedes desactivarla en Ajustes.</p>",
    "help.hist_h": "Historial local",
    "help.hist": "<p>Con el historial activado, el panel muestra los últimos archivos enviados y recibidos, con su fecha y tamaño. Solo se guardan los datos del listado, nunca el contenido de los archivos, y se queda en este equipo. Puedes borrarlo en Ajustes.</p>",
    "help.settings_h": "Ajustes",
    "help.settings": "<p>Pulsa el icono <strong>⚙</strong> en la parte superior para:</p><ul><li><strong>Modo noche:</strong> activa o desactiva la interfaz oscura.</li><li><strong>Previsualización inteligente:</strong> activa o desactiva las vistas previas.</li><li><strong>Historial local:</strong> activa o desactiva el registro de transferencias.</li><li><strong>Idioma:</strong> automático, español, inglés, catalán, francés, alemán o rumano.</li><li><strong>Carpeta de descargas:</strong> elige en qué carpeta de tu PC se guardan los archivos que recibes. Si no eliges ninguna, se usan las descargas normales de Chrome.</li></ul>",
    "help.tips_h": "Consejos",
    "help.tips": "<ul><li>Deja el panel lateral abierto mientras transfieres. Si lo cierras, la sesión termina y tendrás que escanear un nuevo código.</li><li>Puedes enviar varios archivos a la vez seleccionándolos juntos.</li><li>Para fotos de iPhone en formato HEIC, si la vista previa no se muestra, el archivo se transfiere igualmente.</li><li>Pulsa <strong>Terminar sesión</strong> al acabar. El código QR deja de funcionar.</li></ul>",
    "help.trouble_h": "Solución de problemas",
    "help.trouble": "<ul><li><strong>No conecta:</strong> comprueba que PC y móvil estén en la misma Wi-Fi o con datos activos. Prueba a desactivar la VPN.</li><li><strong>El QR no funciona:</strong> usa el enlace <strong>Abrir enlace en el móvil</strong>.</li><li><strong>El código QR caduca:</strong> pulsa <strong>Nuevo código QR</strong>.</li><li><strong>Los códigos no coinciden:</strong> cancela y vuelve a escanear.</li><li><strong>La transferencia se detiene:</strong> mantén la pantalla del móvil encendida y la página abierta.</li></ul>",
    "help.privacy_h": "Privacidad",
    "help.privacy": "<p>TRANSFIERO Pro no recopila datos personales ni usa analítica ni publicidad. Los archivos no pasan por ningún servidor de TRANSFIERO. El historial y los ajustes se guardan solo en este equipo. Consulta la política de privacidad completa en la ficha de la extensión.</p>",

    "m.title": "TRANSFIERO · Móvil", "m.wait_h": "Escanea el código",
    "m.wait": "Abre TRANSFIERO en tu PC y escanea el código QR con la cámara de tu móvil. Si ya lo escaneaste, espera unos segundos.",
    "m.bad_h": "No se puede conectar",
    "m.bad": "Este enlace no es válido. Vuelve a escanear el código QR desde tu PC.",
    "m.bad_status": "Enlace no válido",
    "m.verify_h": "Comprueba el código", "m.verify": "Debe ser idéntico al que aparece en la pantalla de tu PC.",
    "m.send_h": "Enviar al PC", "m.pick": "Elegir fotos, vídeos o archivos", "m.sendidle": "Todavía no has enviado nada.",
    "m.recv_h": "Recibido del PC", "m.keepon": "Mantén esta pantalla encendida y abierta mientras transfieres.",
    "m.nopc": "Sin conexión con el PC",
    "m.retry": "El código ha caducado o no hay conexión con el servidor. Vuelve a escanear el QR en el PC.",
    "m.connfail": "No se pudo conectar. Asegúrate de que el móvil y el PC estén en la misma Wi-Fi.",
    "m.closed": "La conexión con el PC se ha cerrado.",
    "m.error": "Error al establecer la conexión. Vuelve a escanear el QR.",
    "m.cancel": "Cancelado: los códigos no coincidían. Vuelve a escanear el QR en el PC.",
  },
  en: {
    "btn.settings": "Settings", "btn.help": "Instructions", "btn.back": "Back",
    "btn.copy": "Copy link", "btn.copied": "Copied!", "btn.retry": "Retry",
    "btn.newqr": "New QR code", "btn.save": "Save", "btn.end": "End session",
    "btn.match": "They match", "btn.nomatch": "They don't match", "btn.clear": "Clear history",

    "st.wait": "Waiting for your phone…", "st.verify": "Check the code",
    "st.channel": "Connecting channel…", "st.connected": "Connected",
    "st.ended": "Session ended", "st.server": "No connection to the server",
    "st.nophone": "No phone connected yet", "st.connecting": "Connecting…",

    "msg.server": "Can't reach the pairing server. Check your internet connection and try again.",
    "msg.lost": "The pairing connection was lost. Press Retry and scan again.",
    "msg.failed": "Couldn't connect. Make sure your PC and phone are on the same Wi-Fi or have mobile data on.",
    "msg.closed": "The connection with the phone was closed.",
    "msg.error": "Error while connecting. Please try again.",
    "msg.cancel": "Cancelled: the codes didn't match. Scan the QR code again.",

    "pair.title": "1. Scan the code with your phone",
    "pair.desc": "Open the camera on your Android or iPhone and point it at the QR code.",
    "pair.linkhint": "Click this link in case the QR code doesn't work:",
    "pair.linktext": "Open link on your phone",

    "verify.title": "2. Check the code",
    "verify.desc": "It must match the code shown on your phone.",

    "send.title": "Send to phone", "send.drop": "Drag files here or", "send.choose": "choose them",
    "send.idle": "You haven't sent anything yet.", "send.progress": "Sending {name} · {pct}%",
    "send.done": "Sent: {n} file(s).", "send.error": "Sending failed. Please try again.",
    "recv.title": "Received from phone", "recv.idle": "Waiting for files…",
    "recv.progress": "Receiving {name} · {pct}%", "recv.got": "Received: {name}",
    "hist.title": "History", "hist.empty": "No transfers yet.",
    "hist.sent": "Sent", "hist.recv": "Received",

    "ended.title": "Session ended",

    "set.title": "Settings", "set.dark": "Dark mode", "set.dark.d": "Dark interface, easier on the eyes at night.",
    "set.prev": "Smart preview",
    "set.prev.d": "Thumbnails, image sizes and text snippets.",
    "set.hist": "Local history",
    "set.hist.d": "Stores only names, sizes and dates, and only on this computer.",
    "set.lang": "Language", "set.lang.auto": "Automatic",

    "cat.image": "Image", "cat.video": "Video", "cat.audio": "Audio", "cat.pdf": "PDF document",
    "cat.doc": "Text document", "cat.sheet": "Spreadsheet", "cat.slide": "Presentation",
    "cat.zip": "Compressed archive", "cat.text": "Text", "cat.other": "File",

    "help.title": "User guide", "help.back": "← Back to TRANSFIERO Pro",
    "help.intro_h": "What is TRANSFIERO Pro?",
    "help.intro": "<p>TRANSFIERO Pro sends photos, videos, documents and any other file between your computer and your phone, Android or iPhone. You don't need cables or to install apps on your phone: just scan a QR code.</p><p>Files travel directly between your devices and are encrypted. They are never stored on any server.</p>",
    "help.req_h": "Requirements",
    "help.req": "<ul><li>Google Chrome or Microsoft Edge on Windows 11 (or any system running Chrome).</li><li>An Android phone (Chrome) or an iPhone (Safari) with a camera.</li><li>Your PC and phone on the <strong>same Wi-Fi network</strong>, or with mobile data on in the phone.</li></ul>",
    "help.connect_h": "Connect your phone",
    "help.connect": "<ol><li>Click the TRANSFIERO icon in the Chrome toolbar. The side panel opens and stays open while you work.</li><li>Scan the QR code with your phone's camera. A page will open in the phone's browser.</li><li>If the QR code doesn't work, tap <strong>Open link on your phone</strong> below the code.</li><li>Compare the 6-digit code: it must be <strong>identical</strong> on the PC and on the phone.</li><li>If they match, press <strong>They match</strong> on both devices. If not, press <strong>They don't match</strong> and try again.</li></ol><p class=\"aviso\"><strong>Important:</strong> keep your phone's screen on during the transfer.</p>",
    "help.send_h": "Send files from the PC to the phone",
    "help.send": "<ol><li>Drag the files into the dashed area, or press <em>choose them</em>.</li><li>You will see a preview of each file and the transfer progress.</li><li>On the phone, press <strong>Save</strong> to store the file in Photos, Downloads or Files.</li></ol>",
    "help.recv_h": "Send files from the phone to the PC",
    "help.recv": "<ol><li>On the phone, press <strong>Choose photos, videos or files</strong> and select what you want to send.</li><li>On the PC, the file is downloaded automatically to Downloads and appears in the list with its preview.</li><li>If Chrome blocks the download, press <strong>Save</strong>. If it asks whether to allow multiple downloads, say yes.</li></ol>",
    "help.prev_h": "Smart preview",
    "help.prev": "<p>Each file shows a preview suited to its type: thumbnails of images with their sizes, the first lines of text files, a player for videos and audio, and a label with the document type (PDF, spreadsheet, presentation…). You can turn it off in Settings.</p>",
    "help.hist_h": "Local history",
    "help.hist": "<p>With history on, the panel shows the latest sent and received files, with date and size. Only the list details are saved, never the content of the files, and they stay on this computer. You can clear them in Settings.</p>",
    "help.settings_h": "Settings",
    "help.settings": "<p>Press the <strong>⚙</strong> icon at the top to:</p><ul><li><strong>Dark mode:</strong> turn the dark interface on or off.</li><li><strong>Smart preview:</strong> turn previews on or off.</li><li><strong>Local history:</strong> turn transfer recording on or off.</li><li><strong>Language:</strong> automatic, Spanish, English, Catalan, French, German or Romanian.</li><li><strong>Download folder:</strong> choose the folder on your PC where received files are saved. If you don't choose one, Chrome's normal downloads are used.</li></ul>",
    "help.tips_h": "Tips",
    "help.tips": "<ul><li>Keep the side panel open while you transfer. If you close it, the session ends and you will need to scan a new code.</li><li>You can send several files at once by selecting them together.</li><li>For iPhone HEIC photos, if the preview doesn't show, the file is still transferred.</li><li>Press <strong>End session</strong> when you finish. The QR code stops working.</li></ul>",
    "help.trouble_h": "Troubleshooting",
    "help.trouble": "<ul><li><strong>It won't connect:</strong> check that the PC and phone are on the same Wi-Fi or have mobile data on. Try turning off any VPN.</li><li><strong>The QR code doesn't work:</strong> use the <strong>Open link on your phone</strong> link.</li><li><strong>The QR code expires:</strong> press <strong>New QR code</strong>.</li><li><strong>The codes don't match:</strong> cancel and scan again.</li><li><strong>The transfer stops:</strong> keep the phone's screen on and the page open.</li></ul>",
    "help.privacy_h": "Privacy",
    "help.privacy": "<p>TRANSFIERO Pro doesn't collect personal data and uses no analytics or advertising. Files never pass through any TRANSFIERO server. History and settings are stored only on this computer. Read the full privacy policy on the extension's store page.</p>",

    "m.title": "TRANSFIERO · Phone", "m.wait_h": "Scan the code",
    "m.wait": "Open TRANSFIERO on your computer and scan the QR code with your phone's camera. If you already scanned it, wait a few seconds.",
    "m.bad_h": "Can't connect",
    "m.bad": "This link is not valid. Scan the QR code from your computer again.",
    "m.bad_status": "Invalid link",
    "m.verify_h": "Check the code", "m.verify": "It must match the code shown on your computer screen.",
    "m.send_h": "Send to computer", "m.pick": "Choose photos, videos or files", "m.sendidle": "You haven't sent anything yet.",
    "m.recv_h": "Received from computer", "m.keepon": "Keep this screen on and open during the transfer.",
    "m.nopc": "No connection to the computer",
    "m.retry": "The code has expired or there is no connection to the server. Scan the QR code on your computer again.",
    "m.connfail": "Couldn't connect. Make sure your phone and computer are on the same Wi-Fi.",
    "m.closed": "The connection with the computer was closed.",
    "m.error": "Error while connecting. Scan the QR code again.",
    "m.cancel": "Cancelled: the codes didn't match. Scan the QR code on the computer again.",
  },
  ca: {
    "btn.settings": "Configuració", "btn.help": "Instruccions", "btn.back": "Tornar",
    "btn.copy": "Copia l'enllaç", "btn.copied": "Copiat!", "btn.retry": "Reintenta",
    "btn.newqr": "Nou codi QR", "btn.save": "Desa", "btn.end": "Acaba la sessió",
    "btn.match": "Coincideixen", "btn.nomatch": "No coincideixen", "btn.clear": "Esborra l'historial",

    "st.wait": "Esperant el mòbil…", "st.verify": "Verifica el codi",
    "st.channel": "Connectant el canal…", "st.connected": "Connectat",
    "st.ended": "Sessió acabada", "st.server": "Sense connexió amb el servidor",
    "st.nophone": "Encara no hi ha connexió amb el mòbil", "st.connecting": "Connectant…",

    "msg.server": "No es pot contactar amb el servidor d'aparellament. Comprova la connexió a internet i torna-ho a provar.",
    "msg.lost": "S'ha perdut la connexió d'aparellament. Prem Reintenta i torna a escanejar.",
    "msg.failed": "No s'ha pogut connectar. Assegura't que el PC i el mòbil estiguin a la mateixa Wi-Fi o amb dades activades.",
    "msg.closed": "S'ha tancat la connexió amb el mòbil.",
    "msg.error": "Error en establir la connexió. Torna-ho a provar.",
    "msg.cancel": "Cancel·lat: els codis no coincidien. Torna a escanejar el QR.",

    "pair.title": "1. Escaneja el codi amb el mòbil",
    "pair.desc": "Obre la càmera del teu Android o iPhone i apunta al codi QR.",
    "pair.linkhint": "Fes clic en aquest enllaç en cas que el codi QR no funcioni:",
    "pair.linktext": "Obre l'enllaç al mòbil",

    "verify.title": "2. Comprova el codi",
    "verify.desc": "Ha de ser idèntic al que apareix a la pantalla del mòbil.",

    "send.title": "Envia al mòbil", "send.drop": "Arrossega fitxers aquí o", "send.choose": "tria'ls",
    "send.idle": "Encara no has enviat res.", "send.progress": "Enviant {name} · {pct}%",
    "send.done": "Enviat: {n} fitxer(s).", "send.error": "Error en enviar. Torna-ho a provar.",
    "recv.title": "Rebut del mòbil", "recv.idle": "Esperant fitxers…",
    "recv.progress": "Rebent {name} · {pct}%", "recv.got": "Rebut: {name}",
    "hist.title": "Historial", "hist.empty": "Encara no hi ha transferències.",
    "hist.sent": "Enviat", "hist.recv": "Rebut",

    "ended.title": "Sessió acabada",

    "set.title": "Configuració", "set.dark": "Mode nit", "set.dark.d": "Interfície fosca, més còmoda de nit.",
    "set.prev": "Previsualització intel·ligent",
    "set.prev.d": "Miniatures, mides d'imatges i fragments de text.",
    "set.hist": "Historial local",
    "set.hist.d": "Guarda només noms, mides i dates, només en aquest equip.",
    "set.lang": "Idioma", "set.lang.auto": "Automàtic",

    "cat.image": "Imatge", "cat.video": "Vídeo", "cat.audio": "Àudio", "cat.pdf": "Document PDF",
    "cat.doc": "Document de text", "cat.sheet": "Full de càlcul", "cat.slide": "Presentació",
    "cat.zip": "Fitxer comprimit", "cat.text": "Text", "cat.other": "Fitxer",

    "help.title": "Instruccions d'ús", "help.back": "← Tornar a TRANSFIERO Pro",
    "help.intro_h": "Què és TRANSFIERO Pro?",
    "help.intro": "<p>TRANSFIERO Pro envia fotos, vídeos, documents i qualsevol altre fitxer entre el teu ordinador i el mòbil, Android o iPhone. No necessites cables ni instal·lar aplicacions al mòbil: només escanejar un codi QR.</p><p>Els fitxers viatgen directament entre els teus dispositius i van xifrats. No es guarden en cap servidor.</p>",
    "help.req_h": "Requisits",
    "help.req": "<ul><li>Google Chrome o Microsoft Edge a Windows 11 (o en un altre sistema amb Chrome).</li><li>Un mòbil Android (Chrome) o iPhone (Safari) amb càmera.</li><li>PC i mòbil connectats a la <strong>mateixa xarxa Wi-Fi</strong>, o amb dades mòbils activades al mòbil.</li></ul>",
    "help.connect_h": "Connectar el mòbil",
    "help.connect": "<ol><li>Fes clic a la icona de TRANSFIERO a la barra de Chrome. S'obre el panell lateral i es queda obert mentre treballes.</li><li>Escaneja el codi QR amb la càmera del mòbil. S'obrirà una pàgina al navegador del mòbil.</li><li>Si el QR no funciona, prem <strong>Obre l'enllaç al mòbil</strong> sota el codi.</li><li>Compara el codi de 6 xifres: al PC i al mòbil han de ser <strong>idèntics</strong>.</li><li>Si coincideixen, prem <strong>Coincideixen</strong> als dos dispositius. Si no, prem <strong>No coincideixen</strong> i repeteix el procés.</li></ol><p class=\"aviso\"><strong>Important:</strong> mantén la pantalla del mòbil encesa durant la transferència.</p>",
    "help.send_h": "Enviar fitxers del PC al mòbil",
    "help.send": "<ol><li>Arrossega els fitxers a la zona puntejada, o prem <em>tria'ls</em>.</li><li>Veuràs una previsualització de cada fitxer i el progrés de l'enviament.</li><li>Al mòbil, prem <strong>Desa</strong> per guardar el fitxer a Fotos, Descàrregues o Fitxers.</li></ol>",
    "help.recv_h": "Enviar fitxers del mòbil al PC",
    "help.recv": "<ol><li>Al mòbil, prem <strong>Tria fotos, vídeos o fitxers</strong> i selecciona el que vulguis enviar.</li><li>Al PC, el fitxer es descarrega automàticament a Descàrregues i apareix a la llista amb la seva previsualització.</li><li>Si Chrome bloqueja la descàrrega, prem <strong>Desa</strong>. Si pregunta si permets diverses descàrregues, digues que sí.</li></ol>",
    "help.prev_h": "Previsualització intel·ligent",
    "help.prev": "<p>Cada fitxer mostra una previsualització adaptada al seu tipus: miniatura de les imatges amb les seves mides, les primeres línies dels textos, un reproductor per als vídeos i àudios, i una etiqueta amb el tipus de document (PDF, full de càlcul, presentació…). Pots desactivar-la a Configuració.</p>",
    "help.hist_h": "Historial local",
    "help.hist": "<p>Amb l'historial activat, el panell mostra els últims fitxers enviats i rebuts, amb la data i la mida. Només es guarden les dades de la llista, mai el contingut dels fitxers, i es queden en aquest equip. Pots esborrar-lo a Configuració.</p>",
    "help.settings_h": "Configuració",
    "help.settings": "<p>Prem la icona <strong>⚙</strong> de la part superior per:</p><ul><li><strong>Mode nit:</strong> activar o desactivar la interfície fosca.</li><li><strong>Previsualització intel·ligent:</strong> activar o desactivar les previsualitzacions.</li><li><strong>Historial local:</strong> activar o desactivar el registre de transferències.</li><li><strong>Idioma:</strong> automàtic, espanyol, anglès, català, francès, alemany o romanès.</li><li><strong>Carpeta de descàrregues:</strong> tria en quina carpeta del PC es desen els fitxers que reps. Si no en tries cap, s'usen les descàrregues normals de Chrome.</li></ul>",
    "help.tips_h": "Consells",
    "help.tips": "<ul><li>Deixa el panell lateral obert mentre transfereixes. Si el tanques, la sessió acaba i hauràs d'escanejar un codi nou.</li><li>Pots enviar diversos fitxers alhora seleccionant-los junts.</li><li>Per a les fotos HEIC de l'iPhone, si la previsualització no es mostra, el fitxer es transfereix igualment.</li><li>Prem <strong>Acaba la sessió</strong> en acabar. El codi QR deixa de funcionar.</li></ul>",
    "help.trouble_h": "Resolució de problemes",
    "help.trouble": "<ul><li><strong>No connecta:</strong> comprova que el PC i el mòbil estiguin a la mateixa Wi-Fi o amb dades activades. Prova de desactivar la VPN.</li><li><strong>El QR no funciona:</strong> fes servir l'enllaç <strong>Obre l'enllaç al mòbil</strong>.</li><li><strong>El codi QR caduca:</strong> prem <strong>Nou codi QR</strong>.</li><li><strong>Els codis no coincideixen:</strong> cancel·la i torna a escanejar.</li><li><strong>La transferència s'atura:</strong> mantén la pantalla del mòbil encesa i la pàgina oberta.</li></ul>",
    "help.privacy_h": "Privadesa",
    "help.privacy": "<p>TRANSFIERO Pro no recull dades personals i no utilitza analítica ni publicitat. Els fitxers no passen per cap servidor de TRANSFIERO. L'historial i la configuració només es guarden en aquest equip. Consulta la política de privadesa completa a la fitxa de l'extensió.</p>",

    "m.title": "TRANSFIERO · Mòbil", "m.wait_h": "Escaneja el codi",
    "m.wait": "Obre TRANSFIERO al teu PC i escaneja el codi QR amb la càmera del mòbil. Si ja l'has escanejat, espera uns segons.",
    "m.bad_h": "No es pot connectar",
    "m.bad": "Aquest enllaç no és vàlid. Torna a escanejar el codi QR des del PC.",
    "m.bad_status": "Enllaç no vàlid",
    "m.verify_h": "Comprova el codi", "m.verify": "Ha de ser idèntic al que apareix a la pantalla del PC.",
    "m.send_h": "Envia al PC", "m.pick": "Tria fotos, vídeos o fitxers", "m.sendidle": "Encara no has enviat res.",
    "m.recv_h": "Rebut del PC", "m.keepon": "Mantén aquesta pantalla encesa i oberta durant la transferència.",
    "m.nopc": "Sense connexió amb el PC",
    "m.retry": "El codi ha caducat o no hi ha connexió amb el servidor. Torna a escanejar el QR al PC.",
    "m.connfail": "No s'ha pogut connectar. Assegura't que el mòbil i el PC estiguin a la mateixa Wi-Fi.",
    "m.closed": "S'ha tancat la connexió amb el PC.",
    "m.error": "Error en establir la connexió. Torna a escanejar el QR.",
    "m.cancel": "Cancel·lat: els codis no coincidien. Torna a escanejar el QR al PC.",
  },
};


// Carpeta de descargas (versión 1.1)
const FOLDER_KEYS = {
  es: {
    "set.folder": "Carpeta de descargas",
    "set.folder.d": "Elige dónde guardar los archivos que recibes.",
    "folder.default": "Descargas del navegador",
    "folder.current": "Carpeta: {name}",
    "btn.folder.choose": "Elegir carpeta",
    "btn.folder.reset": "Usar descargas normales",
    "btn.folder.reauth": "Reactivar carpeta",
    "folder.saved": "Guardado en {folder}",
    "folder.noperm": "Permiso caducado: pulsa Reactivar carpeta en Ajustes.",
    "folder.unsupported": "Tu navegador no permite elegir carpeta; se usan las descargas normales.",
    "folder.error": "No se pudo guardar en la carpeta. Se descarga de la forma normal.",
  },
  en: {
    "set.folder": "Download folder",
    "set.folder.d": "Choose where to save the files you receive.",
    "folder.default": "Browser downloads",
    "folder.current": "Folder: {name}",
    "btn.folder.choose": "Choose folder",
    "btn.folder.reset": "Use normal downloads",
    "btn.folder.reauth": "Re-enable folder",
    "folder.saved": "Saved to {folder}",
    "folder.noperm": "Permission expired: press Re-enable folder in Settings.",
    "folder.unsupported": "Your browser can't choose folders; normal downloads are used.",
    "folder.error": "Couldn't save to the folder. Downloading normally instead.",
  },
  ca: {
    "set.folder": "Carpeta de descàrregues",
    "set.folder.d": "Tria on desar els fitxers que reps.",
    "folder.default": "Descàrregues del navegador",
    "folder.current": "Carpeta: {name}",
    "btn.folder.choose": "Tria la carpeta",
    "btn.folder.reset": "Usa les descàrregues normals",
    "btn.folder.reauth": "Reactiva la carpeta",
    "folder.saved": "Desat a {folder}",
    "folder.noperm": "Permís caducat: prem Reactiva la carpeta a Configuració.",
    "folder.unsupported": "El navegador no permet triar carpeta; s'usen les descàrregues normals.",
    "folder.error": "No s'ha pogut desar a la carpeta. Es descarrega de la manera normal.",
  },
};
for (const l of ["es", "en", "ca"]) Object.assign(DICT[l], FOLDER_KEYS[l]);


// Cierre de sesión, contacto y mensajes (versión 1.2)
const V12_KEYS = {
  es: {
    "btn.logout": "Cerrar sesión",
    "btn.logout_confirm": "¿Seguro? Pulsa para cerrar",
    "msg.user_closed": "Has cerrado la sesión. Para volver a conectar, genera un nuevo código QR.",
    "contact.title": "Contacto y sugerencias",
    "contact.desc": "¿Tienes dudas o una idea para mejorar TRANSFIERO? Escribe a Jorge y te responderé lo antes posible.",
    "contact.btn": "Enviar un correo",
    "help.contact_h": "Contacto y sugerencias",
    "help.contact": "<p>¿Necesitas ayuda o tienes una sugerencia? Escríbeme a <a href=\"mailto:noticiasbuenas2024@gmail.com?subject=TRANSFIERO%20Pro%20-%20Contacto\">noticiasbuenas2024@gmail.com</a> (Jorge). Respondo a todos los mensajes lo antes posible.</p>",
  },
  en: {
    "btn.logout": "Close session",
    "btn.logout_confirm": "Sure? Press to close",
    "msg.user_closed": "You closed the session. To connect again, generate a new QR code.",
    "contact.title": "Contact and suggestions",
    "contact.desc": "Questions or an idea to improve TRANSFIERO? Write to Jorge and I'll get back to you as soon as possible.",
    "contact.btn": "Send an email",
    "help.contact_h": "Contact and suggestions",
    "help.contact": "<p>Need help or have a suggestion? Write to me at <a href=\"mailto:noticiasbuenas2024@gmail.com?subject=TRANSFIERO%20Pro%20-%20Contact\">noticiasbuenas2024@gmail.com</a> (Jorge). I reply to every message as soon as possible.</p>",
  },
  ca: {
    "btn.logout": "Tanca la sessió",
    "btn.logout_confirm": "Segur? Prem per tancar",
    "msg.user_closed": "Has tancat la sessió. Per tornar a connectar, genera un codi QR nou.",
    "contact.title": "Contacte i suggeriments",
    "contact.desc": "Tens dubtes o una idea per millorar TRANSFIERO? Escriu a Jorge i et contestaré com més aviat millor.",
    "contact.btn": "Envia un correu",
    "help.contact_h": "Contacte i suggeriments",
    "help.contact": "<p>Necessites ajuda o tens un suggeriment? Escriu-me a <a href=\"mailto:noticiasbuenas2024@gmail.com?subject=TRANSFIERO%20Pro%20-%20Contacte\">noticiasbuenas2024@gmail.com</a> (Jorge). Contesto tots els missatges com més aviat millor.</p>",
  },
};
for (const l of ["es", "en", "ca"]) Object.assign(DICT[l], V12_KEYS[l]);


// Mensaje del móvil al cerrar sesión (versión 1.2)
const PHONE_V12 = {
  es: { "m.user_closed": "Has cerrado la sesión. Para volver a conectar, escanea un nuevo código QR en el PC." },
  en: { "m.user_closed": "You closed the session. To connect again, scan a new QR code on the computer." },
  ca: { "m.user_closed": "Has tancat la sessió. Per tornar a connectar, escaneja un codi QR nou al PC." },
};
for (const l of ["es", "en", "ca"]) Object.assign(DICT[l], PHONE_V12[l]);


// Envío de carpetas (versión 1.3)
const V13_KEYS = {
  es: {
    "send.drop": "Arrastra archivos o carpetas aquí o",
    "send.folder": "Enviar carpeta",
    "send.folder.zipping": "Comprimiendo {name} · {n} archivos…",
    "send.folder.big": "Carpeta grande: la compresión puede tardar y usar mucha memoria.",
    "send.folder.empty": "La carpeta no contiene archivos.",
    "cat.folder": "Carpeta · {n} archivos",
    "help.send": "<ol><li>Arrastra los archivos a la zona punteada, o pulsa <em>elígelos</em>.</li><li>Para enviar una carpeta entera, pulsa <strong>Enviar carpeta</strong>: llega como un único archivo ZIP que conserva toda su estructura.</li><li>Verás una vista previa de cada archivo y el progreso del envío.</li><li>En el móvil, pulsa <strong>Guardar</strong> para guardar el archivo en Fotos, Descargas o Archivos.</li></ol>",
  },
  en: {
    "send.drop": "Drag files or folders here or",
    "send.folder": "Send folder",
    "send.folder.zipping": "Compressing {name} · {n} files…",
    "send.folder.big": "Large folder: compression may take a while and use a lot of memory.",
    "send.folder.empty": "The folder contains no files.",
    "cat.folder": "Folder · {n} files",
    "help.send": "<ol><li>Drag the files into the dashed area, or press <em>choose them</em>.</li><li>To send a whole folder, press <strong>Send folder</strong>: it arrives as a single ZIP file that keeps its full structure.</li><li>You will see a preview of each file and the transfer progress.</li><li>On the phone, press <strong>Save</strong> to store the file in Photos, Downloads or Files.</li></ol>",
  },
  ca: {
    "send.drop": "Arrossega fitxers o carpetes aquí o",
    "send.folder": "Envia una carpeta",
    "send.folder.zipping": "Comprimint {name} · {n} fitxers…",
    "send.folder.big": "Carpeta gran: la compressió pot trigar i usar molta memòria.",
    "send.folder.empty": "La carpeta no conté fitxers.",
    "cat.folder": "Carpeta · {n} fitxers",
    "help.send": "<ol><li>Arrossega els fitxers a la zona puntejada, o prem <em>tria'ls</em>.</li><li>Per enviar una carpeta sencera, prem <strong>Envia una carpeta</strong>: arriba com un únic fitxer ZIP que conserva tota l'estructura.</li><li>Veuràs una previsualització de cada fitxer i el progrés de l'enviament.</li><li>Al mòbil, prem <strong>Desa</strong> per guardar el fitxer a Fotos, Descàrregues o Fitxers.</li></ol>",
  },
};
for (const l of ["es", "en", "ca"]) Object.assign(DICT[l], V13_KEYS[l]);

// Idiomas nuevos: francés, alemán y rumano
DICT.fr = FR;
DICT.de = DE;
DICT.ro = RO;


// Botón Inicio (versión 1.3.1)
const V131_KEYS = {
  es: { "btn.home": "Inicio" },
  en: { "btn.home": "Home" },
  ca: { "btn.home": "Inici" },
};
for (const l of ["es", "en", "ca"]) Object.assign(DICT[l], V131_KEYS[l]);


// Permiso de carpeta pendiente (versión 1.3.3)
const V133_KEYS = {
  es: {
    "folder.banner": "Carpeta de descargas: {name}. Pulsa para permitir que TRANSFIERO guarde ahí los archivos recibidos.",
    "btn.folder.savein": "Guardar en {folder}",
  },
  en: {
    "folder.banner": "Download folder: {name}. Press to allow TRANSFIERO to save received files there.",
    "btn.folder.savein": "Save to {folder}",
  },
  ca: {
    "folder.banner": "Carpeta de descàrregues: {name}. Prem per permetre que TRANSFIERO hi desi els fitxers rebuts.",
    "btn.folder.savein": "Desa a {folder}",
  },
};
for (const l of ["es", "en", "ca"]) Object.assign(DICT[l], V133_KEYS[l]);


// Selector de carpeta en pestaña propia (versión 1.3.5)
const V135_KEYS = {
  es: {
    "pick.title": "Elegir carpeta de descargas",
    "pick.desc": "Elige la carpeta de tu PC donde se guardarán los archivos que recibas desde el móvil.",
    "pick.btn": "Seleccionar carpeta",
    "pick.ok": "Carpeta guardada: {name}. Ya puedes cerrar esta pestaña y volver a TRANSFIERO Pro.",
    "pick.cancel": "No se ha elegido ninguna carpeta.",
    "pick.error": "No se pudo elegir la carpeta: {error}",
  },
  en: {
    "pick.title": "Choose download folder",
    "pick.desc": "Choose the folder on your PC where files received from your phone will be saved.",
    "pick.btn": "Select folder",
    "pick.ok": "Folder saved: {name}. You can close this tab and go back to TRANSFIERO Pro.",
    "pick.cancel": "No folder was chosen.",
    "pick.error": "Couldn't choose the folder: {error}",
  },
  ca: {
    "pick.title": "Tria la carpeta de descàrregues",
    "pick.desc": "Tria la carpeta del PC on es desaran els fitxers que rebis del mòbil.",
    "pick.btn": "Selecciona la carpeta",
    "pick.ok": "Carpeta desada: {name}. Ja pots tancar aquesta pestanya i tornar a TRANSFIERO Pro.",
    "pick.cancel": "No s'ha triat cap carpeta.",
    "pick.error": "No s'ha pogut triar la carpeta: {error}",
  },
};
for (const l of ["es", "en", "ca"]) Object.assign(DICT[l], V135_KEYS[l]);

export const LANGS = ["es", "en", "ca", "fr", "de", "ro"];
let current = "es";

// Elige el idioma: el de los ajustes si es válido; si no, el del navegador (ca/es/en); si no, inglés.
export function resolveLang(pref) {
  if (LANGS.includes(pref)) return pref;
  const nav = (navigator.language || "en").slice(0, 2).toLowerCase();
  return LANGS.includes(nav) ? nav : "en";
}

export function setLang(lang) {
  current = LANGS.includes(lang) ? lang : "es";
  document.documentElement.lang = current;
}

export function getLang() {
  return current;
}

export function t(key, vars = {}) {
  let text = DICT[current]?.[key] ?? DICT.es[key] ?? key;
  for (const [k, v] of Object.entries(vars)) text = text.replaceAll(`{${k}}`, String(v));
  return text;
}

// Escribe un texto traducible en un elemento; queda registrado para retraducirlo al cambiar de idioma.
export function say(el, key, vars = {}) {
  el.dataset.i18n = key;
  if (Object.keys(vars).length) el.dataset.vars = JSON.stringify(vars);
  else delete el.dataset.vars;
  el.textContent = t(key, vars);
}

// Retraduce todos los elementos marcados en la página.
export function applyI18n(root = document) {
  root.querySelectorAll("[data-i18n]").forEach((el) => {
    const vars = el.dataset.vars ? JSON.parse(el.dataset.vars) : {};
    el.textContent = t(el.dataset.i18n, vars);
  });
  root.querySelectorAll("[data-i18n-html]").forEach((el) => {
    el.innerHTML = t(el.dataset.i18nHtml); // solo contenido propio de este diccionario
  });
  root.querySelectorAll("[data-i18n-attr]").forEach((el) => {
    for (const pair of el.dataset.i18nAttr.split(";")) {
      const [attr, key] = pair.split(":");
      if (attr && key) el.setAttribute(attr.trim(), t(key.trim()));
    }
  });
}

export const __DICT = DICT;
