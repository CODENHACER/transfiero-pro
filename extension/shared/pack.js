// Carpetas: se recorren (botón o arrastre) y se empaquetan en un único ZIP que conserva la estructura.
// Usa fflate (incluida en lib/fflate.min.js) con nivel 1: rápido, y las fotos y vídeos ya vienen comprimidos.

// Carpeta elegida con el selector (webkitdirectory). Cada archivo trae su ruta relativa.
export function collectFromInput(fileList) {
  const files = [...fileList];
  const name = files[0]?.webkitRelativePath?.split("/")[0] || "carpeta";
  return { kind: "folder", name, entries: files.map((file) => ({ path: file.webkitRelativePath || file.name, file })) };
}

// Carpeta arrastrada: se recorre recursivamente con la API de entradas del navegador.
export async function collectFromEntry(entry) {
  const entries = [];
  await walk(entry, "", entries);
  return { kind: "folder", name: entry.name, entries };
}

async function walk(entry, parentPath, out) {
  const path = parentPath + entry.name;
  if (entry.isFile) {
    const file = await new Promise((resolve, reject) => entry.file(resolve, reject));
    out.push({ path, file });
  } else if (entry.isDirectory) {
    const reader = entry.createReader();
    let batch;
    do {
      batch = await new Promise((resolve, reject) => reader.readEntries(resolve, reject));
      for (const child of batch) await walk(child, path + "/", out);
    } while (batch.length);
  }
}

export function zipEntries(entries, onProgress) {
  const chunks = [];
  return new Promise((resolve, reject) => {
    const zip = new fflate.Zip((err, data, final) => {
      if (err) return reject(err);
      chunks.push(data);
      if (final) resolve(new Blob(chunks, { type: "application/zip" }));
    });
    (async () => {
      try {
        let done = 0;
        for (const { path, file } of entries) {
          const bytes = new Uint8Array(await file.arrayBuffer());
          const entry = new fflate.ZipDeflate(path, { level: 1 });
          zip.add(entry);
          entry.push(bytes, true);
          done += 1;
          onProgress?.(done, entries.length);
        }
        zip.end();
      } catch (err) {
        reject(err);
      }
    })();
  });
}
