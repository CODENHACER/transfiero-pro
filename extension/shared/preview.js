// Previsualización inteligente según el tipo de archivo.
import { t } from "./i18n.js";

const CATEGORY = {
  image: ["jpg", "jpeg", "png", "gif", "webp", "heic", "heif", "bmp", "svg"],
  video: ["mp4", "mov", "webm", "mkv", "avi"],
  audio: ["mp3", "m4a", "wav", "ogg", "aac", "flac"],
  pdf: ["pdf"],
  doc: ["doc", "docx", "odt", "rtf", "pages"],
  sheet: ["xls", "xlsx", "ods", "numbers", "csv"],
  slide: ["ppt", "pptx", "odp", "key"],
  zip: ["zip", "rar", "7z", "tar", "gz"],
  text: ["txt", "md", "json", "html", "htm", "xml", "log", "js", "css"],
};
const COLOR = {
  image: "#2e9e5b", video: "#c2410c", audio: "#0e7490", pdf: "#d6312b", doc: "#2b6cb0",
  sheet: "#1f8a4c", slide: "#c2410c", zip: "#6b6480", text: "#4a5568", other: "#6b6480",
};

export function extOf(name) {
  const m = /\.([^.]+)$/.exec(name || "");
  return m ? m[1].toLowerCase() : "";
}

export function categoryOf(name, mime = "") {
  const ext = extOf(name);
  for (const [cat, list] of Object.entries(CATEGORY)) if (list.includes(ext)) return cat;
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  if (mime.startsWith("text/")) return "text";
  return "other";
}

export function categoryLabel(name, mime) {
  return t(`cat.${categoryOf(name, mime)}`);
}

function badge(name, mime) {
  const cat = categoryOf(name, mime);
  const b = document.createElement("div");
  b.className = "badge";
  b.style.background = COLOR[cat];
  b.textContent = (extOf(name) || cat).toUpperCase().slice(0, 4);
  return b;
}

// Devuelve un elemento con la vista previa. Si showContent es false, solo la etiqueta del tipo.
export async function previewFor(blob, name, showContent = true) {
  const cat = categoryOf(name, blob.type);
  const wrap = document.createElement("div");
  wrap.className = "preview";
  if (!showContent) {
    wrap.append(badge(name, blob.type));
    return wrap;
  }

  if (cat === "image") {
    const info = document.createElement("small");
    info.className = "muted";
    const img = document.createElement("img");
    img.className = "thumb";
    img.alt = "";
    img.onload = () => { info.textContent = `${img.naturalWidth} × ${img.naturalHeight} px`; };
    img.onerror = () => img.replaceWith(badge(name, blob.type)); // p. ej. HEIC no compatible
    img.src = URL.createObjectURL(blob);
    wrap.append(img, info);
  } else if (cat === "video") {
    const v = document.createElement("video");
    v.className = "thumb";
    v.controls = true;
    v.preload = "metadata";
    v.src = URL.createObjectURL(blob);
    wrap.append(v);
  } else if (cat === "audio") {
    const a = document.createElement("audio");
    a.controls = true;
    a.preload = "metadata";
    a.src = URL.createObjectURL(blob);
    wrap.append(a);
  } else if (cat === "text") {
    const snippet = (await blob.slice(0, 600).text()).replace(/\s+/g, " ").trim();
    const p = document.createElement("p");
    p.className = "snippet";
    p.textContent = snippet || "—";
    wrap.append(badge(name, blob.type), p);
  } else {
    wrap.append(badge(name, blob.type));
  }
  return wrap;
}
