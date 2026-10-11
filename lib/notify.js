/* 상담 문의 문자 알림 (솔라피 SOLAPI)
   Cloudflare 환경 변수: SOLAPI_API_KEY · SOLAPI_API_SECRET · SMS_FROM(등록한 발신번호) · SMS_TO(받는 번호, 여러 개는 쉼표) */
import { kvSet, kvGet } from "./core.js";

const digits = (s) => String(s || "").replace(/[^0-9]/g, "");
export function smsReady(env) {
  return !!(env.SOLAPI_API_KEY && env.SOLAPI_API_SECRET && digits(env.SMS_FROM) && String(env.SMS_TO || "").split(",").map(digits).filter(Boolean).length);
}
async function hmacHex(secret, msg) {
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(msg));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
export async function sendSMS(env, text, subject = "[애드스팟] 새 상담 문의") {
  if (!smsReady(env)) return { ok: false, error: "문자 알림 설정(환경 변수)이 아직 없습니다." };
  const from = digits(env.SMS_FROM), tos = [...new Set(String(env.SMS_TO).split(",").map(digits).filter((n) => n.length >= 9))];
  const results = [];
  for (const to of tos) {
    const date = new Date().toISOString(), salt = crypto.randomUUID().replace(/-/g, "");
    const auth = `HMAC-SHA256 apiKey=${env.SOLAPI_API_KEY}, date=${date}, salt=${salt}, signature=${await hmacHex(env.SOLAPI_API_SECRET, date + salt)}`;
    try {
      const r = await fetch("https://api.solapi.com/messages/v4/send", {
        method: "POST", headers: { Authorization: auth, "Content-Type": "application/json" },
        body: JSON.stringify({ message: { to, from, type: "LMS", subject: subject.slice(0, 40), text: text.slice(0, 1900) } }),
      });
      const j = await r.json().catch(() => ({}));
      results.push({ to: to.slice(0, 3) + "****" + to.slice(-4), status: r.status, ok: r.ok, msg: j.errorMessage || j.statusMessage || "" });
    } catch (e) { results.push({ to: to.slice(-4), ok: false, msg: String(e && e.message || e) }); }
  }
  const ok = results.length > 0 && results.every((x) => x.ok);
  return { ok, results };
}
const PAGE_NAMES = { "/": "메인", "/lawyer-marketing/": "변호사마케팅 안내", "/law-firm-marketing/": "법무법인마케팅 안내", "/legal-marketing/": "법률마케팅 안내" };
export function inquiryText(rec, host) {
  const page = rec.page || "/", pname = PAGE_NAMES[page] || (/^\/regions\/[a-z-]+\/$/.test(page) ? "지역 페이지 " + page : page);
  const src = rec.ad ? [rec.ad.src, rec.ad.region ? rec.ad.region + " 지역" : "", rec.ad.kw ? "검색어 " + rec.ad.kw : ""].filter(Boolean).join(" · ") : (rec.entry || "");
  const lines = [
    "[애드스팟] 새 상담 문의",
    "로펌: " + (rec.office || "(미입력)"),
    "연락처: " + rec.phone,
    rec.field ? "분야: " + rec.field : "",
    rec.services && rec.services.length ? "서비스: " + rec.services.join(", ") : "",
    rec.source === "estimate" ? "구분: 견적 계산기로 신청" : "",
    src ? "경로: " + src : "",
    "페이지: " + pname,
    rec.message ? "문의: " + rec.message.replace(/\s+/g, " ").slice(0, 400) : "",
    "관리자: https://" + host + "/admin/",
  ];
  return lines.filter(Boolean).join("\n");
}

/* 이메일 알림 (Resend) — 환경 변수: RESEND_API_KEY · MAIL_TO(받는 메일, 여러 개는 쉼표) · MAIL_FROM(선택, 도메인 인증 후) */
export function mailReady(env) { return !!(env.RESEND_API_KEY && String(env.MAIL_TO || "").includes("@")); }
const escH = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
export async function sendMail(env, subject, text) {
  if (!mailReady(env)) return { ok: false, error: "이메일 알림 설정(환경 변수)이 아직 없습니다." };
  const to = String(env.MAIL_TO).split(",").map((s) => s.trim()).filter((s) => /@/.test(s));
  const from = env.MAIL_FROM || "애드스팟 알림 <onboarding@resend.dev>";
  const html = '<div style="font-family:sans-serif;font-size:15px;line-height:1.7;color:#16191e">' + text.split("\n").map((l, i) => i === 0 ? `<h2 style="margin:0 0 12px;font-size:18px">${escH(l)}</h2>` : `<div>${escH(l).replace(/(https:\/\/\S+)/, '<a href="$1">$1</a>')}</div>`).join("") + "</div>";
  try {
    const r = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: "Bearer " + env.RESEND_API_KEY, "Content-Type": "application/json" }, body: JSON.stringify({ from, to, subject, text, html }) });
    const j = await r.json().catch(() => ({}));
    return { ok: r.ok, results: [{ to: to.join(", "), status: r.status, ok: r.ok, msg: j.message || "" }] };
  } catch (e) { return { ok: false, results: [{ ok: false, msg: String(e && e.message || e) }] }; }
}
/* 설정된 모든 방법으로 보냄 */
export async function notifyAll(env, text, subject, kakaoText, host) {
  const out = {};
  if (env.KAKAO_REST_KEY && (await kakaoAccounts(env)).length) out.kakao = await sendKakao(env, kakaoText || text, host).catch((e) => ({ ok: false, error: String(e) }));
  if (smsReady(env)) out.sms = await sendSMS(env, text, subject).catch((e) => ({ ok: false, error: String(e) }));
  if (mailReady(env)) out.mail = await sendMail(env, subject, text).catch((e) => ({ ok: false, error: String(e) }));
  try { await kvSet(env, "notify-last", { at: new Date().toISOString(), ...out }); } catch (e) {}
  return out;
}

/* 카카오톡 '나에게 보내기' — 환경 변수: KAKAO_REST_KEY (REST API 키), KAKAO_CLIENT_SECRET(사용하는 경우만)
   관리자에서 각자 카카오 계정을 연결하면, 연결한 사람의 '나와의 채팅'으로 알림이 감 */
const KAUTH = "https://kauth.kakao.com", KAPI = "https://kapi.kakao.com";
const form = (o) => Object.entries(o).filter(([, v]) => v != null && v !== "").map(([k, v]) => encodeURIComponent(k) + "=" + encodeURIComponent(v)).join("&");
const FORM_H = { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" };
export const kakaoRedirect = (host) => `https://${host}/api/kakao/callback`;
export async function kakaoAccounts(env) { return ((await kvGet(env, "kakao-accounts")) || []).filter((a) => a && a.refresh); }
async function saveAccounts(env, list) { await kvSet(env, "kakao-accounts", list); }
export async function kakaoReady(env) { return !!env.KAKAO_REST_KEY && (await kakaoAccounts(env)).length > 0; }
export function kakaoAuthUrl(env, host, state) {
  return `${KAUTH}/oauth/authorize?` + form({ client_id: env.KAKAO_REST_KEY, redirect_uri: kakaoRedirect(host), response_type: "code", scope: "talk_message", state });
}
export async function kakaoConnect(env, host, code) {
  const r = await fetch(KAUTH + "/oauth/token", { method: "POST", headers: FORM_H, body: form({ grant_type: "authorization_code", client_id: env.KAKAO_REST_KEY, client_secret: env.KAKAO_CLIENT_SECRET, redirect_uri: kakaoRedirect(host), code }) });
  const t = await r.json().catch(() => ({}));
  if (!r.ok || !t.access_token) throw new Error(t.error_description || t.error || "카카오 인증에 실패했습니다.");
  const me = await fetch(KAPI + "/v2/user/me", { headers: { Authorization: "Bearer " + t.access_token } }).then((x) => x.json()).catch(() => ({}));
  const id = String(me.id || Date.now()), name = (me.properties && me.properties.nickname) || (me.kakao_account && me.kakao_account.profile && me.kakao_account.profile.nickname) || "카카오 계정";
  const list = (await kakaoAccounts(env)).filter((a) => a.id !== id);
  list.push({ id, name, refresh: t.refresh_token, rexp: Date.now() + (t.refresh_token_expires_in || 5184000) * 1000, at: Date.now(), checked: Date.now() });
  await saveAccounts(env, list);
  return { id, name };
}
async function accessFor(env, a) {   // 쓸 때마다 새 접근 토큰을 받고, 갱신된 장기 토큰이 오면 저장
  const r = await fetch(KAUTH + "/oauth/token", { method: "POST", headers: FORM_H, body: form({ grant_type: "refresh_token", client_id: env.KAKAO_REST_KEY, client_secret: env.KAKAO_CLIENT_SECRET, refresh_token: a.refresh }) });
  const t = await r.json().catch(() => ({}));
  if (!r.ok || !t.access_token) { const e = new Error(t.error_description || t.error || "토큰 갱신 실패"); e.dead = /invalid_grant|expired/i.test(JSON.stringify(t)); throw e; }
  if (t.refresh_token) { a.refresh = t.refresh_token; a.rexp = Date.now() + (t.refresh_token_expires_in || 5184000) * 1000; }
  a.checked = Date.now();
  return t.access_token;
}
export async function kakaoKeepAlive(env) {   // 관리자를 열 때 20일 넘게 확인 안 한 연결은 미리 갱신
  const list = await kakaoAccounts(env); let changed = false;
  for (const a of list) if (Date.now() - (a.checked || 0) > 20 * 86400000) { try { await accessFor(env, a); changed = true; } catch (e) { if (e.dead) { a.dead = true; changed = true; } } }
  if (changed) await saveAccounts(env, list);
  return list;
}
export async function sendKakao(env, text, host) {
  const list = await kakaoAccounts(env), results = [];
  const tpl = JSON.stringify({ object_type: "text", text: text.length > 200 ? text.slice(0, 197) + "…" : text, link: { web_url: `https://${host}/admin/`, mobile_web_url: `https://${host}/admin/` }, button_title: "관리자에서 보기" });
  for (const a of list) {
    try {
      const at = await accessFor(env, a);
      const r = await fetch(KAPI + "/v2/api/talk/memo/default/send", { method: "POST", headers: { ...FORM_H, Authorization: "Bearer " + at }, body: form({ template_object: tpl }) });
      const j = await r.json().catch(() => ({}));
      a.dead = false;
      results.push({ to: a.name, ok: r.ok && j.result_code === 0, msg: j.msg || "" });
    } catch (e) { if (e.dead) a.dead = true; results.push({ to: a.name, ok: false, msg: e.dead ? "연결이 만료되어 다시 연결이 필요합니다" : e.message }); }
  }
  await saveAccounts(env, list);
  return { ok: results.length > 0 && results.every((x) => x.ok), results };
}
/* 카톡은 200자 제한이 있어 핵심만 */
export function inquiryKakaoText(rec) {
  const src = rec.ad ? [rec.ad.src, rec.ad.kw ? "검색어 " + rec.ad.kw : ""].filter(Boolean).join(" · ") : (rec.entry || "");
  return ["[애드스팟] 새 상담 문의", "로펌: " + (rec.office || "(미입력)"), "연락처: " + rec.phone, rec.field ? "분야: " + rec.field : "", src ? "경로: " + src : "", rec.message ? "문의: " + rec.message.replace(/\s+/g, " ").slice(0, 60) : ""].filter(Boolean).join("\n");
}
