import { RELAY_URL, PHONE_URL } from "./shared/config.js";
import { createPeer, gatherComplete, verificationCode } from "./shared/peer.js";
import { openRoom } from "./shared/signal.js";
import { sendFiles, attachReceiver, formatBytes } from "./shared/transfer.js";
import { say, setLang, getLang, resolveLang, applyI18n, t } from "./shared/i18n.js";
import { getSettings, saveSettings, getHistory, addHistory, clearHistory } from "./shared/store.js";
import { folderSupported, loadFolder, chooseFolder, resetFolder, hasPermission, requestPermission, saveToFolder } from "./shared/folder.js";
import { previewFor, categoryLabel } from "./shared/preview.js";
import { collectFromInput, collectFromEntry, zipEntries } from "./shared/pack.js";

const BIG_FOLDER = 1.5 * 1024 ** 3; // a partir de 1,5 GB se avisa de que la compresión puede ser pesada

const $ = (id) => document.getElementById(id);
let s = {};                 // sesión activa
let sendQueue = Promise.resolve();
let cfg = {};               // ajustes actuales
let prevPanel = "pair";     // para volver desde Ajustes
let dirHandle = null;       // carpeta de descargas elegida (o null = descargas del navegador)

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
  co