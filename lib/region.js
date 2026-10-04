/* 지역 페이지에 관리자 저장 내용을 끼워 넣는 함수 (서버에서 실행) */
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const has = (v) => v !== void 0 && v !== null && String(v).trim() !== "";
const nl2br = (s) => esc(s).replace(/\n/g, "<br>");
const won = (n) => Math.round(n).toLocaleString("ko-KR");
function applyRegion(html, rp, plans) {
  const setInner = (attr, value) => {
    const re = new RegExp(`(<([a-z0-9]+)[^>]*data-r="${attr}"[^>]*>)([\\s\\S]*?)(</\\2>)`);
    html = html.replace(re, (_m, open, _t, _old, close) => open + value + close);
  };
  if (has(rp.title)) {
    const t = esc(rp.title);
    html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${t}</title>`).replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${t}$2`);
  }
  if (has(rp.desc)) {
    const d = esc(rp.desc);
    html = html.replace(/(<meta name="description" content=")[^"]*(")/, `$1${d}$2`).replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${d}$2`);
  }
  if (has(rp.h1)) setInner("h1", nl2br(rp.h1));
  if (has(rp.lead)) setInner("lead", nl2br(rp.lead));
  if (rp.pkg) {
    const m = html.match(/<div class="pkg" data-pkg[^>]*>/);
    if (m) {
      let tag = m[0];
      const price = {};
      for (const k of ["cafe", "influencer", "blog"]) {
        const p = (plans || []).find((x) => x && x.key === k);
        const def = +(tag.match(new RegExp(`data-price-${k}="(\\d+)"`)) || [])[1] || 0;
        price[k] = p && +p.price ? +p.price : def;
        const n = +rp.pkg[k];
        if (Number.isFinite(n) && n >= 0) {
          tag = tag.replace(new RegExp(`data-${k}="\\d+"`), `data-${k}="${Math.round(n)}"`);
          setInner(`pkg-${k}`, `${Math.round(n)}\uAC74`);
        }
      }
      html = html.replace(m[0], tag);
      const count = (k) => +(tag.match(new RegExp(`data-${k}="(\\d+)"`)) || [])[1] || 0;
      const total = ["cafe", "influencer", "blog"].reduce((s, k) => s + count(k) * price[k], 0);
      const txt = `\uC6D4 \uC57D ${won(total / 1e4)}\uB9CC \uC6D0`;
      html = html.replace(/(<b data-pkg-total>)[^<]*(<\/b>)/, `$1${txt}$2`).replace(/(<span data-faq="pkg">)[^<]*(<\/span>)/g, `$1${txt}$2`);
    }
  }
  if (has(rp.story)) {
    const name = esc((html.match(/<span class="pkg-badge">([^<]*?) 지역 추천<\/span>/) || [])[1] || "\uC9C0\uC5ED");
    const paras = String(rp.story).trim().split(/\n{2,}/).map((p) => `<p class="p">${nl2br(p)}</p>`).join("");
    html = html.replace(
      "<!--R:story-->",
      `<section class="sec story"><div class="wrap"><p class="kicker">${name} \uC774\uC57C\uAE30</p><h2 class="h2">${name} \uBCC0\uD638\uC0AC\uB2D8\uACFC \uD568\uAED8\uD55C \uC774\uC57C\uAE30</h2>${paras}</div></section>`
    );
  }

  /* 세부 문구·사진 (data-e / data-ei 표시가 붙은 곳) */
  const reEsc = (k) => String(k).replace(/[^a-z0-9-]/gi, "");
  const list = (v) => String(v).split(/[,\n]/).map((x) => x.trim()).filter(Boolean);
  if (rp.text && typeof rp.text === "object") {
    for (const [key, val] of Object.entries(rp.text)) {
      if (!has(val)) continue;
      const k = reEsc(key);
      const re = new RegExp(`(<([a-z0-9]+)(?=[^>]*\\sdata-e="${k}")[^>]*>)([\\s\\S]*?)(</\\2>)`);
      html = html.replace(re, (_m, open, _t, _old, close) => {
        const typ = (open.match(/data-et="([^"]+)"/) || [])[1];
        let inner;
        if (typ === "tags" || typ === "tags-main") inner = list(val).map((x, i) => `<span${typ === "tags-main" && i === 0 ? ' class="main"' : ""}>${esc(x)}</span>`).join("");
        else if (typ === "li") inner = list(val).map((x) => `<li>${esc(x)}</li>`).join("");
        else if (typ === "how") { const t = String(val).trim(); const sp = t.indexOf(" "); inner = sp > 0 ? `<b>${esc(t.slice(0, sp))}</b> ${nl2br(t.slice(sp + 1))}` : nl2br(t); }
        else inner = nl2br(val);
        return open + inner + close;
      });
    }
  }
  if (rp.img && typeof rp.img === "object") {
    for (const [key, url] of Object.entries(rp.img)) {
      if (!has(url) || !/^(\/api\/media\/|\/assets\/|https:\/\/)[^"'<>\s]+$/.test(url)) continue;
      const k = reEsc(key);
      html = html.replace(new RegExp(`<img(?=[^>]*\\sdata-ei="${k}")[^>]*>`), (tag) => tag.replace(/\ssrc="[^"]*"/, ` src="${esc(url)}"`).replace(/\sstyle="object-position:[^"]*"/, ""));
    }
  }
  const faq = Array.isArray(rp.faq) ? rp.faq : [];
  faq.forEach((f, i) => {
    if (has(f && f.q)) setInner(`faq-q-${i}`, esc(f.q));
    if (has(f && f.a)) setInner(`faq-a-${i}`, nl2br(f.a));
  });
  html = html.replace(/(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/, (all, a, json, c) => {
    try {
      const g = JSON.parse(json);
      for (const n of g["@graph"] || []) {
        if (n["@type"] === "WebPage") {
          if (has(rp.title)) n.name = rp.title;
          if (has(rp.desc)) n.description = rp.desc;
        }
        if (n["@type"] === "FAQPage") n.mainEntity.forEach((q, i) => {
          const f = faq[i];
          if (!f) return;
          if (has(f.q)) q.name = f.q;
          if (has(f.a)) q.acceptedAnswer.text = f.a;
        });
      }
      return a + JSON.stringify(g) + c;
    } catch {
      return all;
    }
  });
  return html;
}
export { applyRegion };
