// Ajustes e historial local. En la extensión usa chrome.storage.local; en una página normal, localStorage.
const DEFAULTS = { dark: false, previews: true, history: true, lang: "auto" };
const HISTORY_MAX = 100;
const hasChrome = typeof chrome !== "undefined" && !!chrome.storage?.local;

function read(keys) {
  if (hasChrome) return new Promise((resolve) => chrome.storage.local.get(keys, resolve));
  const out = {};
  for (const k of keys) {
    try { out[k] = JSON.parse(localStorage.getItem(k)); } catch { out[k] = undefined; }
  }
  return Promise.resolve(out);
}

function write(obj) {
  if (hasChrome) return new Promise((resolve) => chrome.storage.local.set(obj, resolve));
  for (const [k, v] of Object.entries(obj)) localStorage.setItem(k, JSON.stringify(v));
  return Promise.resolve();
}

export async function getSettings() {
  const { settings } = await read(["settings"]);
  return { ...DEFAULTS, ...(settings || {}) };
}

export async function saveSettings(patch) {
  const next = { ...(await getSettings()), ...patch };
  await write({ settings: next });
  return next;
}

export async function getHistory() {
  const { history } = await read(["history"]);
  return Array.isArray(history) ? history : [];
}

// Solo metadatos: nombre, tamaño, tipo, sentido y fecha. Nunca el contenido del archivo.
export async function addHistory({ dir, name, size, type }) {
  const list = await getHistory();
  list.unshift({ id: crypto.randomUUID(), dir, name, size, type, at: Date.now() });
  await write({ history: list.slice(0, HISTORY_MAX) });
}

export async function clearHistory() {
  await write({ history: [] });
}
