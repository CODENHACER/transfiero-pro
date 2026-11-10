function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('transfiero_store', 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore('handles');
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveDirectoryHandle(handle) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('handles', 'readwrite');
    tx.objectStore('handles').put(handle, 'downloadFolder');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

const btnPick = document.getElementById('btnPick');
const statusMsg = document.getElementById('statusMsg');

async function pickFolder() {
  try {
    statusMsg.textContent = 'Abriendo selector de carpetas…';
    const handle = await window.showDirectoryPicker({
      mode: 'readwrite',
      startIn: 'downloads'
    });

    if (handle) {
      await saveDirectoryHandle(handle);
      await chrome.storage.local.set({
        folderName: handle.name,
        folderActive: true
      });

      chrome.runtime.sendMessage({
        type: 'FOLDER_SELECTED',
        folderName: handle.name
      }).catch(() => {});

      statusMsg.textContent = `✓ Carpeta "${handle.name}" guardada. Cerrando ventana...`;
      setTimeout(() => {
        window.close();
      }, 700);
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      statusMsg.textContent = 'Operación cancelada.';
    } else {
      statusMsg.textContent = 'Error: ' + err.message;
    }
  }
}

btnPick.addEventListener('click', pickFolder);
window.addEventListener('DOMContentLoaded', () => {
  pickFolder();
});
