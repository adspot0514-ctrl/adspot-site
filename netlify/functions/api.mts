/**
 * ADSPOT 홈페이지 API (Netlify Function)
 *  - GET    /api/content                 공개: 관리자에서 저장한 홈페이지 콘텐츠
 *  - POST   /api/inquiry                 공개: 상담 신청 접수
 *  - POST   /api/admin/login             관리자 로그인 → 토큰 발급
 *  - GET    /api/admin/inquiries         상담문의 목록
 *  - PATCH  /api/admin/inquiries/:id     상태·메모 수정
 *  - DELETE /api/admin/inquiries/:id     삭제
 *  - GET    /api/admin/content           콘텐츠 불러오기
 *  - PUT    /api/admin/content           콘텐츠 저장 (홈페이지에 바로 반영)
 * 환경 변수: ADMIN_PASSWORD (필수), ADMIN_SECRET (선택, 토큰 서명용)
 */
import type { Context, Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";

const json = (data: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...extra },
  });

const STATUSES = ["new", "contacted", "done"] as const;

export default async (req: Request, context: Context) => {
  const url = new URL(req.url);
  const path = url.pathname.replace(/\/+$/, "");
  const method = req.method.toUpperCase();

  // 운영(production) 데이터와 미리보기 데이터를 분리
  const isProd = context.deploy?.context === "production";
  const prefix = isProd ? "" : "preview-";
  const contentStore = () => getStore({ name: prefix + "site-content", consistency: "strong" });
  const inquiryStore = () => getStore({ name: prefix + "inquiries", consistency: "strong" });
  const mediaStore = () => getStore({ name: prefix + "media", consistency: "strong" });
  const tmpStore = () => getStore({ name: prefix + "upload-tmp", consistency: "strong" });

  const password = Netlify.env.get("ADMIN_PASSWORD") || "";
  const secret = Netlify.env.get("ADMIN_SECRET") || password;

  const sign = (payload: string) => createHmac("sha256", secret).update(payload).digest("base64url");
  const makeToken = () => {
    const payload = Buffer.from(JSON.stringify({ exp: Date.now() + 12 * 3600 * 1000 })).toString("base64url");
    return payload + "." + sign(payload);
  };
  const authed = () => {
    if (!password) return false;
    const h = req.headers.get("authorization") || "";
    const token = h.startsWith("Bearer ") ? h.slice(7) : "";
    const [payload, sig] = token.split(".");
    if (!payload || !sig) return false;
    const expected = sign(payload);
    if (expected.length !== sig.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return false;
    try { return JSON.parse(Buffer.from(payload, "base64url").toString()).exp > Date.now(); } catch { return false; }
  };
  const clip = (v: unknown, n: number) => String(v ?? "").trim().slice(0, n);
  const int = (v: unknown, max: number) => Math.max(0, Math.min(max, Math.round(Number(v) || 0)));
  const sanitizeCombo = (c: any) => {
    if (!c || typeof c !== "object") return null;
    if (c.type === "mix") {
      const items = (Array.isArray(c.items) ? c.items : []).slice(0, 6).map((it: any) => ({
        name: clip(it?.name, 30), count: int(it?.count, 999), price: int(it?.price, 100_000_000),
        subtotal: int(it?.count, 999) * int(it?.price, 100_000_000),
      }));
      return { type: "mix", field: clip(c.field, 40), items, total: items.reduce((a: number, b: any) => a + b.subtotal, 0) };
    }
    if (c.type === "custom") return { type: "custom", field: clip(c.field, 40), budget: clip(c.budget, 30) };
    return null;
  };

  try {
    /* ---------- 공개: 콘텐츠 ---------- */
    if (path === "/api/content" && method === "GET") {
      const data = (await contentStore().get("content", { type: "json" })) || {};
      return json(data);
    }

    /* ---------- 공개: 상담 신청 ---------- */
    if (path === "/api/inquiry" && method === "POST") {
      const body = await req.json().catch(() => ({} as any));
      if (body.hp) return json({ ok: true });                       // 스팸 봇
      const phone = clip(body.phone, 30);
      if (!/^[0-9\-\s+()]{9,}$/.test(phone)) return json({ ok: false, error: "phone" }, 400);
      if (!body.agree) return json({ ok: false, error: "agree" }, 400);

      // 같은 IP에서 10분에 5건까지
      const ip = context.ip || "unknown";
      const rl = getStore({ name: prefix + "rate-limit" });
      const key = "ip-" + ip.replace(/[^a-zA-Z0-9.:]/g, "_");
      const now = Date.now();
      const hits: number[] = ((await rl.get(key, { type: "json" })) || []).filter((t: number) => now - t < 10 * 60 * 1000);
      if (hits.length >= 5) return json({ ok: false, error: "rate" }, 429);
      hits.push(now); await rl.setJSON(key, hits);

      const id = new Date(now).toISOString().replace(/[-:.TZ]/g, "") + "-" + randomBytes(3).toString("hex");
      const record = {
        id,
        createdAt: new Date(now).toISOString(),
        office: clip(body.office, 80),
        phone,
        field: clip(body.field, 40),
        services: Array.isArray(body.services) ? body.services.slice(0, 6).map((s: unknown) => clip(s, 30)) : [],
        message: clip(body.message, 2000),
        page: clip(body.page, 120),
        ad: body.ad && typeof body.ad === "object"
          ? { region: clip(body.ad.region, 20), src: clip(body.ad.src, 40), kw: clip(body.ad.kw, 80) }
          : null,
        source: body.source === "estimate" ? "estimate" : "form",
        combo: sanitizeCombo(body.combo),
        status: "new",
        memo: "",
      };
      await inquiryStore().setJSON(id, record);
      return json({ ok: true, id });
    }

    /* ---------- 공개: 관리자에서 올린 이미지·영상 ---------- */
    const mm = path.match(/^\/api\/media\/([a-z0-9]{8,40}\.(?:jpg|png|webp|gif|mp4|webm|mov))$/);
    if (mm && (method === "GET" || method === "HEAD")) {
      const got: any = await mediaStore().getWithMetadata(mm[1], { type: "arrayBuffer" });
      if (!got || !got.data) return new Response("not found", { status: 404 });
      const buf = new Uint8Array(got.data as ArrayBuffer);
      const type = String(got.metadata?.type || "application/octet-stream");
      const base: Record<string, string> = {
        "Content-Type": type,
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=31536000, immutable",
      };
      const range = req.headers.get("range");
      const rm = range && range.match(/bytes=(\d*)-(\d*)/);
      if (rm && (rm[1] || rm[2])) {
        // 아이폰 사파리는 영상을 구간(Range)으로 요청함
        let start = rm[1] ? parseInt(rm[1], 10) : buf.length - parseInt(rm[2], 10);
        let end = rm[1] && rm[2] ? parseInt(rm[2], 10) : buf.length - 1;
        start = Math.max(0, start); end = Math.min(buf.length - 1, end, start + 4 * 1024 * 1024 - 1);   // 한 번에 최대 4MB (함수 응답 한도 6MB)
        if (start > end) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${buf.length}` } });
        const part = buf.subarray(start, end + 1);
        return new Response(method === "HEAD" ? null : part, { status: 206, headers: { ...base, "Content-Range": `bytes ${start}-${end}/${buf.length}`, "Content-Length": String(part.length) } });
      }
      if (buf.length > 5_500_000 && method !== "HEAD") {
        // 큰 파일은 첫 4MB만 보내고 나머지는 브라우저가 이어서 요청
        const part = buf.subarray(0, 4 * 1024 * 1024);
        return new Response(part, { status: 206, headers: { ...base, "Content-Range": `bytes 0-${part.length - 1}/${buf.length}`, "Content-Length": String(part.length) } });
      }
      return new Response(method === "HEAD" ? null : buf, { status: 200, headers: { ...base, "Content-Length": String(buf.length), "Netlify-CDN-Cache-Control": "public, max-age=31536000, immutable" } });
    }


    /* ---------- 공개: 페이지 방문 기록 (통계용, 개인정보 없음) ---------- */
    if (path === "/api/track" && method === "POST") {
      const ua = req.headers.get("user-agent") || "";
      if (/bot|crawl|spider|slurp|yeti|daum|headless|preview|facebookexternalhit|kakaotalk-scrap|lighthouse/i.test(ua)) return new Response(null, { status: 204 });
      const body = await req.json().catch(() => ({} as any));
      const p = clip(body.p, 120);
      if (!p.startsWith("/") || p.startsWith("/admin") || p.startsWith("/api")) return new Response(null, { status: 204 });
      const now = new Date(Date.now() + 9 * 3600 * 1000);            // 한국 시간 기준 날짜
      const day = now.toISOString().slice(0, 10);
      const ev = { t: Date.now(), p, v: clip(body.v, 24), s: clip(body.s, 30), r: clip(body.r, 20), k: clip(body.k, 60),
                   d: /Mobi|Android|iPhone|iPad/i.test(ua) ? "m" : "pc" };
      await getStore({ name: prefix + "stats" }).setJSON(`ev/${day}/${ev.t}-${randomBytes(3).toString("hex")}`, ev);
      return new Response(null, { status: 204 });
    }

    /* ---------- 관리자 로그인 ---------- */
    if (path === "/api/admin/login" && method === "POST") {
      if (!password) return json({ ok: false, error: "관리자 비밀번호가 아직 설정되지 않았습니다." }, 503);
      const body = await req.json().catch(() => ({} as any));
      const given = Buffer.from(String(body.password || ""));
      const real = Buffer.from(password);
      const ok = given.length === real.length && timingSafeEqual(given, real);
      if (!ok) { await new Promise((r) => setTimeout(r, 600)); return json({ ok: false, error: "비밀번호가 맞지 않습니다." }, 401); }
      return json({ ok: true, token: makeToken() });
    }

    /* ---------- 이하 관리자 전용 ---------- */
    if (path.startsWith("/api/admin/")) {
      if (!authed()) return json({ ok: false, error: "unauthorized" }, 401);

      if (path === "/api/admin/inquiries" && method === "GET") {
        const store = inquiryStore();
        const { blobs } = await store.list();
        const items = (await Promise.all(blobs.map((b) => store.get(b.key, { type: "json" })))).filter(Boolean);
        items.sort((a: any, b: any) => (a.createdAt < b.createdAt ? 1 : -1));
        return json({ ok: true, items });
      }

      const m = path.match(/^\/api\/admin\/inquiries\/([A-Za-z0-9-]+)$/);
      if (m) {
        const store = inquiryStore();
        const rec: any = await store.get(m[1], { type: "json" });
        if (!rec) return json({ ok: false, error: "not found" }, 404);
        if (method === "DELETE") { await store.delete(m[1]); return json({ ok: true }); }
        if (method === "PATCH") {
          const body = await req.json().catch(() => ({} as any));
          if (body.status && (STATUSES as readonly string[]).includes(body.status)) rec.status = body.status;
          if (body.memo !== undefined) rec.memo = clip(body.memo, 2000);
          rec.updatedAt = new Date().toISOString();
          await store.setJSON(m[1], rec);
          return json({ ok: true, item: rec });
        }
      }

      /* 파일 올리기: 3MB 조각으로 나눠 받은 뒤 합침 */
      const up = path.match(/^\/api\/admin\/upload\/([a-z0-9]{8,40})\/(\d{1,2}|finish)$/);
      if (up) {
        const [, uid, part] = up;
        if (part !== "finish" && method === "PUT") {
          const body = new Uint8Array(await req.arrayBuffer());
          if (!body.length || body.length > 4_300_000) return json({ ok: false, error: "조각 크기가 올바르지 않습니다." }, 413);
          await tmpStore().set(uid + "-" + part, body.buffer as ArrayBuffer);
          return json({ ok: true });
        }
        if (part === "finish" && method === "POST") {
          const body = await req.json().catch(() => ({} as any));
          const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov" };
          const type = String(body.type || "");
          const ext = TYPES[type];
          const parts = int(body.parts, 12);
          if (!ext || !parts) return json({ ok: false, error: "지원하지 않는 파일 형식입니다." }, 400);
          const tmp = tmpStore();
          const chunks: Uint8Array[] = [];
          let total = 0;
          for (let i = 0; i < parts; i++) {
            const c = await tmp.get(uid + "-" + i, { type: "arrayBuffer" });
            if (!c) return json({ ok: false, error: "업로드가 끊겼습니다. 다시 시도해 주세요." }, 400);
            const u = new Uint8Array(c as ArrayBuffer); chunks.push(u); total += u.length;
          }
          if (total > 25_000_000) return json({ ok: false, error: "파일이 너무 큽니다 (최대 25MB)." }, 413);
          const all = new Uint8Array(total); let off = 0;
          for (const c of chunks) { all.set(c, off); off += c.length; }
          const key = uid + "." + ext;
          await mediaStore().set(key, all.buffer as ArrayBuffer, { metadata: { type, size: total, name: clip(body.name, 120), uploadedAt: new Date().toISOString() } });
          await Promise.all(Array.from({ length: parts }, (_, i) => tmp.delete(uid + "-" + i)));
          return json({ ok: true, url: "/api/media/" + key, type, size: total });
        }
      }


      /* ---------- 통계 ---------- */
      if (path === "/api/admin/stats" && method === "GET") {
        const days = Math.min(90, Math.max(1, +(url.searchParams.get("days") || 7)));
        const st = getStore({ name: prefix + "stats", consistency: "strong" });
        const today = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
        const dayList: string[] = [];
        for (let i = days - 1; i >= 0; i--) dayList.push(new Date(Date.now() + 9 * 3600 * 1000 - i * 86400000).toISOString().slice(0, 10));
        // 하루치 이벤트 → 요약 (지난 날짜는 요약을 저장해 두고 재사용)
        const summarize = async (day: string) => {
          if (day < today) { const cached: any = await st.get(`sum/${day}`, { type: "json" }); if (cached) return cached; }
          const { blobs } = await st.list({ prefix: `ev/${day}/` });
          const evs: any[] = (await Promise.all(blobs.map((b) => st.get(b.key, { type: "json" })))).filter(Boolean);
          const sum: any = { day, views: evs.length, pages: {}, src: {}, region: {}, kw: {}, dev: {}, visitors: [] as string[] };
          const vset = new Set<string>();
          for (const e of evs) {
            const pg = (sum.pages[e.p] ||= { views: 0, v: [] as string[] }); pg.views++; if (e.v && !pg.v.includes(e.v)) pg.v.push(e.v);
            if (e.v) vset.add(e.v);
            if (e.s) sum.src[e.s] = (sum.src[e.s] || 0) + 1;
            if (e.r) sum.region[e.r] = (sum.region[e.r] || 0) + 1;
            if (e.k) sum.kw[e.k] = (sum.kw[e.k] || 0) + 1;
            sum.dev[e.d || "pc"] = (sum.dev[e.d || "pc"] || 0) + 1;
          }
          sum.visitors = [...vset];
          if (day < today) await st.setJSON(`sum/${day}`, sum);
          return sum;
        };
        const sums = await Promise.all(dayList.map(summarize));
        // 같은 기간 상담 신청 (페이지별)
        const istore = inquiryStore(); const { blobs: ib } = await istore.list();
        const inqs: any[] = (await Promise.all(ib.map((b) => istore.get(b.key, { type: "json" })))).filter(Boolean);
        const from = dayList[0];
        const inPeriod = inqs.filter((i) => new Date(new Date(i.createdAt).getTime() + 9 * 3600 * 1000).toISOString().slice(0, 10) >= from);
        // 합치기
        const pages: Record<string, { views: number; v: Set<string>; inq: number }> = {};
        const add = (o: Record<string, number>, k: string, n: number) => { o[k] = (o[k] || 0) + n; };
        const src: Record<string, number> = {}, region: Record<string, number> = {}, kw: Record<string, number> = {}, dev: Record<string, number> = {};
        const allV = new Set<string>();
        const daily = sums.map((s: any) => ({ day: s.day, views: s.views, visitors: (s.visitors || []).length,
          inquiries: inPeriod.filter((i) => new Date(new Date(i.createdAt).getTime() + 9 * 3600 * 1000).toISOString().slice(0, 10) === s.day).length }));
        for (const s of sums as any[]) {
          for (const [p, d] of Object.entries<any>(s.pages)) { const t = (pages[p] ||= { views: 0, v: new Set(), inq: 0 }); t.views += d.views; d.v.forEach((x: string) => t.v.add(x)); }
          (s.visitors || []).forEach((x: string) => allV.add(x));
          for (const [k, n] of Object.entries<number>(s.src)) add(src, k, n);
          for (const [k, n] of Object.entries<number>(s.region)) add(region, k, n);
          for (const [k, n] of Object.entries<number>(s.kw)) add(kw, k, n);
          for (const [k, n] of Object.entries<number>(s.dev)) add(dev, k, n);
        }
        for (const i of inPeriod) { const p = i.page || "/"; (pages[p] ||= { views: 0, v: new Set(), inq: 0 }).inq++; }
        const top = (o: Record<string, number>, n = 15) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n).map(([name, count]) => ({ name, count }));
        return json({ ok: true, days, from, to: today,
          totals: { views: daily.reduce((s, d) => s + d.views, 0), visitors: allV.size, inquiries: inPeriod.length },
          daily,
          pages: Object.entries(pages).map(([p, d]) => ({ path: p, views: d.views, visitors: d.v.size, inquiries: d.inq })).sort((a, b) => b.views - a.views),
          sources: top(src), regions: top(region), keywords: top(kw), devices: top(dev) });
      }

      if (path === "/api/admin/content") {
        const store = contentStore();
        if (method === "GET") return json({ ok: true, content: (await store.get("content", { type: "json" })) || {} });
        if (method === "PUT") {
          const text = await req.text();
          if (text.length > 200_000) return json({ ok: false, error: "too large" }, 413);
          let content: any;
          try { content = JSON.parse(text).content; } catch { return json({ ok: false, error: "bad json" }, 400); }
          if (!content || typeof content !== "object" || Array.isArray(content)) return json({ ok: false, error: "bad content" }, 400);
          content.updatedAt = new Date().toISOString();
          await store.setJSON("content", content);
          return json({ ok: true, updatedAt: content.updatedAt });
        }
      }
    }

    return json({ ok: false, error: "not found" }, 404);
  } catch (err) {
    console.error(err);
    return json({ ok: false, error: "server" }, 500);
  }
};

export const config: Config = { path: "/api/*" };
