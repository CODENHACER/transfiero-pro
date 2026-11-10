// Carpeta de descarga (File System Access API).
// El "handle" de la carpeta elegida se guarda en IndexedDB, en el propio origen de la
// extensión, y en los ajustes solo se guarda el nombre visible. Ningún dato sale del equipo.
// Ventaja frente a chrome.downloads: permite elegir cualquier carpeta del sistema, no solo
// una subcarpeta de Descargas, y no añade ningún permiso nuevo al manifest.

// Canal por el que la pestaña de elección de carpeta (select-folder.html) avisa al panel lateral.
export const DL_CHANNEL = "transfiero-folder";

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

// queryPermission() y requestPermission() resuelven con una CADENA ("granted",
// "denied" o "prompt"); se normaliza por si alguna versión devolviera un objeto.
function permState(res) {
  if (typeof res === "string") return res;
  return res?.state ?? "prompt";
}

// Abre el selector nativo de carpetas y devuelve el handle, ya guardado en IndexedDB.
// IMPORTANTE: debe llamarse desde una PESTAÑA de la extensión (select-folder.html).
// En el panel lateral el selector falla aunque el usuario elija carpeta: Chrome
// devuelve "AbortError" como si se hubiera cancelado (bug crbug.com/40240444).
export async function pickDownloadFolder() {
  const handle = await window.showDirectoryPicker({
    mode: "readwrite",
    id: "transfiero-dl",     // recuerda la última ubicación del selector
    startIn: "downloads",
  });
  await withStore("readwrite", (store) => store.put(handle, KEY));
  await grantDownloadFolder(handle); // deja el permiso concedido y persistente si se puede
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
    return permState(await handle.queryPermission({ mode: "readwrite" }));
  } catch {
    return "gone"; // carpeta renombrada, movida o en una unidad desconectada
  }
}

// Concede el permiso que falte y lo hace persistente entre sesiones (Chrome 122+).
// Requiere un clic del usuario: se usa al elegir carpeta y desde el botón del panel
// "Permitir acceso" cuando el permiso ha caducado tras reiniciar el navegador.
export async function grantDownloadFolder(handle) {
  try {
    if ((await folderPermission(handle)) !== "granted" && typeof handle.requestPermission === "function") {
      if (permState(await handle.requestPermission({ mode: "readwrite" })) !== "granted") return false;
    }
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
