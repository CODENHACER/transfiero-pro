// Dispositivos recordados (TRANSFIERO Pro 1.4).
// Tras emparejar por primera vez con el código QR, el PC y el móvil comparten un
// secreto aleatorio que viaja SOLO por el canal cifrado (RTCDataChannel), nunca
// por el servidor de emparejamiento.
//   - Sala de reencuentro: derivada del secreto con HMAC. El servidor solo ve un
//     identificador sin significado; las salas aleatorias del QR siguen igual.
//   - Verificación automática: la prueba es un HMAC del secreto sobre las huellas
//     DTLS de ESTA conexión. Solo coincide si ambos extremos hablan directamente:
//     un intermediario presente en la sala mostraría huellas distintas a cada
//     lado y la prueba no cuadraría (mismo principio que el código de 6 cifras,
//     pero comparado por los propios dispositivos).

const ROOM_SALT = "TRANSFIERO-TRUST-ROOM-v1";
const PROOF_SALT = "TRANSFIERO-TRUST-PROOF-v1";

function b64u(bytes) {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function unb64u(str) {
  let b64 = String(str).replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) b64 += "=";
  const bin = atob(b64);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

// Secreto de 32 bytes (43 caracteres base64url).
export function makeSecret() {
  return b64u(crypto.getRandomValues(new Uint8Array(32)));
}

export function validSecret(secret) {
  return typeof secret === "string" && /^[A-Za-z0-9_-]{40,60}$/.test(secret);
}

async function hmacKey(secret) {
  return crypto.subtle.importKey("raw", unb64u(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
}

// Sala de reencuentro: "k" + 24 caracteres (patrón admitido por el relay: 20-64).
export async function roomFromSecret(secret) {
  const key = await hmacKey(secret);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(ROOM_SALT)));
  return "k" + b64u(mac.subarray(0, 18));
}

// Prueba de canal para la verificación automática de dispositivos recordados.
export async function proofFor(secret, localSdp, remoteSdp) {
  const fp = (sdp) => (String(sdp).match(/a=fingerprint:sha-256 ([0-9A-F:]+)/i) || [])[1] || "";
  const key = await hmacKey(secret);
  const data = new TextEncoder().encode([PROOF_SALT, fp(localSdp), fp(remoteSdp)].sort().join("|"));
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, data));
  return b64u(mac);
}

// Nombre descriptivo del dispositivo actual; se envía en el saludo para mostrarlo
// en la lista del otro extremo ("Pixel 7", "iPhone", "Windows · Chrome"…).
export function selfName() {
  const ua = navigator.userAgent;
  const m = /Android[^;]*;\s*([^;)]+?)(?:\s+Build|\))/i.exec(ua);
  if (m && m[1].trim()) return m[1].trim().slice(0, 40);
  if (/iPad/i.test(ua)) return "iPad";
  if (/iPhone|iPod/i.test(ua)) return "iPhone";
  const brands = navigator.userAgentData?.brands || [];
  const raw = brands.find((b) => !/not.?a.?brand/i.test(b.brand))?.brand || "";
  const short = raw.replace(/^(Google|Microsoft)\s+/i, "").slice(0, 20);
  const plat = navigator.userAgentData?.platform
    || (/Windows/i.test(ua) ? "Windows" : /Mac/i.test(ua) ? "macOS" : /Linux/i.test(ua) ? "Linux" : "PC");
  return short ? `${plat} · ${short}` : plat;
}
