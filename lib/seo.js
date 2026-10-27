/* 검색 노출(제목·설명): 관리자 > 검색 노출에서 저장한 값을 페이지 <head>에 끼워 넣음 (서버에서 실행) */
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const has = (v) => v !== void 0 && v !== null && String(v).trim() !== "";

/* 주소 정리: /services/cafe → /services/cafe/, /index.html → / */
export function seoPath(pathname) {
  let p = String(pathname || "/").replace(/\/index\.html?$/i, "/");
  if (!p.endsWith("/") && !/\.[a-z0-9]{2,5}$/i.test(p)) p += "/";
  return p;
}

export function applySeo(html, s) {
  if (!s || typeof s !== "object") return html;
  const metaSet = (re, v) => { html = html.replace(re, (_m, a, b) => a + v + b); };
  if (has(s.title)) {
    const t = esc(String(s.title).trim());
    html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${t}</title>`);
    metaSet(/(<meta\s+property="og:title"\s+content=")[^"]*(")/, t);
    metaSet(/(<meta\s+name="twitter:title"\s+content=")[^"]*(")/, t);
  }
  if (has(s.desc)) {
    const d = esc(String(s.desc).trim().replace(/\s*\n\s*/g, " "));
    metaSet(/(<meta\s+name="description"\s+content=")[^"]*(")/, d);
    metaSet(/(<meta\s+property="og:description"\s+content=")[^"]*(")/, d);
    metaSet(/(<meta\s+name="twitter:description"\s+content=")[^"]*(")/, d);
  }
  // 구조화 데이터(JSON-LD)의 WebPage 이름·설명도 같이 바꿔 검색엔진이 헷갈리지 않게 함
  html = html.replace(/(<script type="application\/ld\+json"[^>]*>)([\s\S]*?)(<\/script>)/g, (all, a, json, c) => {
    try {
      const g = JSON.parse(json);
      const nodes = Array.isArray(g["@graph"]) ? g["@graph"] : [g];
      let changed = false;
      for (const n of nodes) {
        const types = [].concat(n && n["@type"] || []);
        if (!types.some((x) => /^(WebPage|CollectionPage|AboutPage|Article|BlogPosting)$/.test(x))) continue;
        if (has(s.title)) { if ("name" in n || !("headline" in n)) n.name = String(s.title).trim(); if ("headline" in n) n.headline = String(s.title).trim(); changed = true; }
        if (has(s.desc)) { n.description = String(s.desc).trim().replace(/\s*\n\s*/g, " "); changed = true; }
      }
      return changed ? a + JSON.stringify(g).replace(/</g, "\\u003c") + c : all;
    } catch { return all; }
  });
  return html;
}
