/* 사이트맵: 파일에 있는 주소 + 관리자에서 발행한 칼럼 */
import { listPosts } from "../lib/posts.js";
const HOST = "xn--hy1bj5x75biyv.com";
export async function onRequest({ env, next }) {
  const res = await next();
  try {
    const posts = await listPosts(env, true);
    if (!posts.length) return res;
    let xml = await res.text();
    const add = posts.filter((p) => !xml.includes(`/insights/${p.slug}/<`)).map((p) => `  <url><loc>https://${HOST}/insights/${p.slug}/</loc><lastmod>${new Date(p.updated || Date.now()).toISOString().slice(0, 10)}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>\n`).join("");
    xml = xml.replace("</urlset>", add + "</urlset>");
    return new Response(xml, { status: 200, headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=600" } });
  } catch (e) { return res; }
}
