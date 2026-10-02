/* 지역 페이지(/regions/○○/): 관리자 > 지역 페이지에서 저장한 내용을 서버에서 끼워 넣어 보냄 */
import { kvGet } from "../../lib/core.js";
import { applyRegion } from "../../lib/region.js";

export async function onRequest({ request, env, next }) {
  const res = await next();
  const slug = (new URL(request.url).pathname.match(/^\/regions\/([a-z-]+)\/?$/) || [])[1];
  if (!slug || !(res.headers.get("content-type") || "").includes("text/html")) return res;
  let data = null;
  try { data = await kvGet(env, "content"); } catch (e) { return res; }
  const rp = data && data.regionPages && data.regionPages[slug];
  if (!rp || typeof rp !== "object") return res;
  const html = applyRegion(await res.text(), rp, Array.isArray(data.plans) ? data.plans : undefined);
  const headers = new Headers(res.headers);
  headers.delete("content-length");
  headers.set("cache-control", "public, max-age=0, must-revalidate");
  return new Response(html, { status: res.status, headers });
}
