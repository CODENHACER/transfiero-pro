// Carpeta de descarga (File System Access API).
// El "handle" de la carpeta elegida se guarda en IndexedDB, en el propio origen de la
// extensión, y en los ajustes solo se guarda el nombre visible. Ningún dato sale del equipo.
// Ventaja frente a chrome.downloads: permite elegir cualquier carpeta del sistema, no solo
// una subcarpeta de Descargas, y no añade ningún permiso nuevo al manifest.

const DB_NAME = "transfiero_store";
const STORE = "handles";
const KEY = "downloadFolder";

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function withStore(mode, fn) {
  return openDB().then((db) => new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    tx.oncomplete = () => { db.close(); resolve(req?.result); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  }));
}

// Abre el selector nativo de carpetas de Windows. Requiere un clic del usuario
// (por eso se llama desde un botón del panel lateral). Devuelve el handle.
export async function pickDownloadFolder() {
  const handle = await window.showDirectoryPicker({
    mode: "readwrite",
    id: "transfiero-dl",     // recuerda la última ubicación del selector
    startIn: "downloads",
  });
  await withStore("readwrite", (store) => store.put(handle, KEY));
  // Chrome 122+: el permiso se recuerda entre sesiones. En versiones anteriores
  // bastará con pulsar "Permitir acceso" cuando aparezca el aviso del panel.
  if (typeof handle.persistPermission === "function") {
    try { await handle.persistPermission({ mode: "readwrite" }); } catch { /* opcional */ }
  }
  return handle;
}

// Devuelve el handle guardado, o null si no hay carpeta elegida.
export async function getDownloadFolder() {
  try {
    return (await withStore("readonly", (store) => store.get(KEY))) || null;
  } catch {
    return null;
  }
}

export async function clearDownloadFolder() {
  try { await withStore("readwrite", (store) => store.delete(KEY)); } catch { /* nada guardado */ }
}

// Estado del permiso: "granted", "prompt", "denied" o "gone" (carpeta no disponible).
export async function folderPermission(handle) {
  if (!handle || typeof handle.queryPermission !== "function") return "gone";
  try {
    return (await handle.queryPermission({ mode: "readwrite" })).state;
  } catch {
    return "gone"; // carpeta renombrada, movida o en una unidad desconectada
  }
}

// Revalida el acceso tras reiniciar el navegador (Chrome anterior a 122). Requiere un clic.
export async function grantDownloadFolder(handle) {
  try {
    if ((await handle.requestPermission({ mode: "readwrite" })) !== "granted") return false;
    if (typeof handle.persistPermission === "function") {
      try { await handle.persistPermission({ mode: "readwrite" }); } catch { /* opcional */ }
    }
    return true;
  } catch {
    return false;
  }
}

function uniqueName(name, n) {
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : "";
  return `${base} (${n})${ext}`;
}

// Escribe un archivo en la carpeta y devuelve el nombre final usado
// (con " (n)" añadido si ya existía otro con el mismo nombre).
export async function saveFileToFolder(handle, name, blob) {
  let final = name;
  for (let n = 1; ; n++) {
    try {
      await handle.getFileHandle(final);       // existe: probamos el siguiente
      final = uniqueName(name, n);
    } catch (err) {
      if (err.name !== "NotFoundError") throw err; // libre: se puede crear
      break;
    }
  }
  const fh = await handle.getFileHandle(final, { create: true });
  const w = await fh.createWritable();
  await w.write(blob);
  await w.close();
  return final;
}
