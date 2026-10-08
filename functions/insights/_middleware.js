/* 칼럼(/insights/): 관리자에서 쓴 글을 목록·글 페이지·RSS에 끼워 넣음 */
import { listPosts, getPost, buildPage, cardHTML } from "../../lib/posts.js";
const HOST = "xn--hy1bj5x75biyv.com";
const esc = (s) => String(s ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
const htmlRes = (body, status = 200) => new Response(body, { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=0, must-revalidate" } });

export async function onRequest({ request, env, next }) {
  const url = new URL(request.url), path = url.pathname;
  if (path.startsWith("/insights/_tpl")) return new Response("Not found", { status: 404 });
  try {
    // 목록: 관리자 글을 맨 앞에
    if (path === "/insights/" || path === "/insights") {
      const res = await next(); const posts = await listPosts(env, true);
      if (!posts.length || !(res.headers.get("content-type") || "").includes("text/html")) return res;
      const html = (await res.text()).replace('<div class="ins-list">', '<div class="ins-list">' + posts.map(cardHTML).join(""));
      return htmlRes(html, res.status);
    }
    // RSS: 관리자 글 추가
    if (path === "/insights/rss.xml") {
      const res = await next(); const posts = await listPosts(env, true);
      if (!posts.length) return res;
      const items = posts.map((p) => `  <item>\n    <title><![CDATA[${p.title}]]></title>\n    <link>https://${HOST}/insights/${p.slug}/</link>\n    <guid isPermaLink="true">https://${HOST}/insights/${p.slug}/</guid>\n    <description><![CDATA[${p.descr}]]></description>\n    <category>변호사마케팅</category>\n    <pubDate>${new Date(p.date + "T09:00:00+09:00").toUTCString()}</pubDate>\n  </item>\n`).join("");
      const xml = (await res.text()).replace(/(<atom:link[^>]*\/>\n?)/, `$1${items}`);
      return new Response(xml, { status: 200, headers: { "content-type": "application/rss+xml; charset=utf-8", "cache-control": "public, max-age=600" } });
    }
    // 글 페이지
    const m = path.match(/^\/insights\/([a-z0-9-]+)\/?$/);
    if (m) {
      const p = await getPost(env, m[1]);
      if (p && p.status === "published") {
        if (!path.endsWith("/")) return Response.redirect(`${url.origin}/insights/${p.slug}/`, 301);
        const [tplRes, idxRes, all] = await Promise.all([env.ASSETS.fetch(new URL("/insights/_tpl/", url)), env.ASSETS.fetch(new URL("/insights/", url)), listPosts(env, true)]);
        const staticCards = ((await idxRes.text()).match(/<a class="ins-card"[\s\S]*?<\/a>/g) || []);
        const others = all.filter((x) => x.slug !== p.slug).map(cardHTML).concat(staticCards).slice(0, 3).join("");
        return htmlRes(buildPage(await tplRes.text(), p, HOST, others));
      }
    }
  } catch (e) { console.error(e); }
  return next();
}
