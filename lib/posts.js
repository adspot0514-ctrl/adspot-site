/* 관리자에서 쓰는 칼럼: 저장 · 본문 변환 · 페이지 만들기 */
import { db } from "./core.js";

export const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,60}[a-z0-9]$/;
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export async function postsTable(env) {
  const D = await db(env);
  await D.prepare("CREATE TABLE IF NOT EXISTS posts (slug TEXT PRIMARY KEY, title TEXT, descr TEXT, body TEXT, status TEXT, date TEXT, updated INTEGER)").run();
  return D;
}
export async function listPosts(env, onlyPublished = false) {
  const D = await postsTable(env);
  const q = onlyPublished ? "SELECT * FROM posts WHERE status = 'published' ORDER BY date DESC, updated DESC" : "SELECT * FROM posts ORDER BY updated DESC";
  return ((await D.prepare(q).all()).results || []);
}
export async function getPost(env, slug) {
  const D = await postsTable(env);
  return await D.prepare("SELECT * FROM posts WHERE slug = ?").bind(slug).first();
}

/* 본문 쓰는 규칙 (관리자 화면 안내와 같음)
   ## 소제목 / - 목록 / > 강조 박스 / **굵게** / [글자](주소) / ![설명](이미지주소) / 표: | 칸 | 칸 |  (첫 줄은 제목 줄) / 빈 줄 = 문단 나눔 */
function inline(t) {
  let s = esc(t);
  s = s.replace(/!\[([^\]]*)\]\(((?:https?:\/\/|\/)[^)\s]+)\)/g, (_, a, u) => `<img src="${u}" alt="${a}" loading="lazy" decoding="async">`);
  s = s.replace(/\[([^\]]+)\]\(((?:https?:\/\/|\/)[^)\s]+)\)/g, (_, a, u) => `<a href="${u}"${/^https?:/.test(u) && !u.includes("xn--hy1bj5x75biyv.com") ? ' target="_blank" rel="noopener"' : ""}>${a}</a>`);
  s = s.replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");
  return s;
}
export function renderBody(src) {
  const lines = String(src || "").replace(/\r/g, "").split("\n");
  const out = [], toc = []; let i = 0, para = [];
  const flush = () => { if (para.length) { out.push(`<p>${inline(para.join(" "))}</p>`); para = []; } };
  while (i < lines.length) {
    const L = lines[i], t = L.trim();
    if (!t) { flush(); i++; continue; }
    let m;
    if ((m = t.match(/^##\s+(.+)$/))) { flush(); toc.push(m[1]); out.push(`<h2 id="s${toc.length}">${inline(m[1])}</h2>`); i++; continue; }
    if ((m = t.match(/^###\s+(.+)$/))) { flush(); out.push(`<h3>${inline(m[1])}</h3>`); i++; continue; }
    if (/^[-*]\s+/.test(t)) { flush(); const items = []; while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) { items.push(`<li>${inline(lines[i].trim().replace(/^[-*]\s+/, ""))}</li>`); i++; } out.push(`<ul>${items.join("")}</ul>`); continue; }
    if (/^\d+[.)]\s+/.test(t)) { flush(); const items = []; while (i < lines.length && /^\d+[.)]\s+/.test(lines[i].trim())) { items.push(`<li>${inline(lines[i].trim().replace(/^\d+[.)]\s+/, ""))}</li>`); i++; } out.push(`<ol>${items.join("")}</ol>`); continue; }
    if (/^>\s?/.test(t)) { flush(); const q = []; while (i < lines.length && /^>\s?/.test(lines[i].trim())) { q.push(lines[i].trim().replace(/^>\s?/, "")); i++; } out.push(`<p class="art-tip">${inline(q.join(" "))}</p>`); continue; }
    if (/^\|.*\|$/.test(t)) { flush(); const rows = []; while (i < lines.length && /^\|.*\|$/.test(lines[i].trim())) { const r = lines[i].trim().slice(1, -1).split("|").map((c) => c.trim()); if (!r.every((c) => /^:?-{2,}:?$/.test(c))) rows.push(r); i++; }
      const [h, ...b] = rows; out.push(`<div class="tbl"><table><thead><tr>${h.map((c) => `<th>${inline(c)}</th>`).join("")}</tr></thead><tbody>${b.map((r) => `<tr>${r.map((c, k) => k ? `<td>${inline(c)}</td>` : `<th scope="row">${inline(c)}</th>`).join("")}</tr>`).join("")}</tbody></table></div>`); continue; }
    para.push(t); i++;
  }
  flush();
  return { html: out.join(""), toc };
}
export const readMins = (body) => Math.max(2, Math.round(String(body || "").replace(/\s+/g, "").length / 500));
export const dotDate = (d) => String(d || "").slice(0, 10).replace(/-/g, ".");
export function cardHTML(p) {
  return `<a class="ins-card" href="/insights/${p.slug}/"><span class="ins-meta">${dotDate(p.date)} · 약 ${readMins(p.body)}분</span><h3>${esc(p.title)}</h3><p>${esc(p.descr)}</p><span class="ins-more">읽어보기 ›</span></a>`;
}
/* 템플릿(/insights/_tpl/)의 {{자리}}를 채워 글 페이지를 만듦 */
export function buildPage(tpl, p, host, others) {
  const { html, toc } = renderBody(p.body);
  const url = `https://${host}/insights/${p.slug}/`;
  const tocHTML = toc.length > 1 ? `<nav class="art-toc" aria-label="목차"><b>목차</b><ol>${toc.map((t, i) => `<li><a href="#s${i + 1}">${esc(t.replace(/\*\*/g, ""))}</a></li>`).join("")}</ol></nav>` : "";
  const ld = { "@context": "https://schema.org", "@graph": [
    { "@type": "Article", "@id": url + "#article", headline: p.title, description: p.descr, datePublished: p.date, dateModified: new Date(p.updated || Date.now()).toISOString().slice(0, 10), inLanguage: "ko-KR", mainEntityOfPage: url,
      author: { "@type": "Organization", name: "애드스팟", url: `https://${host}/` }, publisher: { "@type": "Organization", "@id": `https://${host}/#org`, name: "애드스팟", url: `https://${host}/` } },
    { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "애드스팟", item: `https://${host}/` }, { "@type": "ListItem", position: 2, name: "변호사마케팅 칼럼", item: `https://${host}/insights/` }, { "@type": "ListItem", position: 3, name: p.title, item: url }] }] };
  const map = { TITLE: esc(p.title), DESC: esc(p.descr), URL: url, SLUG: p.slug, DATE: esc(p.date), DATE_DOT: dotDate(p.date), MINS: String(readMins(p.body)),
    TOC: tocHTML, BODY: html, OTHERS: others, LD: JSON.stringify(ld).replace(/</g, "\\u003c") };
  return tpl.replace(/\{\{(\w+)\}\}/g, (m, k) => (k in map ? map[k] : m)).replace('<meta name="robots" content="noindex, nofollow">', '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">');
}
