// Página de ayuda: idioma y modo noche según los ajustes guardados.
import { applyI18n, setLang, resolveLang } from "./shared/i18n.js";
import { getSettings } from "./shared/store.js";

const cfg = await getSettings();
setLang(resolveLang(cfg.lang));
document.documentElement.dataset.theme = cfg.dark ? "dark" : "light";
applyI18n();
