// Pestaña de elección de la carpeta de descarga.
// El selector nativo de carpetas (showDirectoryPicker) no es fiable en el panel
// lateral de una extensión: aunque el usuario elige una carpeta, Chrome devuelve
// "AbortError" como si se hubiera cancelado (bug crbug.com/40240444). En una
// pestaña normal de la extensión sí funciona, así que el panel abre esta página:
// aquí se elige la carpeta, el handle queda guardado en IndexedDB (mismo origen
// que el panel) y se avisa al panel por BroadcastChannel para que se actualice.
import { getSettings, saveSettings } from "./shared/store.js";
import { setLang, resolveLang, applyI18n, t } from "./shared/i18n.js";
import { pickDownloadFolder, DL_CHANNEL } from "./shared/fsdir.js";

const $ = (id) => document.getElementById(id);

function message(key, vars, kind = "ok") {
  const el = $("sfMsg");
  el.textContent = t(key, vars || {});
  el.className = `hint ${kind}`;
  el.hidden = false;
}

// Cierra esta pestaña un momento después de terminar. chrome.tabs no añade
// permisos al manifest; si no está disponible, el mensaje ya indica que se puede cerrar.
function closeTabLater() {
  setTimeout(() => {
    try {
      if (typeof chrome !== "undefined" && chrome.tabs?.getCurrent) {
        chrome.tabs.getCurrent((tab) => { if (tab?.id != null) chrome.tabs.remove(tab.id); });
      }
    } catch { /* la pestaña ya se cerró a mano */ }
  }, 1500);
}

async function choose() {
  if (typeof window.showDirectoryPicker !== "function") {
    message("sf.err", null, "err");
    return;
  }
  $("btnPick").disabled = true;
  try {
    // Selector nativo de carpetas: guarda el handle en IndexedDB y deja el
    // permiso concedido (y persistente si Chrome lo permite).
    const handle = await pickDownloadFolder();
    // Nombre visible en los ajustes, compartido con el panel (mismo origen).
    await saveSettings({ dlFolder: handle.name });
    // Aviso al panel lateral para que refresque sus ajustes al instante.
    try { new BroadcastChannel(DL_CHANNEL).postMessage({ type: "folder-picked", name: handle.name }); } catch { /* sin canal */ }
    message("sf.ok", { name: handle.name });
    closeTabLater();
  } catch (err) {
    if (err?.name === "AbortError") {
      // Se cerró el selector sin elegir carpeta: se puede volver a intentar.
      message("sf.cancel", null, "err");
    } else {
      console.error(err);
      message("sf.fail", null, "err");
    }
  } finally {
    $("btnPick").disabled = false;
  }
}

$("btnPick").onclick = choose;

// Idioma y modo noche según los ajustes, como en el resto de páginas.
const cfg = await getSettings();
document.documentElement.dataset.theme = cfg.dark ? "dark" : "light";
setLang(resolveLang(cfg.lang));
applyI18n();
document.title = "TRANSFIERO Pro";
