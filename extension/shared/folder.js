// Carpeta de descargas elegida por el usuario (File System Access API).
// Solo se puede escribir en la carpeta que el usuario selecciona. El permiso lo concede el usuario
// y el navegador puede pedir que se reactive tras reiniciar o reabrir el panel.
const DB_NAME = "transfiero";
const STORE = "kv";

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function kv(mode, fn) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = fn(db.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export const folderSupported = () => typeof window.showDirectoryPicker === "function";

export async function loadFolder() {
  return (await kv("readonly", (s) => s.get("dir"))) || null;
}

export async function chooseFolder() {
  const handle = await window.showDirectoryPicker({ mode: "readwrite" });
  await kv("readwrite", (s) => s.put(handle, "dir"));
  return handle;
}

export async function resetFolder() {
  await kv("readwrite", (s) => s.delete("dir"));
}

export async function hasPermission(handle) {
  return (await handle.queryPermission({ mode: "readwrite" })) === "granted";
}

export async function requestPermission(handle) {
  return (await handle.requestPermission({ mode: "readwrite" })) === "granted";
}

async function exists(dir, name) {
  try {
    await dir.getFileHandle(name);
    return true;
  } catch {
    return false;
  }
}

// Evita sobrescribir: si ya existe "foto.jpg" guarda "foto (2).jpg", "foto (3).jpg", etc.
async function uniqueName(dir, name) {
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : "";
  let candidate = name;
  for (let i = 2; await exists(dir, candidate); i++) candidate = `${base} (${i})${ext}`;
  return candidate;
}

export async function saveToFolder(dir, name, blob) {
  const fileName = await uniqueName(dir, name);
  const fileHandle = await dir.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(blob);
  await writable.close();
  return fileName;
}
