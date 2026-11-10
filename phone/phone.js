import { RELAY_URL } from "../shared/config.js";
import { createPeer, gatherComplete, verificationCode } from "../shared/peer.js";
import { openRoom } from "../shared/signal.js";
import { sendFiles, attachReceiver, formatBytes } from "../shared/transfer.js";
import { say, setLang, resolveLang, applyI18n, t } from "../shared/i18n.js";
import { previewFor, categoryLabel } from "../shared/preview.js";

const $ = (id) => document.getElementById(id);
const room = decodeURIComponent(location.hash.slice(1));
let pc = null, dc = null, sig = null;
let verified = false, attached = false, ended = false;
let sendQueue = Promise.resolve();

// Idioma según el navegador del móvil (catalán, español o inglés).
setLang(resolveLang(null));
applyI18n();

function showPanel(id) {
  document.querySelectorAll("[data-panel]").forEach((p) => (p.hidden = p.dataset.panel !== id));
}

function status(key, kind = "") {
  const el = $("status");
  say(el, key);
  el.className = `pill ${kind}`;
}

function endSession(messageKey) {
  if (ended) return;
  ended = true;
  if (sig) sig.close();
  if (dc) dc.close();
  if (pc) pc.close();
  sig = dc = pc = null;
  say($("endMsg"), messageKey);
  showPanel("end");
  status("st.ended", "err");
}

function enable() {
  if (!verified || attached || !dc || dc.readyState !== "open") return;
  attached = true;
  attachReceiver(dc, { onFile: onReceived, onProgress: showRecv });
  showPanel("transfer");
  status("st.connected", "ok");
  if (navigator.wakeLock) navigator.wakeLock.request("screen").catch(() => {});
}

async function onSignal(msg) {
  try {
    if (msg.type === "offer") {
      await pc.setRemoteDescription({ type: "offer", sdp: msg.sdp });
      await pc.setLocalDescription(await pc.createAnswer());
      await gatherComplete(pc);
      sig.send({ type: "answer", sdp: pc.localDescription.sdp });
      $("code").textContent = await verificationCode(pc.localDescription.sdp, msg.sdp);
      showPanel("verify");
      status("st.verify", "warn");
    }
  } catch (err) {
    console.error(err);
    endSession("m.error");
  }
}

function connect() {
  showPanel("wait");
  status("st.connecting");

  pc = createPeer();
  pc.ondatachannel = (e) => {
    dc = e.channel;
    dc.onopen = enable;
    dc.onclose = () => { if (attached) endSession("m.closed"); };
    enable();
  };
  pc.onconnectionstatechange = () => {
    if (pc && pc.connectionState === "failed") endSession("m.connfail");
  };

  sig = openRoom({
    url: RELAY_URL,
    room,
    onMessage: onSignal,
    onClose: () => {
      if (!ended && !attached && !verified) endSession("m.retry");
    },
  });
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

$("confirm").onclick = () => {
  verified = true;
  enable();
  if (!attached) status("st.channel");
};
$("cancel").onclick = () => endSession("m.cancel");

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

if (!/^[A-Za-z0-9_-]{20,64}$/.test(room)) {
  showPanel("bad");
  status("m.bad_status", "err");
} else {
  connect();
}
