// Selector de carpeta en una pestaña propia de la extensión. Guarda la carpeta en la misma base de datos
// que usa el panel lateral (shared/folder.js), así el panel la encuentra al volver.
import { folderSupported, chooseFolder } from "./shared/folder.js";
import { say, setLang, resolveLang, applyI18n } from "./shared/i18n.js";
import { getSettings } from "./shared/store.js";

const cfg = await getSettings();
setLang(resolveLang(cfg.lang));
document.documentElement.dataset.theme = cfg.dark ? "dark" : "light";
applyI18n();

const msg = document.getElementById("msg");

document.getElementById("btnPick").addEventListener("click", async () => {
  if (!folderSupported()) {
    say(msg, "folder.unsupported");
    return;
  }
  try {
    const handle = await chooseFolder();
    say(msg, "pick.ok", { name: handle.name });
  } catch (err) {
    if (err.name === "AbortError") say(msg, "pick.cancel");
    else say(msg, "pick.error", { error: err.message });
  }
});
