// Ajustes, historial y dispositivos recordados.
// En la extensión usa chrome.storage.local; en una página normal, localStorage.
const DEFAULTS = { dark: false, previews: true, history: true, lang: "auto", dlmode: 0 };
const HISTORY_MAX = 100;
const DEVICES_MAX = 5;
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

// Solo metadatos: nombre, tamaño, tipo, sentido y fecha (y, si procede, si fue un
// texto y el identificador de descarga para poder mostrar la carpeta). Nunca el
// contenido de los archivos.
export async function addHistory(entry) {
  const list = await getHistory();
  list.unshift({
    id: crypto.randomUUID(),
    dir: entry.dir,
    name: entry.name,
    size: entry.size ?? 0,
    type: entry.type ?? "",
    kind: entry.kind ?? null,
    text: entry.text ?? null,
    dlId: entry.dlId ?? null,
    at: Date.now(),
  });
  await write({ history: list.slice(0, HISTORY_MAX) });
}

export async function clearHistory() {
  await write({ history: [] });
}

// Dispositivos recordados: { id, name, secret, at }. El secreto nunca pasa por
// el servidor; la lista se guarda solo en este equipo (o en el navegador del móvil).
export async function getDevices() {
  const { devices } = await read(["devices"]);
  return Array.isArray(devices) ? devices.filter((d) => d && d.id && d.secret) : [];
}

export async function saveDevice({ id, name, secret, at }) {
  const list = await getDevices();
  const i = list.findIndex((d) => d.id === id);
  if (i >= 0) list.splice(i, 1);
  list.unshift({ id, name: name || "Móvil", secret, at: at || Date.now() });
  await write({ devices: list.slice(0, DEVICES_MAX) });
  return list;
}

export async function removeDevice(id) {
  const list = (await getDevices()).filter((d) => d.id !== id);
  await write({ devices: list });
  return list;
}
