/**
 * 애드스팟 API (Cloudflare Pages Functions)
 *  공개:   GET /api/content · POST /api/inquiry · GET /api/media/:file · POST /api/track
 *  관리자: POST /api/admin/login · inquiries · upload · stats · content · backup · restore · indexnow
 *  연결 필요(Cloudflare 설정): D1 데이터베이스 → DB, R2 버킷 → MEDIA, 환경 변수 ADMIN_PASSWORD(·ADMIN_SECRET)
 */
import { json, clip, int, kstDay, rand, db, kvGet, kvSet, makeToken, authed, safeEqual } from "../../lib/core.js";

const STATUSES = ["new", "contacted", "done"];
const TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov" };
const MIME = Object.fromEntries(Object.entries(TYPES).map(([k, v]) => [v, k]));
const BOT = /bot|crawl|spider|slurp|yeti|daum|headless|preview|facebookexternalhit|kakaotalk-scrap|lighthouse/i;
const INDEXNOW_KEY = "e761b84c2d45d8c12a1afe76406ea8e3";
const HOST = "xn--hy1bj5x75biyv.com";

const sanitizeCombo = (c) => {
  if (!c || typeof c !== "object") return null;
  if (c.type === "mix") {
    const items = (Array.isArray(c.items) ? c.items : []).slice(0, 6).map((it) => ({
      name: clip(it?.name, 30), count: int(it?.count, 999), price: int(it?.price, 100000000),
      subtotal: int(it?.count, 999) * int(it?.price, 100000000),
    }));
    return { type: "mix", field: clip(c.field, 40), items, total: items.reduce((a, b) => a + b.subtotal, 0) };
  }
  if (c.type === "custom") return { type: "custom", field: clip(c.field, 40), budget: clip(c.budget, 30) };
  return null;
};


/* 이미지·영상 저장소: R2(MEDIA)가 있으면 R2, 없으면 KV(MEDIA_KV) — 카드 등록 없이도 동작 */
function store(env) {
  if (env.MEDIA) return {
    kind: "r2",
    put: (k, data, type) => env.MEDIA.put(k, data, type ? { httpMetadata: { contentType: type } } : undefined),
    get: async (k) => { const o = await env.MEDIA.get(k); return o ? { data: await o.arrayBuffer(), type: o.httpMetadata && o.httpMetadata.contentType } : null; },
    head: (k) => env.MEDIA.head(k),
    del: (keys) => env.MEDIA.delete(keys),
  };
  if (env.MEDIA_KV) return {
    kind: "kv",
    put: (k, data, type) => env.MEDIA_KV.put(k, data, { metadata: { type: type || "" } }),
    get: async (k) => { const r = await env.MEDIA_KV.getWithMetadata(k, { type: "arrayBuffer" }); return r && r.value ? { data: r.value, type: r.metadata && r.metadata.type } : null; },
    head: async (k) => ((await env.MEDIA_KV.getWithMetadata(k, { type: "stream" })).value ? true : null),
    del: async (keys) => { for (const k of keys) await env.MEDIA_KV.delete(k); },
  };
  return null;
}

async function getInquiries(env, fromDay) {
  const D = await db(env);
  const q = fromDay ? D.prepare("SELECT data FROM inquiries WHERE day >= ? ORDER BY created DESC").bind(fromDay) : D.prepare("SELECT data FROM inquiries ORDER BY created DESC");
  return ((await q.all()).results || []).map((r) => { try { return JSON.parse(r.data); } catch { return null; } }).filter(Boolean);
}
async function putInquiry(env, rec) {
  await (await db(env)).prepare("INSERT INTO inquiries (id, created, day, data) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data")
    .bind(rec.id, rec.createdAt, kstDay(new Date(rec.createdAt).getTime()), JSON.stringify(rec)).run();
}

async function serveMedia(request, env, file) {
  if (!env.MEDIA && env.MEDIA_KV) return serveFromKV(request, env, file);
  if (!env.MEDIA) return new Response("storage not configured", { status: 503 });
  const head = request.method === "HEAD";
  const obj = await env.MEDIA.get("media/" + file, { range: request.headers, onlyIf: request.headers });
  if (!obj) return new Response("not found", { status: 404 });
  const headers = new Headers({ "Accept-Ranges": "bytes", "Cache-Control": "public, max-age=31536000, immutable",
    "Content-Type": (obj.httpMetadata && obj.httpMetadata.contentType) || MIME[file.split(".").pop()] || "application/octet-stream", ETag: obj.httpEtag });
  if (!("body" in obj)) return new Response(null, { status: 304, headers });
  const r = obj.range;
  if (r && request.headers.get("range")) {
    const start = "suffix" in r ? obj.size - r.suffix : r.offset;
    const len = "suffix" in r ? r.suffix : (r.length ?? obj.size - start);
    headers.set("Content-Range", `bytes ${start}-${start + len - 1}/${obj.size}`);
    headers.set("Content-Length", String(len));
    return new Response(head ? null : obj.body, { status: 206, headers });
  }
  headers.set("Content-Length", String(obj.size));
  return new Response(head ? null : obj.body, { status: 200, headers });
}


async function serveFromKV(request, env, file) {
  const got = await store(env).get("media/" + file);
  if (!got) return new Response("not found", { status: 404 });
  const buf = new Uint8Array(got.data), head = request.method === "HEAD";
  const headers = { "Content-Type": got.type || MIME[file.split(".").pop()] || "application/octet-stream", "Accept-Ranges": "bytes", "Cache-Control": "public, max-age=31536000, immutable" };
  const rm = (request.headers.get("range") || "").match(/bytes=(\d*)-(\d*)/);
  if (rm && (rm[1] || rm[2])) {
    let start = rm[1] ? parseInt(rm[1], 10) : buf.length - parseInt(rm[2], 10);
    let end = rm[1] && rm[2] ? parseInt(rm[2], 10) : buf.length - 1;
    start = Math.max(0, start); end = Math.min(buf.length - 1, end);
    if (start > end) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${buf.length}` } });
    const part = buf.subarray(start, end + 1);
    return new Response(head ? null : part, { status: 206, headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${buf.length}`, "Content-Length": String(part.length) } });
  }
  return new Response(head ? null : buf, { status: 200, headers: { ...headers, "Content-Length": String(buf.length) } });
}

async function stats(env, days) {
  const D = await db(env);
  const today = kstDay();
  const dayList = []; for (let i = days - 1; i >= 0; i--) dayList.push(kstDay(Date.now() - i * 86400000));
  const from = dayList[0];
  const all = async (sql) => (await D.prepare(sql).bind(from).all()).results || [];
  const [daily, pages, tot, src, region, kw, dev] = await Promise.all([
    all("SELECT day, COUNT(*) AS views, COUNT(DISTINCT v) AS visitors FROM events WHERE day >= ? GROUP BY day"),
    all("SELECT p, COUNT(*) AS views, COUNT(DISTINCT v) AS visitors FROM events WHERE day >= ? GROUP BY p"),
    all("SELECT COUNT(*) AS views, COUNT(DISTINCT v) AS visitors FROM events WHERE day >= ?"),
    all("SELECT s AS name, COUNT(*) AS count FROM events WHERE day >= ? AND s <> '' GROUP BY s ORDER BY count DESC LIMIT 15"),
    all("SELECT r AS name, COUNT(*) AS count FROM events WHERE day >= ? AND r <> '' GROUP BY r ORDER BY count DESC LIMIT 15"),
    all("SELECT k AS name, COUNT(*) AS count FROM events WHERE day >= ? AND k <> '' GROUP BY k ORDER BY count DESC LIMIT 15"),
    all("SELECT d AS name, COUNT(*) AS count FROM events WHERE day >= ? GROUP BY d ORDER BY count DESC"),
  ]);
  const inq = await getInquiries(env, from);
  const dmap = Object.fromEntries(daily.map((d) => [d.day, d]));
  const pmap = {};
  for (const p of pages) pmap[p.p] = { path: p.p, views: p.views, visitors: p.visitors, inquiries: 0 };
  for (const i of inq) { const p = i.page || "/"; (pmap[p] ||= { path: p, views: 0, visitors: 0, inquiries: 0 }).inquiries++; }
  return { ok: true, days, from, to: today,
    totals: { views: (tot[0] && tot[0].views) || 0, visitors: (tot[0] && tot[0].visitors) || 0, inquiries: inq.length },
    daily: dayList.map((day) => ({ day, views: (dmap[day] && dmap[day].views) || 0, visitors: (dmap[day] && dmap[day].visitors) || 0,
      inquiries: inq.filter((i) => kstDay(new Date(i.createdAt).getTime()) === day).length })),
    pages: Object.values(pmap).sort((a, b) => b.views - a.views),
    sources: src, regions: region, keywords: kw, devices: dev };
}

/* 백업 불러오기: 상담·홈페이지 수정 내용 + (선택) 예전 사이트의 이미지·영상 복사 */
async function restore(env, data, fromOrigin) {
  const out = { inquiries: 0, content: false, media: 0, mediaFailed: [] };
  if (data.content && typeof data.content === "object") { await kvSet(env, "content", data.content); out.content = true; }
  for (const rec of Array.isArray(data.inquiries) ? data.inquiries : []) {
    if (rec && rec.id && rec.createdAt) { await putInquiry(env, rec); out.inquiries++; }
  }
  const st = store(env);
  if (fromOrigin && st) {
    const files = [...new Set((JSON.stringify(data.content || {}).match(/\/api\/media\/[a-z0-9]{8,40}\.(?:jpg|png|webp|gif|mp4|webm|mov)/g) || []).map((u) => u.split("/").pop()))];
    for (const f of files) {
      if (await st.head("media/" + f)) { out.media++; continue; }
      try {
        const r = await fetch(fromOrigin.replace(/\/$/, "") + "/api/media/" + f);
        if (!r.ok) throw new Error(String(r.status));
        await st.put("media/" + f, await r.arrayBuffer(), r.headers.get("content-type") || MIME[f.split(".").pop()]);
        out.media++;
      } catch (e) { out.mediaFailed.push(f); }
    }
  }
  return out;
}

export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "");
  const method = request.method.toUpperCase();
  try {
    /* ---------- 공개 ---------- */
    if (path === "/api/content" && method === "GET") return json((await kvGet(env, "content")) || {});

    if (path === "/api/inquiry" && method === "POST") {
      const body = await request.json().catch(() => ({}));
      if (body.hp) return json({ ok: true });
      const phone = clip(body.phone, 30);
      if (!/^[0-9\-\s+()]{9,}$/.test(phone)) return json({ ok: false, error: "phone" }, 400);
      if (!body.agree) return json({ ok: false, error: "agree" }, 400);
      const ip = (request.headers.get("cf-connecting-ip") || "unknown").replace(/[^a-zA-Z0-9.:]/g, "_");
      const now = Date.now();
      const hits = ((await kvGet(env, "rl-" + ip)) || []).filter((t) => now - t < 10 * 60 * 1000);
      if (hits.length >= 5) return json({ ok: false, error: "rate" }, 429);
      hits.push(now); await kvSet(env, "rl-" + ip, hits);
      const rec = {
        id: new Date(now).toISOString().replace(/[-:.TZ]/g, "") + "-" + rand(3),
        createdAt: new Date(now).toISOString(),
        office: clip(body.office, 80), phone, field: clip(body.field, 40),
        services: Array.isArray(body.services) ? body.services.slice(0, 6).map((s) => clip(s, 30)) : [],
        message: clip(body.message, 2000), page: clip(body.page, 120),
        ad: body.ad && typeof body.ad === "object" ? { region: clip(body.ad.region, 20), src: clip(body.ad.src, 40), kw: clip(body.ad.kw, 80) } : null,
        source: body.source === "estimate" ? "estimate" : "form", combo: sanitizeCombo(body.combo), status: "new", memo: "",
      };
      await putInquiry(env, rec);
      return json({ ok: true, id: rec.id });
    }

    const mm = path.match(/^\/api\/media\/([a-z0-9]{8,40}\.(?:jpg|png|webp|gif|mp4|webm|mov))$/);
    if (mm && (method === "GET" || method === "HEAD")) return serveMedia(request, env, mm[1]);

    if (path === "/api/track" && method === "POST") {
      const ua = request.headers.get("user-agent") || "";
      if (BOT.test(ua)) return new Response(null, { status: 204 });
      const body = await request.json().catch(() => ({}));
      const p = clip(body.p, 120);
      if (!p.startsWith("/") || p.startsWith("/admin") || p.startsWith("/api")) return new Response(null, { status: 204 });
      await (await db(env)).prepare("INSERT INTO events (day, t, p, v, s, r, k, d) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
        .bind(kstDay(), Date.now(), p, clip(body.v, 24), clip(body.s, 30), clip(body.r, 20), clip(body.k, 60), /Mobi|Android|iPhone|iPad/i.test(ua) ? "m" : "pc").run();
      return new Response(null, { status: 204 });
    }

    if (path === "/api/admin/login" && method === "POST") {
      if (!env.ADMIN_PASSWORD) return json({ ok: false, error: "관리자 비밀번호가 아직 설정되지 않았습니다." }, 503);
      const body = await request.json().catch(() => ({}));
      if (!safeEqual(String(body.password || ""), env.ADMIN_PASSWORD)) {
        await new Promise((r) => setTimeout(r, 600));
        return json({ ok: false, error: "비밀번호가 맞지 않습니다." }, 401);
      }
      return json({ ok: true, token: await makeToken(env) });
    }

    /* ---------- 관리자 전용 ---------- */
    if (path.startsWith("/api/admin/")) {
      if (!(await authed(request, env))) return json({ ok: false, error: "unauthorized" }, 401);

      if (path === "/api/admin/inquiries" && method === "GET") return json({ ok: true, items: await getInquiries(env) });

      const m = path.match(/^\/api\/admin\/inquiries\/([A-Za-z0-9-]+)$/);
      if (m) {
        const D = await db(env);
        const row = await D.prepare("SELECT data FROM inquiries WHERE id = ?").bind(m[1]).first();
        if (!row) return json({ ok: false, error: "not found" }, 404);
        if (method === "DELETE") { await D.prepare("DELETE FROM inquiries WHERE id = ?").bind(m[1]).run(); return json({ ok: true }); }
        if (method === "PATCH") {
          const rec = JSON.parse(row.data); const body = await request.json().catch(() => ({}));
          if (body.status && STATUSES.includes(body.status)) rec.status = body.status;
          if (body.memo !== undefined) rec.memo = clip(body.memo, 2000);
          rec.updatedAt = new Date().toISOString();
          await putInquiry(env, rec);
          return json({ ok: true, item: rec });
        }
      }

      const up = path.match(/^\/api\/admin\/upload\/([a-z0-9]{8,40})\/(\d{1,2}|finish)$/);
      if (up) {
        const st = store(env);
        if (!st) return json({ ok: false, error: "파일 저장소가 연결되지 않았습니다. (R2: MEDIA 또는 KV: MEDIA_KV)" }, 503);
        const [, uid, part] = up;
        if (part !== "finish" && method === "PUT") {
          const body = await request.arrayBuffer();
          if (!body.byteLength || body.byteLength > 4300000) return json({ ok: false, error: "조각 크기가 올바르지 않습니다." }, 413);
          await st.put(`tmp/${uid}-${part}`, body);
          return json({ ok: true });
        }
        if (part === "finish" && method === "POST") {
          const body = await request.json().catch(() => ({}));
          const type = String(body.type || ""); const ext = TYPES[type]; const parts = int(body.parts, 12);
          if (!ext || !parts) return json({ ok: false, error: "지원하지 않는 파일 형식입니다." }, 400);
          const chunks = []; let total = 0;
          for (let i = 0; i < parts; i++) {
            const o = await st.get(`tmp/${uid}-${i}`);
            if (!o) return json({ ok: false, error: "업로드 조각이 빠졌습니다. 다시 시도해 주세요." }, 400);
            const b = new Uint8Array(o.data); chunks.push(b); total += b.length;
          }
          const limit = type.startsWith("video/") ? 25 * 1024 * 1024 : 10 * 1024 * 1024;
          if (total > limit) return json({ ok: false, error: "파일이 너무 큽니다." }, 413);
          const all = new Uint8Array(total); let off = 0; for (const c of chunks) { all.set(c, off); off += c.length; }
          const file = `${uid}.${ext}`;
          await st.put("media/" + file, all, type);
          await st.del([...Array(parts).keys()].map((i) => `tmp/${uid}-${i}`));
          return json({ ok: true, url: "/api/media/" + file, type, size: total });
        }
      }

      if (path === "/api/admin/stats" && method === "GET") return json(await stats(env, Math.min(90, Math.max(1, +(url.searchParams.get("days") || 7)))));

      if (path === "/api/admin/content") {
        if (method === "GET") return json({ ok: true, content: (await kvGet(env, "content")) || {} });
        if (method === "PUT") {
          const text = await request.text();
          if (text.length > 400000) return json({ ok: false, error: "too large" }, 413);
          let content; try { content = JSON.parse(text).content; } catch { return json({ ok: false, error: "bad json" }, 400); }
          if (!content || typeof content !== "object" || Array.isArray(content)) return json({ ok: false, error: "bad content" }, 400);
          content.updatedAt = new Date().toISOString();
          await kvSet(env, "content", content);
          return json({ ok: true, updatedAt: content.updatedAt });
        }
      }

      if (path === "/api/admin/backup" && method === "GET") {
        return json({ ok: true, exportedAt: new Date().toISOString(), content: (await kvGet(env, "content")) || {}, inquiries: await getInquiries(env) });
      }
      if (path === "/api/admin/restore" && method === "POST") {
        const body = await request.json().catch(() => null);
        if (!body || typeof body !== "object") return json({ ok: false, error: "백업 파일을 읽을 수 없습니다." }, 400);
        const from = /^https:\/\/[a-z0-9.-]+$/i.test(String(body.fromOrigin || "")) ? body.fromOrigin : "";
        return json({ ok: true, result: await restore(env, body.data || body, from) });
      }

      if (path === "/api/admin/indexnow" && method === "POST") {
        const urls = ["/", "/lawyer-marketing/", "/law-firm-marketing/", "/legal-marketing/", "/regions/", "/llms.txt",
          ...["seoul", "busan", "daegu", "incheon", "daejeon", "ulsan", "sejong", "gyeonggi", "gangwon", "chungbuk", "chungnam", "jeonbuk", "gwangju-jeonnam", "gyeongbuk", "gyeongnam", "jeju"].map((r) => `/regions/${r}/`)]
          .map((p) => `https://${HOST}${p}`);
        const data = JSON.stringify({ host: HOST, key: INDEXNOW_KEY, keyLocation: `https://${HOST}/${INDEXNOW_KEY}.txt`, urlList: urls });
        const res = await Promise.allSettled(["https://searchadvisor.naver.com/indexnow", "https://api.indexnow.org/indexnow"].map((u) =>
          fetch(u, { method: "POST", headers: { "Content-Type": "application/json; charset=utf-8" }, body: data }).then((r) => ({ target: u, status: r.status }))));
        return json({ ok: true, results: res.map((r) => (r.status === "fulfilled" ? r.value : { error: String(r.reason) })), count: urls.length });
      }
    }
    return json({ ok: false, error: "not found" }, 404);
  } catch (err) {
    console.error(err);
    return json({ ok: false, error: "server", detail: String(err && err.message || err) }, 500);
  }
}
