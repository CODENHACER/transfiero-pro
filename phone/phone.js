import { RELAY_URL } from "../shared/config.js";
import { createPeer, gatherComplete, verificationCode } from "../shared/peer.js";
import { openRoom } from "../shared/signal.js";
import { sendFiles, sendText, attachReceiver, formatBytes } from "../shared/transfer.js";
import { say, setLang, resolveLang, applyI18n, t } from "../shared/i18n.js";
import { previewFor, categoryLabel } from "../shared/preview.js";
import { getDevices, saveDevice, removeDevice } from "../shared/store.js";
import { validSecret, roomFromSecret, proofFor, selfName } from "../shared/trust.js";

const $ = (id) => document.getElementById(id);
const hash = decodeURIComponent(location.hash.slice(1));
const QR_ROOM = /^[A-Za-z0-9_-]{20,64}$/.test(hash);
const URL_RE = /^https?:\/\/\S+$/i;

// "qr" (enlace con sala) o "trust" (PC recordado, sin escanear nada).
let mode = null;
let pc = null, dc = null, sig = null;
let verified = false, attached = false, ended = false;
let sendQueue = Promise.resolve();
let dev = null;          // PC recordado con el que se conecta (modo trust)
let savedPc = false;     // en el flujo QR: el PC ya quedó recordado en esta sesión
let stopWait = false;     // el usuario ha pulsado "Dejar de esperar"
let rejoinTimer = null;
let backoff = 3000;      // reintento de sala: 3 s → 15 s
let conn = 0;            // generación de conexión: los eventos de intentos antiguos se ignoran

// Idioma según el navegador del móvil (catalán, español, inglés…).
setLang(resolveLang(null));
applyI18n();

function showPanel(id) {
  document.querySelectorAll("[data-panel]").forEach((p) => (p.hidden = p.dataset.panel !== id));
}

function status(key, kind = "", vars = {}) {
  const el = $("status");
  say(el, key, vars);
  el.className = `pill ${kind}`;
}

// Pantalla de espera: en el flujo QR pide escanear; con un PC recordado, espera al PC.
function showWait(trust) {
  say($("waitH"), trust ? "m.waitpc" : "m.wait_h");
  say($("waitD"), trust ? "m.waitpc_d" : "m.wait");
  $("stopwait").hidden = !trust;
  showPanel("wait");
}

// Tras una sesión con un PC recordado, la página se queda esperando y se reconecta
// sola cuando el PC vuelve a pulsar "Conectar". Con "Dejar de esperar" se para.
const AUTO_RESUME = new Set(["m.closed", "m.connfail", "m.error"]);

function endSession(messageKey) {
  if (ended) return;
  ended = true;
  clearTimeout(rejoinTimer);
  if (sig) sig.close();
  if (dc) dc.close();
  if (pc) pc.close();
  sig = dc = pc = null;
  say($("endMsg"), messageKey);
  showPanel("end");
  status("st.ended", "err");
  if (mode === "trust" && AUTO_RESUME.has(messageKey) && !stopWait) {
    rejoinTimer = setTimeout(resumeTrust, 2500);
  }
}

function resumeTrust() {
  if (stopWait || !dev) return;
  ended = false;
  showWait(true);
  joinTrusted(dev);
}

function scheduleRejoin() {
  if (stopWait || !dev) return;
  clearTimeout(rejoinTimer);
  status("m.waitpc");
  rejoinTimer = setTimeout(() => {
    if (stopWait || attached) return;
    joinTrusted(dev);
  }, backoff);
  backoff = Math.min(backoff * 2, 15000);
}

function wireChannel() {
  // El receptor se instala al abrirse el canal; los archivos y textos solo se
  // aceptan cuando la sesión está verificada (igual que en versiones anteriores).
  dc.onopen = () => {
    attachReceiver(dc, {
      onFile: (f) => { if (attached) onReceived(f); },
      onProgress: (p) => { if (attached) showRecv(p); },
      onText: (txt) => { if (attached) onTextReceived(txt); },
      onControl: onControl,
    });
    enable();
  };
  dc.onclose = () => { if (attached) endSession("m.closed"); };
  enable();
}

function enable() {
  if (!verified || attached || !dc || dc.readyState !== "open") return;
  attached = true;
  clearTimeout(rejoinTimer);
  backoff = 3000;
  showPanel("transfer");
  if (mode === "trust" && dev) status("dv.connected", "ok", { name: dev.name });
  else status("st.connected", "ok");
  if (navigator.wakeLock) navigator.wakeLock.request("screen").catch(() => {});
  // Primer emparejamiento por QR: presentarse para que el PC recuerde este móvil.
  if (mode === "qr" && !savedPc) sendHello();
}

async function sendHello() {
  try {
    const links = (await getDevices()).map((d) => d.id);
    dc.send(JSON.stringify({ t: "hello", name: selfName(), links }));
  } catch (err) {
    console.error(err);
  }
}

async function onSignal(msg) {
  try {
    if (msg.type === "offer") {
      await pc.setRemoteDescription({ type: "offer", sdp: msg.sdp });
      await pc.setLocalDescription(await pc.createAnswer());
      await gatherComplete(pc);
      sig.send({ type: "answer", sdp: pc.localDescription.sdp });
      if (mode === "trust") {
        // Verificación automática: el PC envía la prueba del canal en cuanto se abra.
        status("dv.verifying", "wait");
      } else {
        $("code").textContent = await verificationCode(pc.localDescription.sdp, msg.sdp);
        showPanel("verify");
        status("st.verify", "warn");
      }
    }
  } catch (err) {
    console.error(err);
    endSession("m.error");
  }
}

// Mensajes de control que llegan por el canal de datos.
async function onControl(msg) {
  try {
    if (msg.t === "trust-offer" && mode === "qr" && attached && !savedPc) {
      // El PC ofrece el secreto compartido (solo viaja por este canal cifrado).
      if (!validSecret(msg.secret)) return;
      const id = await roomFromSecret(msg.secret);
      await saveDevice({ id, name: String(msg.name || "PC"), secret: msg.secret, at: Date.now() });
      savedPc = true;
      $("rememberNote").hidden = false;
      dc.send(JSON.stringify({ t: "trust-ok", name: selfName() }));
    } else if (msg.t === "trust-proof" && mode === "trust" && dev) {
      // Prueba de canal: solo coincide si la conexión es directa (sin intermediarios).
      const mine = await proofFor(dev.secret, pc.localDescription.sdp, pc.remoteDescription.sdp);
      if (mine && msg.proof === mine) {
        await saveDevice({ id: dev.id, name: dev.name, secret: dev.secret, at: Date.now() });
        dc.send(JSON.stringify({ t: "trust-ok", name: selfName(), proof: mine }));
        verified = true;
        enable();
      } else {
        dc.send(JSON.stringify({ t: "trust-fail" }));
        endSession("m.trustfail");
      }
    } else if (msg.t === "trust-fail") {
      endSession("m.trustfail");
    }
  } catch (err) {
    console.error(err);
  }
}

// Flujo QR (enlace con la sala aleatoria del código).
function connect() {
  mode = "qr";
  showWait(false);
  status("st.connecting");

  pc = createPeer();
  pc.ondatachannel = (e) => {
    dc = e.channel;
    wireChannel();
  };
  pc.onconnectionstatechange = () => {
    if (pc && pc.connectionState === "failed") endSession("m.connfail");
  };

  sig = openRoom({
    url: RELAY_URL,
    room: hash,
    onMessage: onSignal,
    onClose: () => {
      if (!ended && !attached && !verified) endSession("m.retry");
    },
  });
}

// Conexión con un PC recordado: sala derivada del secreto compartido.
function joinTrusted(device) {
  const my = ++conn;
  dev = device;
  mode = "trust";
  ended = false;
  verified = false;
  attached = false;
  clearTimeout(rejoinTimer);
  // Por si queda algo de un intento anterior (reintento o reconexión). Los eventos
  // de esos objetos viejos se descartan con la generación "my".
  if (sig) sig.close();
  if (dc) dc.close();
  if (pc) pc.close();
  showWait(true);
  status("st.connecting");

  const myPc = pc = createPeer();
  pc.ondatachannel = (e) => {
    if (my !== conn) return;
    dc = e.channel;
    wireChannel();
  };
  pc.onconnectionstatechange = () => {
    if (my !== conn) return;
    if (myPc.connectionState === "failed") endSession("m.connfail");
  };

  sig = openRoom({
    url: RELAY_URL,
    room: dev.id,
    onMessage: (msg) => {
      if (my === conn) onSignal(msg);
    },
    onClose: () => {
      if (my !== conn) return;
      if (!ended && !attached) scheduleRejoin();
    },
  });
}

// Lista de PCs recordados (tras "Dejar de esperar" o si no hay ninguno conectado).
async function showHome() {
  const devices = await getDevices();
  if (!devices.length) {
    showWait(false);
    status("m.wait_status");
    return;
  }
  const box = $("pcList");
  box.replaceChildren();
  for (const d of devices) {
    const row = document.createElement("div");
    row.className = "pcrow";
    const b = document.createElement("button");
    b.className = "btn primary pcname";
    const nm = document.createElement("span");
    nm.textContent = d.name || "PC";
    const sub = document.createElement("small");
    sub.textContent = new Date(d.at).toLocaleDateString();
    b.append(nm, sub);
    b.onclick = () => {
      stopWait = false;
      backoff = 3000;
      joinTrusted(d);
    };
    const del = document.createElement("button");
    del.className = "btn pcdel";
    say(del, "dv.forget");
    del.onclick = async () => {
      await removeDevice(d.id);
      showHome();
    };
    row.append(b, del);
    box.append(row);
  }
  showPanel("home");
}

function onSendProgress({ name, sent, total }) {
  const p = total ? Math.round((sent / total) * 100) : 100;
  $("sendBar").style.width = `${p}%`;
  say($("sendLabel"), "send.progress", { name, pct: p });
}

function showRecv({ name, sent, total }) {
  const p = total ? Math.round((sent / total) * 100) : 100;
  $("recvBar").style.width = `${p}%`;
  say($("recvLabel"), "recv.progress", { name, pct: p });
}

async function addRow(listId, blob, name, saveLink, folderCount = null) {
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
  li.append(await previewFor(blob, name, true), meta);
  if (saveLink) {
    const a = document.createElement("a");
    a.className = "save";
    a.href = URL.createObjectURL(blob);
    a.download = name;
    say(a, "btn.save");
    li.append(a);
  }
  $(listId).prepend(li);
}

async function onReceived({ name, blob, folder }) {
  $("recvBar").style.width = "100%";
  say($("recvLabel"), "recv.got", { name });
  await addRow("received", blob, name, true, folder);
}

// ---------- Textos cortos (enlaces, códigos 2FA, contraseñas) ----------

async function copyText(text, btn) {
  try { await navigator.clipboard.writeText(text); } catch { /* sin permiso de portapapeles */ }
  say(btn, "tx.copied");
  setTimeout(() => say(btn, "tx.copy"), 1500);
}

function snippetOf(text) {
  return String(text).replace(/\s+/g, " ").trim().slice(0, 80);
}

async function addTextRow(listId, text) {
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
  li.append(await previewFor(file, "texto.txt", true), meta);

  const acts = document.createElement("div");
  acts.className = "acts";
  const btnCopy = document.createElement("button");
  btnCopy.className = "act";
  say(btnCopy, "tx.copy");
  btnCopy.onclick = () => copyText(text, btnCopy);
  acts.append(btnCopy);
  if (URL_RE.test(text.trim())) {
    const btnOpen = document.createElement("button");
    btnOpen.className = "act";
    say(btnOpen, "tx.open");
    btnOpen.onclick = () => window.open(text.trim(), "_blank", "noopener");
    acts.append(btnOpen);
  }
  li.append(acts);
  $(listId).prepend(li);
}

async function onTextReceived(text) {
  if (!text) return;
  say($("recvLabel"), "tx.recvphone");
  await addTextRow("received", text);
}

function sendTxt() {
  const text = $("txtOut").value.trim();
  if (!text) return say($("sendLabel"), "tx.empty");
  if (!attached) return status("m.nopc", "warn");
  $("txtOut").value = "";
  sendText(dc, text);
  addTextRow("sentList", text);
  say($("sendLabel"), "tx.sent");
}

$("pick").addEventListener("change", (e) => {
  const files = [...e.target.files];
  e.target.value = "";
  if (!files.length) return;
  if (!attached) return status("m.nopc", "warn");
  const channel = dc;
  sendQueue = sendQueue
    .then(async () => {
      for (const file of files) {
        await sendFiles(channel, [file], onSendProgress);
        await addRow("sentList", file, file.name, false);
      }
      say($("sendLabel"), "send.done", { n: files.length });
    })
    .catch((err) => {
      console.error(err);
      say($("sendLabel"), "send.error");
    });
});

$("btnTxt").onclick = sendTxt;
$("txtOut").addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendTxt();
  }
});

$("confirm").onclick = () => {
  verified = true;
  enable();
  if (!attached) status("st.channel");
};
$("cancel").onclick = () => endSession("m.cancel");

$("stopwait").onclick = () => {
  stopWait = true;
  clearTimeout(rejoinTimer);
  showHome();
};

// Cerrar sesión desde el móvil (dos pasos para evitar cierres accidentales)
let logoutArmed = null;
$("logout").onclick = () => {
  if (!logoutArmed) {
    say($("logout"), "btn.logout_confirm");
    logoutArmed = setTimeout(() => { logoutArmed = null; say($("logout"), "btn.logout"); }, 4000);
    return;
  }
  clearTimeout(logoutArmed);
  endSession("m.user_closed");
};

// Arranque: enlace del QR (escaneado) → flujo QR; sin enlace, PCs recordados o escaneo.
(async function boot() {
  if (hash && !QR_ROOM) {
    showPanel("bad");
    status("m.bad_status", "err");
    return;
  }
  if (QR_ROOM) {
    connect();
    return;
  }
  const devices = await getDevices();
  if (devices.length) {
    joinTrusted(devices[0]); // el más reciente: se conecta solo
  } else {
    showWait(false);
    status("m.wait_status");
  }
})();
