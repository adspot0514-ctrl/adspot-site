/* 모든 페이지 공통: 관리자 > 검색 노출에서 저장한 제목·설명을 서버에서 끼워 넣어 보냄
   (검색 로봇이 바뀐 제목·설명을 그대로 읽어 가도록 HTML 자체를 바꿈) */
import { kvGet } from "../lib/core.js";
import { applySeo, seoPath } from "../lib/seo.js";

export async function onRequest({ request, env, next }) {
  const url = new URL(request.url);
  const p = url.pathname;
  // 페이지가 아닌 요청(API·이미지·파일)과 관리자 화면은 그대로 통과
  if ((request.method !== "GET" && request.method !== "HEAD") || p.startsWith("/api/") || p.startsWith("/admin") ||
      (/\.[a-z0-9]{2,5}$/i.test(p) && !/\.html?$/i.test(p)) || url.searchParams.has("admin-raw")) return next();
  const res = await next();
  if (res.status !== 200 || !(res.headers.get("content-type") || "").includes("text/html")) return res;
  let seo = null;
  try { const data = await kvGet(env, "content"); seo = data && data.seo && data.seo[seoPath(p)]; } catch (e) { return res; }
  if (!seo || typeof seo !== "object" || (!seo.title && !seo.desc)) return res;
  const html = applySeo(await res.text(), seo);
  const headers = new Headers(res.headers);
  headers.delete("content-length");
  headers.delete("etag");
  headers.set("cache-control", "public, max-age=0, must-revalidate");
  return new Response(request.method === "HEAD" ? null : html, { status: res.status, headers });
}
