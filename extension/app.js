import { RELAY_URL, PHONE_URL } from "./shared/config.js";
import { createPeer, gatherComplete, verificationCode } from "./shared/peer.js";
import { openRoom } from "./shared/signal.js";
import { sendFiles, sendText, attachReceiver, formatBytes } from "./shared/transfer.js";
import { say, setLang, getLang, resolveLang, applyI18n, t } from "./shared/i18n.js";
import { getSettings, saveSettings, getHistory, addHistory, clearHistory, getDevices, saveDevice, removeDevice } from "./shared/store.js";
import { previewFor, categoryLabel } from "./shared/preview.js";
import { collectFromInput, collectFromEntry, zipEntries } from "./shared/pack.js";
import { makeSecret, validSecret, roomFromSecret, proofFor, selfName } from "./shared/trust.js";

const BIG_FOLDER = 1.5 * 1024 ** 3; // a partir de 1,5 GB se avisa de que la compresión puede ser pesada
const TRUST_ATTEMPTS = 3;      // intentos de conexión con un móvil recordado
const TRUST_TIMEOUT = 12000;   // cada intento espera al móvil 12 s
const TRUST_PAUSE = 2000;      // pausa entre intentos
const URL_RE = /^https?:\/\/\S+$/i;

const hasChromeDownloads = typeof chrome !== "undefined" && !!chrome.downloads?.download;

const $ = (id) => document.getElementById(id);
let s = {};                 // sesión activa
let sendQueue = Promise.resolve();
let cfg = {};               // ajustes actuales
let prevPanel = "pair";     // para volver desde Ajustes
let savedName = null;       // móvil guardado en la sesión anterior: se avisa al volver al panel de emparejar

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

function status(key, kind = "wait", vars = {}) {
  const el = $("status");
  say(el, key, vars);
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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

// Canal de datos compartido por los dos flujos (QR y móvil recordado). El receptor se
// instala al abrirse el canal: los mensajes de control (hello, trust-*) pueden llegar
// antes de que el usuario verifique el código, y los de archivo/texto se ignoran hasta
// que la sesión esté verificada (igual que en versiones anteriores).
function wireChannel(sess) {
  sess.dc.onopen = () => {
    if (s !== sess) return;
    attachReceiver(sess.dc, {
      onFile: (f) => { if (s === sess && sess.attached) onReceived(sess, f); },
      onProgress: (p) => { if (s === sess && sess.attached) showRecv(p); },
      onText: (txt) => { if (s === sess && sess.attached) onTextReceived(sess, txt); },
      onControl: (msg) => onControlMsg(sess, msg),
    });
    if (sess.trust) startTrustProof(sess);
    enable(sess);
  };
  sess.dc.onclose = () => {
    if (s === sess && sess.attached) endSession("msg.closed");
  };
  sess.pc.onconnectionstatechange = () => {
    if (s !== sess || sess.pc?.connectionState !== "failed") return;
    if (sess.trust && !sess.attached) sess.onAttemptFail?.(); // el bucle de reintento lo gestiona
    else endSession("msg.failed");
  };
}

function newSession() {
  closeSession();
  const sess = {
    room: randomRoom(), trust: null, verified: false, attached: false, paired: false,
    pendingHello: null, pendingDevice: null, remoteSdp: null, proof: null,
  };
  sess.pc = createPeer();
  sess.dc = sess.pc.createDataChannel("transfiero");
  wireChannel(sess);
  s = sess;

  const link = `${PHONE_URL}#${sess.room}`;
  QRCode.toCanvas($("qr"), link, { width: 200, margin: 1 }, (err) => err && console.error(err));
  $("link").href = link;
  $("copy").dataset.link = link;
  $("hint").hidden = true;
  $("retry").hidden = true;
  $("qrBlock").hidden = false;
  showPanel("pair");
  status("st.wait", "wait");
  renderDevices();
  if (savedName) {
    // Aviso de que el móvil de la sesión anterior quedó recordado.
    say($("trustStatus"), "dv.saved");
    $("trustStatus").hidden = false;
    savedName = null;
  } else {
    $("trustStatus").hidden = true;
  }

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

// Conexión con un móvil recordado: misma sala derivada del secreto, sin QR y con
// verificación automática (la prueba del canal sustituye al código de 6 cifras).
async function connectTrusted(device) {
  closeSession();
  const sess = {
    room: device.id, trust: device, verified: false, attached: false, paired: false,
    pendingHello: null, pendingDevice: null, remoteSdp: null, proof: null,
  };
  s = sess;

  showPanel("pair");
  $("qrBlock").hidden = true; // durante la conexión directa el QR no hace falta
  $("hint").hidden = true;
  $("retry").hidden = true;
  renderDevices(device.id);
  status("dv.connecting", "wait", { name: device.name });

  for (let attempt = 1; attempt <= TRUST_ATTEMPTS; attempt++) {
    const outcome = await tryTrusted(sess);
    if (s !== sess || sess.attached) return; // conectado, o el usuario cambió de pantalla
    if (outcome === "ok" || outcome === "stop") return;
    if (attempt < TRUST_ATTEMPTS) {
      status("dv.retrying", "warn", { name: device.name });
      await sleep(TRUST_PAUSE);
      if (s !== sess || sess.attached) return;
    }
  }
  // El móvil no aparece (no tiene abierta la página): vuelve al QR y lo explica.
  newSession();
  hint("dv.notfound");
}

// Un intento: abre la sala, espera al móvil ("ready"), crea la oferta y espera la
// verificación automática. Devuelve "ok", "stop" (fallo de seguridad, ya resuelto),
// "abort" (el usuario navegó a otra parte) o "retry".
function tryTrusted(sess) {
  if (sess.attached) return Promise.resolve("ok");
  return new Promise((resolve) => {
    let settled = false;
    const finish = (v) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      // Al fallar el intento se cierra la sala: el servidor la destruye y el móvil
      // reintentará por su cuenta. No se cierra al tener éxito (se cierra al terminar).
      if (v === "retry") { try { sess.sig?.close(); sess.sig = null; } catch { } }
      resolve(v);
    };
    const timer = setTimeout(() => finish("retry"), TRUST_TIMEOUT);
    sess.onReady = () => finish("ok");
    sess.onAttemptFail = () => finish("retry");
    sess.onTrustFail = () => { finish("stop"); endSession("msg.trustfail"); };

    // Cada intento usa su propio par de conexión (se cierran los anteriores).
    try { sess.pc?.close(); } catch { }
    const pc = sess.pc = createPeer();
    sess.dc = pc.createDataChannel("transfiero");
    wireChannel(sess);
    sess.sig = openRoom({
      url: RELAY_URL,
      room: sess.room,
      // Los mensajes tardíos de un intento anterior se descartan.
      onMessage: (msg) => { if (!settled) handleSignal(sess, msg); },
      onClose: () => {
        if (s === sess && !sess.attached && !sess.verified) finish("retry");
      },
    });
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
      sess.remoteSdp = msg.sdp;
      if (sess.trust) {
        // La verificación es automática (prueba del canal); no se muestra el código.
        status("st.channel", "wait");
      } else {
        $("code").textContent = await verificationCode(sess.pc.localDescription.sdp, msg.sdp);
        showPanel("verify");
        status("st.verify", "warn");
      }
    }
  } catch (err) {
    console.error(err);
    if (sess.trust && !sess.attached) sess.onAttemptFail?.();
    else endSession("msg.error");
  }
}

// En el flujo del móvil recordado, el PC envía la prueba del canal en cuanto se abre.
async function startTrustProof(sess) {
  try {
    status("dv.verifying", "wait");
    const proof = await proofFor(sess.trust.secret, sess.pc.localDescription.sdp, sess.remoteSdp);
    if (s !== sess) return;
    sess.proof = proof;
    sess.dc.send(JSON.stringify({ t: "trust-proof", proof }));
  } catch (err) {
    console.error(err);
    sess.onTrustFail?.();
  }
}

// Mensajes de control que llegan por el canal de datos (JSON que no es meta/end/text).
async function onControlMsg(sess, msg) {
  if (s !== sess) return;
  try {
    if (msg.t === "hello") {
      // El móvil se presenta tras verificar el código del QR (primer emparejamiento).
      if (sess.trust) return;
      if (!sess.verified || !sess.attached) { sess.pendingHello = msg; return; }
      await answerHello(sess, msg);
    } else if (msg.t === "trust-ok") {
      if (sess.trust) {
        // El móvil aceptó la prueba: la conexión queda verificada automáticamente.
        if (sess.proof && msg.proof !== sess.proof) {
          if (sess.onTrustFail) sess.onTrustFail();
          else endSession("msg.trustfail");
          return;
        }
        sess.verified = true;
        await saveDevice({ id: sess.trust.id, name: String(msg.name || sess.trust.name), secret: sess.trust.secret, at: Date.now() });
        renderDevices(sess.trust.id);
        enable(sess);
      } else if (sess.pendingDevice && sess.attached) {
        // Primer emparejamiento por QR: el móvil ya guardó el secreto, lo recordamos también.
        await saveDevice(sess.pendingDevice);
        savedName = sess.pendingDevice.name;
        sess.pendingDevice = null;
        renderDevices();
      }
    } else if (msg.t === "trust-fail" && sess.trust) {
      sess.onTrustFail ? sess.onTrustFail() : endSession("msg.trustfail");
    }
  } catch (err) {
    console.error(err);
  }
}

// Responde al saludo del móvil con el secreto compartido. Si el móvil ya conocía a
// este PC (reenvía su enlace anterior), se reutiliza el secreto para no duplicar.
async function answerHello(sess, msg) {
  const links = Array.isArray(msg.links) ? msg.links : [];
  const known = (await getDevices()).find((d) => links.includes(d.id));
  const secret = known ? known.secret : makeSecret();
  const id = known ? known.id : await roomFromSecret(secret);
  sess.pendingDevice = { id, name: String(msg.name || "Móvil"), secret, at: Date.now() };
  sess.dc.send(JSON.stringify({ t: "trust-offer", secret, name: selfName() }));
}

// Solo se activa la transferencia cuando el código está verificado y el canal está abierto.
function enable(sess) {
  if (s !== sess || !sess.verified || sess.attached || !sess.dc || sess.dc.readyState !== "open") return;
  sess.attached = true;
  showPanel("transfer");
  if (sess.trust) status("dv.connected", "ok", { name: sess.trust.name });
  else status("st.connected", "ok");
  renderHistory();
  if (sess.pendingHello && !sess.trust) {
    const hello = sess.pendingHello;
    sess.pendingHello = null;
    answerHello(sess, hello);
  }
  sess.onReady?.();
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

// ---------- Textos cortos (enlaces, códigos 2FA, contraseñas) ----------

function snippetOf(text) {
  return String(text).replace(/\s+/g, " ").trim().slice(0, 80);
}

async function copyText(text, btn) {
  try { await navigator.clipboard.writeText(text); } catch { /* sin permiso de portapapeles */ }
  say(btn, "tx.copied");
  setTimeout(() => say(btn, "tx.copy"), 1500);
}

function openUrlBtn(text) {
  const btn = document.createElement("button");
  btn.className = "btn small";
  say(btn, "tx.open");
  btn.onclick = () => window.open(text, "_blank", "noopener");
  return btn;
}

async function addTextRow(dir, text) {
  const li = document.createElement("li");
  li.className = "item";
  const meta = document.createElement("div");
  meta.className = "meta";
  const fn = document.createElement("span");
  fn.className = "fname";
  say(fn, "tx.kind");
  const info = document.createElement("small");
  info.className = "muted";
  info.textContent = `${snippetOf(text) || "—"} · ${formatBytes(new Blob([text]).size)}`;
  meta.append(fn, info);

  const file = new File([text], "texto.txt", { type: "text/plain" });
  li.append(await previewFor(file, "texto.txt", cfg.previews), meta);

  const acts = document.createElement("div");
  acts.className = "acts";
  const btnCopy = document.createElement("button");
  btnCopy.className = "btn small";
  say(btnCopy, "tx.copy");
  btnCopy.onclick = () => copyText(text, btnCopy);
  acts.append(btnCopy);
  if (URL_RE.test(text.trim())) acts.append(openUrlBtn(text.trim()));
  li.append(acts);

  $(dir === "send" ? "sentList" : "received").prepend(li);
  if (cfg.history) {
    await addHistory({ dir, name: snippetOf(text) || t("tx.kind"), kind: "text", text, size: text.length, type: "text/plain" });
    renderHistory();
  }
}

function sendTextNow(text) {
  if (!s.attached) return status("st.nophone", "warn");
  sendText(s.dc, text);
  addTextRow("send", text);
  say($("sendLabel"), "tx.sent");
}

function sendTxt() {
  const text = $("txtOut").value.trim();
  if (!text) return say($("sendLabel"), "tx.empty");
  $("txtOut").value = "";
  sendTextNow(text);
}

async function onTextReceived(sess, text) {
  if (!text) return;
  say($("recvLabel"), "tx.recvpc");
  await addTextRow("recv", text);
}

// ---------- Guardado de archivos recibidos (chrome.downloads) ----------

// Libera el blob URL cuando la descarga termina (o a los 5 minutos, pase lo que pase).
function watchDownload(url, dlId) {
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    try { chrome.downloads.onChanged.removeListener(onChange); } catch { }
    URL.revokeObjectURL(url);
  };
  const onChange = (delta) => {
    if (delta.id === dlId && delta.state?.current && delta.state.current !== "in_progress") finish();
  };
  try { chrome.downloads.onChanged.addListener(onChange); } catch { }
  setTimeout(finish, 5 * 60 * 1000);
}

function subfolderFor() {
  if (cfg.dlmode === 1) return "TRANSFIERO/";
  if (cfg.dlmode === 2) return `TRANSFIERO/${new Date().toISOString().slice(0, 7)}/`;
  return "";
}

// Guarda lo recibido con chrome.downloads según el ajuste de subcarpetas. Fuera de la
// extensión (o si la API falla) se usa la descarga clásica del navegador.
async function saveReceived({ name, blob }) {
  const sub = subfolderFor();
  if (hasChromeDownloads) {
    const url = URL.createObjectURL(blob);
    try {
      const dlId = await chrome.downloads.download({ url, filename: sub + name, conflictAction: "uniquify", saveAs: false });
      watchDownload(url, dlId);
      return { dlId, sub };
    } catch (err) {
      console.error(err);
      URL.revokeObjectURL(url);
    }
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 60000);
  return { dlId: null, sub };
}

function dlActs(dlId) {
  const acts = document.createElement("div");
  acts.className = "acts";
  const mk = (key, fn) => {
    const b = document.createElement("button");
    b.className = "btn small";
    say(b, key);
    b.onclick = async () => {
      try { await fn(); } catch { say(b, "dl.err"); }
    };
    return b;
  };
  acts.append(mk("dl.show", () => chrome.downloads.show(dlId)), mk("dl.open", () => chrome.downloads.open(dlId)));
  return acts;
}

// ---------- Filas de la interfaz ----------

// Añade una fila a la lista con su vista previa. Si el historial está activo, guarda solo los metadatos.
async function addRow(dir, blob, name, folderCount = null, dlId = null) {
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
    list.prepend(li);
    if (dlId != null) li.append(dlActs(dlId)); // botones Mostrar / Abrir
  } else {
    list.prepend(li);
  }

  if (cfg.history) {
    await addHistory({ dir, name, size: blob.size, type: blob.type, dlId: dir === "recv" ? dlId : null });
    renderHistory();
  }
}

async function onReceived(sess, { name, blob, folder }) {
  $("recvBar").style.width = "100%";
  const { dlId, sub } = await saveReceived({ name, blob });
  // "foto.jpg" o "foto.jpg · guardado en TRANSFIERO"
  $("recvLabel").textContent = sub
    ? `${t("recv.got", { name })} · ${t("dl.savedin")} ${sub.replace(/\/$/, "")}`
    : t("recv.got", { name });
  await addRow("recv", blob, name, folder, dlId);
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

// ---------- Historial ----------

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
  const when = (at) => new Date(at).toLocaleString(locale, { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
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
    info.textContent = `${when(entry.at)} · ${formatBytes(entry.size)}`;
    meta.append(dir, fn, info);
    li.append(meta);

    if (entry.kind === "text") {
      const btnCopy = document.createElement("button");
      btnCopy.className = "btn small";
      say(btnCopy, "tx.copy");
      btnCopy.onclick = () => copyText(entry.text || "", btnCopy);
      const acts = document.createElement("div");
      acts.className = "acts";
      acts.append(btnCopy);
      if (URL_RE.test(String(entry.text || "").trim())) acts.append(openUrlBtn(entry.text.trim()));
      li.append(acts);
    } else if (entry.dir === "recv" && entry.dlId != null && hasChromeDownloads) {
      li.append(dlActs(entry.dlId));
    }
    ul.append(li);
  }
}

// ---------- Dispositivos recordados ----------

async function renderDevices(activeId = null) {
  const ul = $("devList");
  const devices = await getDevices();
  if (!devices.length) {
    $("trustBox").hidden = true;
    return;
  }
  $("trustBox").hidden = false;
  ul.replaceChildren();
  for (const dev of devices) {
    const li = document.createElement("li");
    li.className = "dev" + (dev.id === activeId ? " active" : "");
    const name = document.createElement("span");
    name.className = "devname";
    name.textContent = dev.name || "Móvil";
    const acts = document.createElement("div");
    acts.className = "acts";
    const btnConnect = document.createElement("button");
    btnConnect.className = "btn small primary";
    say(btnConnect, "dv.connect");
    btnConnect.onclick = () => connectTrusted(dev);
    const btnForget = document.createElement("button");
    btnForget.className = "btn small ghost";
    say(btnForget, "dv.forget");
    btnForget.onclick = async () => {
      await removeDevice(dev.id);
      renderDevices();
    };
    acts.append(btnConnect, btnForget);
    li.append(name, acts);
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
  renderDevices();
}

function syncSettingsUI() {
  $("setDark").checked = !!cfg.dark;
  $("setPrev").checked = !!cfg.previews;
  $("setHist").checked = !!cfg.history;
  $("setLang").value = cfg.lang || "auto";
  $("setDl").value = String(cfg.dlmode ?? 0);
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
$("setDl").onchange = async (e) => {
  cfg = await saveSettings({ dlmode: Number(e.target.value) || 0 });
};
$("setLang").onchange = async (e) => {
  cfg = await saveSettings({ lang: e.target.value });
  applyLanguage();
};
$("btnClearHist").onclick = async () => {
  await clearHistory();
  renderHistory();
};

// Envío de textos: botón, Enter (Shift+Enter hace salto de línea)
$("btnTxt").onclick = sendTxt;
$("txtOut").addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendTxt();
  }
});

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
  if (files.length) {
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
    return;
  }
  // Sin archivos: texto arrastrado desde otra página o aplicación.
  const text = dt.getData("text/plain");
  if (text && text.trim()) sendTextNow(text.trim());
}

// Pegar texto en el panel (fuera de los campos de escritura) lo envía al móvil.
document.addEventListener("paste", (e) => {
  const text = e.clipboardData?.getData("text/plain");
  if (!text || !text.trim()) return;
  if (e.target?.closest?.("input, textarea, select, [contenteditable]")) return;
  if (!s.attached) return status("st.nophone", "warn");
  e.preventDefault();
  sendTextNow(text.trim());
});

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
