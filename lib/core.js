/* 애드스팟 서버 공통 기능 (Cloudflare Pages Functions) */
export const json = (data, status = 200, extra = {}) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...extra } });
export const clip = (v, n) => String(v ?? "").trim().slice(0, n);
export const int = (v, max) => Math.max(0, Math.min(max, Math.round(Number(v) || 0)));
export const kstDay = (ms = Date.now()) => new Date(ms + 9 * 3600 * 1000).toISOString().slice(0, 10);
export const rand = (n = 3) => [...crypto.getRandomValues(new Uint8Array(n))].map((b) => b.toString(16).padStart(2, "0")).join("");

/* 데이터베이스(D1) 준비: 처음 요청 때 표가 없으면 만들어 둠 */
let ready = false;
export async function db(env) {
  if (!env.DB) throw new Error("D1 데이터베이스(DB)가 연결되지 않았습니다.");
  if (!ready) {
    await env.DB.batch([
      env.DB.prepare("CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v TEXT, t INTEGER)"),
      env.DB.prepare("CREATE TABLE IF NOT EXISTS inquiries (id TEXT PRIMARY KEY, created TEXT, day TEXT, data TEXT)"),
      env.DB.prepare("CREATE INDEX IF NOT EXISTS inquiries_day ON inquiries(day)"),
      env.DB.prepare("CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, day TEXT, t INTEGER, p TEXT, v TEXT, s TEXT, r TEXT, k TEXT, d TEXT)"),
      env.DB.prepare("CREATE INDEX IF NOT EXISTS events_day ON events(day)"),
    ]);
    ready = true;
  }
  return env.DB;
}
export async function kvGet(env, k) {
  const row = await (await db(env)).prepare("SELECT v FROM kv WHERE k = ?").bind(k).first();
  if (!row) return null;
  try { return JSON.parse(row.v); } catch { return null; }
}
export async function kvSet(env, k, v) {
  await (await db(env)).prepare("INSERT INTO kv (k, v, t) VALUES (?, ?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v, t = excluded.t")
    .bind(k, JSON.stringify(v), Date.now()).run();
}

/* 관리자 로그인 토큰 (HMAC 서명, 12시간) */
const enc = new TextEncoder();
const b64url = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const b64urlStr = (s) => b64url(enc.encode(s));
const fromB64url = (s) => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0)));
async function hmac(secret, data) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64url(await crypto.subtle.sign("HMAC", key, enc.encode(data)));
}
export const safeEqual = (a, b) => {
  a = String(a); b = String(b);
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
};
const secretOf = (env) => env.ADMIN_SECRET || env.ADMIN_PASSWORD || "";
export async function makeToken(env) {
  const payload = b64urlStr(JSON.stringify({ exp: Date.now() + 12 * 3600 * 1000 }));
  return payload + "." + (await hmac(secretOf(env), payload));
}
export async function authed(request, env) {
  if (!env.ADMIN_PASSWORD) return false;
  const h = request.headers.get("authorization") || "";
  const [payload, sig] = (h.startsWith("Bearer ") ? h.slice(7) : "").split(".");
  if (!payload || !sig) return false;
  if (!safeEqual(await hmac(secretOf(env), payload), sig)) return false;
  try { return JSON.parse(fromB64url(payload)).exp > Date.now(); } catch { return false; }
}
