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
        status: "new",
        memo: "",
      };
      await inquiryStore().setJSON(id, record);
      return json({ ok: true, id });
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
