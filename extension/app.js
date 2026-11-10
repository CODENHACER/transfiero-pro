import { RELAY_URL, PHONE_URL } from "./shared/config.js";
import { createPeer, gatherComplete, verificationCode } from "./shared/peer.js";
import { openRoom } from "./shared/signal.js";
import { sendFiles, attachReceiver, formatBytes } from "./shared/transfer.js";
import { say, setLang, getLang, resolveLang, applyI18n, t } from "./shared/i18n.js";
import { getSettings, saveSettings, getHistory, addHistory, clearHistory } from "./shared/store.js";
import { previewFor, categoryLabel } from "./shared/preview.js";
import { collectFromInput, collectFromEntry, zipEntries } from "./shared/pack.js";

const BIG_FOLDER = 1.5 * 1024 ** 3; // a partir de 1,5 GB se avisa de que la compresión puede ser pesada

const $ = (id) => document.getElementById(id);
let s = {};                 // sesión activa
let sendQueue = Promise.resolve();
let cfg = {};               // ajustes actuales
let prevPanel = "pair";     // para volver desde Ajustes

function currentPanel() {
  return document.querySelector("[data-panel]:not([hidden])")?.dataset.panel || "pair";
}

let logoutArmed = null;     // temporizador del paso de confirmación de "Cerrar sesión"

function showPanel(id) {
  document.querySelectorAll("[data-panel]").forEach((p) => (p.hidden = p.dataset.panel !== id));
  // La barra de cierre de sesión está disponible en todo momento mientras hay una sesión
  $("logoutBar").hidden = id === "ended";
}

function disarmLogout() {
  clearTimeout(logoutArmed);
  logoutArmed = null;
  say($("logout"), "btn.logout");
  $("logout").classList.remove("armed");
}

function status(key, kind = "wait") {
  const el = $("status");
  say(el, key);
  el.className = `pill ${kind}`;
}

function hint(key, kind = "err") {
  const el = $("hint");
  say(el, key);
  el.className = `hint ${kind}`;
  el.hidden = false;
}

function randomRoom() {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function closeSession() {
  if (s.sig) s.sig.close();
  if (s.dc) s.dc.close();
  if (s.pc) s.pc.close();
  s = {};
}

function endSession(messageKey) {
  disarmLogout();
  closeSession();
  if (messageKey) say($("endMsg"), messageKey);
  showPanel("ended");
  status("st.ended", "err");
}

function newSession() {
  closeSession();
  const sess = { room: randomRoom(), verified: false, attached: false, paired: false };
  sess.pc = createPeer();
  sess.dc = sess.pc.createDataChannel("transfiero");
  sess.dc.onopen = () => enable(sess);
  sess.dc.onclose = () => {
    if (s === sess && sess.attached) endSession("msg.closed");
  };
  sess.pc.onconnectionstatechange = () => {
    if (s === sess && sess.pc.connectionState === "failed") endSession("msg.failed");
  };
  s = sess;

  const link = `${PHONE_URL}#${sess.room}`;
  QRCode.toCanvas($("qr"), link, { width: 200, margin: 1 }, (err) => err && console.error(err));
  $("link").href = link;
  $("copy").dataset.link = link;
  $("hint").hidden = true;
  $("retry").hidden = true;
  showPanel("pair");
  status("st.wait", "wait");

  sess.sig = openRoom({
    url: RELAY_URL,
    room: sess.room,
    onMessage: (msg) => handleSignal(sess, msg),
    onClose: () => {
      // El QR se mantiene visible para poder reintentar; no se cierra la sesión de golpe.
      if (s !== sess || sess.attached || sess.verified) return;
      status("st.server", "err");
      hint(sess.paired ? "msg.lost" : "msg.server");
      $("retry").hidden = false;
    },
  });
}

async function handleSignal(sess, msg) {
  if (s !== sess) return;
  try {
    if (msg.type === "ready") {
      // El móvil ya está en la sala: el PC crea la oferta.
      sess.paired = true;
      await sess.pc.setLocalDescription(await sess.pc.createOffer());
      await gatherComplete(sess.pc);
      sess.sig.send({ type: "offer", sdp: sess.pc.localDescription.sdp });
    } else if (msg.type === "answer") {
      await sess.pc.setRemoteDescription({ type: "answer", sdp: msg.sdp });
      $("code").textContent = await verificationCode(sess.pc.localDescription.sdp, msg.sdp);
      showPanel("verify");
      status("st.verify", "warn");
    }
  } catch (err) {
    console.error(err);
    endSession("msg.error");
  }
}

// Solo se activa la transferencia cuando el código está verificado y el canal está abierto.
function enable(sess) {
  if (s !== sess || !sess.verified || sess.attached || sess.dc.readyState !== "open") return;
  sess.attached = true;
  attachReceiver(sess.dc, { onFile: onReceived, onProgress: showRecv });
  showPanel("transfer");
  status("st.connected", "ok");
  renderHistory();
}

function pct(sent, total) {
  return total ? Math.round((sent / total) * 100) : 100;
}

function showSend({ name, sent, total }) {
  const p = pct(sent, total);
  $("sendBar").style.width = `${p}%`;
  say($("sendLabel"), "send.progress", { name, pct: p });
}

function showRecv({ name, sent, total }) {
  const p = pct(sent, total);
  $("recvBar").style.width = `${p}%`;
  say($("recvLabel"), "recv.progress", { name, pct: p });
}

// Añade una fila a la lista con su vista previa. Si el historial está activo, guarda solo los metadatos.
async function addRow(dir, blob, name, folderCount = null) {
  const list = $(dir === "send" ? "sentList" : "received");
  const li = document.createElement("li");
  li.className = "item";

  const meta = document.createElement("div");
  meta.className = "meta";
  const fn = document.createElement("span");
  fn.className = "fname";
  fn.textContent = name;
  const info = document.createElement("small");
  info.className = "muted";
  info.textContent = folderCount
    ? `${t("cat.folder", { n: folderCount })} · ${formatBytes(blob.size)}`
    : `${categoryLabel(name, blob.type)} · ${formatBytes(blob.size)}`;
  meta.append(fn, info);

  li.append(await previewFor(blob, name, cfg.previews), meta);

  if (dir === "recv") {
    // Se descarga automáticamente en la carpeta de descargas del navegador (no hay botón de guardar)
    list.prepend(li);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
  } else {
    list.prepend(li);
  }

  if (cfg.history) {
    await addHistory({ dir, name, size: blob.size, type: blob.type });
    renderHistory();
  }
}

// Cola de envío: cada trabajo es un archivo suelto o una carpeta (se empaqueta en ZIP antes de enviarla).
function enqueue(jobs) {
  if (!jobs.length) return;
  if (!s.attached) return status("st.nophone", "warn");
  const sess = s;
  sendQueue = sendQueue
    .then(async () => {
      for (const job of jobs) {
        if (job.kind === "folder") {
          await sendFolder(sess, job);
        } else {
          await sendFiles(sess.dc, [job.file], showSend);
          await addRow("send", job.file, job.file.name);
        }
      }
      say($("sendLabel"), "send.done", { n: jobs.length });
    })
    .catch((err) => {
      console.error(err);
      say($("sendLabel"), "send.error");
    });
}

async function sendFolder(sess, job) {
  const count = job.entries.length;
  if (!count) {
    say($("sendLabel"), "send.folder.empty");
    return;
  }
  const total = job.entries.reduce((sum, e) => sum + e.file.size, 0);
  if (total > BIG_FOLDER) say($("sendLabel"), "send.folder.big");

  const blob = await zipEntries(job.entries, (done, all) => {
    $("sendBar").style.width = `${Math.round((done / all) * 100)}%`;
    say($("sendLabel"), "send.folder.zipping", { name: job.name, n: count });
  });
  const file = new File([blob], `${job.name}.zip`, { type: "application/zip" });
  $("sendBar").style.width = "0%";
  await sendFiles(sess.dc, [{ file, folder: count }], showSend);
  await addRow("send", file, file.name, count);
}

async function onReceived({ name, blob, folder }) {
  $("recvBar").style.width = "100%";
  say($("recvLabel"), "recv.got", { name });
  await addRow("recv", blob, name, folder);
}

async function renderHistory() {
  $("histCard").hidden = !cfg.history;
  if (!cfg.history) return;
  const ul = $("histList");
  ul.replaceChildren();
  const list = (await getHistory()).slice(0, 30);
  if (!list.length) {
    const li = document.createElement("li");
    li.className = "muted small";
    say(li, "hist.empty");
    ul.append(li);
    return;
  }
  const locale = { es: "es-ES", en: "en-GB", ca: "ca-ES", fr: "fr-FR", de: "de-DE", ro: "ro-RO" }[getLang()] || "en-GB";
  for (const entry of list) {
    const li = document.createElement("li");
    li.className = "item";
    const meta = document.createElement("div");
    meta.className = "meta";
    const dir = document.createElement("span");
    dir.className = "hist-dir";
    say(dir, entry.dir === "send" ? "hist.sent" : "hist.recv");
    const fn = document.createElement("span");
    fn.className = "fname";
    fn.textContent = entry.name;
    const info = document.createElement("small");
    info.className = "muted";
    info.textContent = `${new Date(entry.at).toLocaleString(locale, { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })} · ${formatBytes(entry.size)}`;
    meta.append(dir, fn, info);
    li.append(meta);
    ul.append(li);
  }
}

function applyTheme(dark) {
  document.documentElement.dataset.theme = dark ? "dark" : "light";
}

function applyLanguage() {
  setLang(resolveLang(cfg.lang));
  applyI18n();
  document.title = "TRANSFIERO Pro";
  renderHistory();
}

function syncSettingsUI() {
  $("setDark").checked = !!cfg.dark;
  $("setPrev").checked = !!cfg.previews;
  $("setHist").checked = !!cfg.history;
  $("setLang").value = cfg.lang || "auto";
}

// Eventos de la interfaz
$("confirm").onclick = () => {
  s.verified = true;
  enable(s);
  if (!s.attached) status("st.channel", "wait");
};
$("cancel").onclick = () => endSession("msg.cancel");
$("copy").onclick = async () => {
  await navigator.clipboard.writeText($("copy").dataset.link || "");
  say($("copy"), "btn.copied");
  setTimeout(() => say($("copy"), "btn.copy"), 1500);
};
$("retry").onclick = newSession;
$("restart").onclick = newSession;

// Cerrar sesión: dos pasos para evitar cierres accidentales
$("logout").onclick = () => {
  if (!logoutArmed) {
    say($("logout"), "btn.logout_confirm");
    $("logout").classList.add("armed");
    logoutArmed = setTimeout(disarmLogout, 4000);
    return;
  }
  endSession("msg.user_closed");
};

$("btnSettings").onclick = () => {
  // Solo recordamos la pantalla anterior si no estamos ya en Ajustes (evita "volver" a Ajustes)
  if (currentPanel() !== "settings") prevPanel = currentPanel();
  showPanel("settings");
};

// Volver: regresa a la pantalla anterior si la sesión sigue activa; si no, muestra un código QR nuevo
$("btnBack").onclick = () => {
  if (prevPanel === "settings" || !s.room) return newSession();
  showPanel(prevPanel);
};

// Inicio: vuelve a la pantalla inicial con un código QR nuevo, como al arrancar la extensión.
// Si hay una sesión conectada, se pide confirmación (segundo clic) para no cortarla por error.
let homeArmed = null;
function disarmHome() {
  clearTimeout(homeArmed);
  homeArmed = null;
  $("btnHome").classList.remove("armed");
}
$("btnHome").onclick = () => {
  if (s.attached && !homeArmed) {
    $("btnHome").classList.add("armed");
    homeArmed = setTimeout(disarmHome, 4000);
    return;
  }
  disarmHome();
  newSession();
};
$("setDark").onchange = async (e) => {
  cfg = await saveSettings({ dark: e.target.checked });
  applyTheme(cfg.dark);
};
$("setPrev").onchange = async (e) => {
  cfg = await saveSettings({ previews: e.target.checked });
};
$("setHist").onchange = async (e) => {
  cfg = await saveSettings({ history: e.target.checked });
  renderHistory();
};
$("setLang").onchange = async (e) => {
  cfg = await saveSettings({ lang: e.target.value });
  applyLanguage();
};
$("btnClearHist").onclick = async () => {
  await clearHistory();
  renderHistory();
};

const drop = $("drop");
drop.addEventListener("dragover", (e) => { e.preventDefault(); drop.classList.add("over"); });
drop.addEventListener("dragleave", () => drop.classList.remove("over"));
drop.addEventListener("drop", (e) => {
  e.preventDefault();
  drop.classList.remove("over");
  handleDrop(e.dataTransfer);
});

async function handleDrop(dt) {
  const files = [...dt.files];
  const entries = [...dt.items].map((item) => item.webkitGetAsEntry?.()).filter(Boolean);
  if (!entries.length) {
    enqueue(files.map((file) => ({ kind: "file", file })));
    return;
  }
  const jobs = [];
  for (const entry of entries) {
    if (entry.isDirectory) {
      jobs.push(await collectFromEntry(entry));
    } else {
      const file = await new Promise((resolve, reject) => entry.file(resolve, reject));
      jobs.push({ kind: "file", file });
    }
  }
  enqueue(jobs);
}

$("pick").addEventListener("change", (e) => {
  const jobs = [...e.target.files].map((file) => ({ kind: "file", file }));
  e.target.value = "";
  enqueue(jobs);
});

$("btnPickFolder").onclick = () => $("pickFolder").click();
$("pickFolder").addEventListener("change", (e) => {
  const job = collectFromInput(e.target.files);
  e.target.value = "";
  enqueue([job]);
});
// Evita que soltar un archivo fuera de la zona abra el archivo en la pestaña.
window.addEventListener("dragover", (e) => e.preventDefault());
window.addEventListener("drop", (e) => e.preventDefault());

// Arranque: ajustes, idioma y modo noche antes de mostrar nada.
(async function init() {
  cfg = await getSettings();
  applyTheme(cfg.dark);
  setLang(resolveLang(cfg.lang));
  applyI18n();
  syncSettingsUI();
  newSession();
})();
