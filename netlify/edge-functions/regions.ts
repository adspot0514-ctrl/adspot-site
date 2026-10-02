/**
 * 지역 페이지(/regions/○○/)를 보낼 때, 관리자 > 지역 페이지에서 저장한 내용을
 * 서버에서 끼워 넣어 내보냅니다. (방문자와 검색 로봇 모두 바뀐 내용을 보게 됨)
 * 저장한 내용이 없는 지역은 원래 페이지 그대로 보냅니다.
 */
type Faq = { q?: string; a?: string };
type RegionPage = { title?: string; desc?: string; h1?: string; lead?: string; story?: string;
  pkg?: { cafe?: number; influencer?: number; blog?: number }; faq?: Faq[] };

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" } as Record<string, string>)[c]);
const has = (v: unknown) => v !== undefined && v !== null && String(v).trim() !== "";
const nl2br = (s: string) => esc(s).replace(/\n/g, "<br>");
const won = (n: number) => Math.round(n).toLocaleString("ko-KR");

export function applyRegion(html: string, rp: RegionPage, plans: { key: string; price: number }[] | undefined): string {
  const setInner = (attr: string, value: string) => {
    const re = new RegExp(`(<([a-z0-9]+)[^>]*data-r="${attr}"[^>]*>)([\\s\\S]*?)(</\\2>)`);
    html = html.replace(re, (_m, open, _t, _old, close) => open + value + close);
  };
  if (has(rp.title)) {
    const t = esc(rp.title);
    html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${t}</title>`)
      .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${t}$2`);
  }
  if (has(rp.desc)) {
    const d = esc(rp.desc);
    html = html.replace(/(<meta name="description" content=")[^"]*(")/, `$1${d}$2`)
      .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${d}$2`);
  }
  if (has(rp.h1)) setInner("h1", nl2br(rp.h1!));
  if (has(rp.lead)) setInner("lead", nl2br(rp.lead!));

  // 지역 추천 패키지 건수와 월 금액
  if (rp.pkg) {
    const m = html.match(/<div class="pkg" data-pkg[^>]*>/);
    if (m) {
      let tag = m[0];
      const price: Record<string, number> = {};
      for (const k of ["cafe", "influencer", "blog"]) {
        const p = (plans || []).find((x) => x && x.key === k);
        const def = +(tag.match(new RegExp(`data-price-${k}="(\\d+)"`)) || [])[1] || 0;
        price[k] = p && +p.price ? +p.price : def;
        const n = +(rp.pkg as Record<string, number>)[k];
        if (Number.isFinite(n) && n >= 0) {
          tag = tag.replace(new RegExp(`data-${k}="\\d+"`), `data-${k}="${Math.round(n)}"`);
          setInner(`pkg-${k}`, `${Math.round(n)}건`);
        }
      }
      html = html.replace(m[0], tag);
      const count = (k: string) => +(tag.match(new RegExp(`data-${k}="(\\d+)"`)) || [])[1] || 0;
      const total = ["cafe", "influencer", "blog"].reduce((s, k) => s + count(k) * price[k], 0);
      const txt = `월 약 ${won(total / 10000)}만 원`;
      html = html.replace(/(<b data-pkg-total>)[^<]*(<\/b>)/, `$1${txt}$2`)
        .replace(/(<span data-faq="pkg">)[^<]*(<\/span>)/g, `$1${txt}$2`);
    }
  }

  // 지역 이야기·사례 (입력했을 때만 영역 표시)
  if (has(rp.story)) {
    const name = esc((html.match(/<span class="pkg-badge">([^<]*?) 지역 추천<\/span>/) || [])[1] || "지역");
    const paras = String(rp.story).trim().split(/\n{2,}/).map((p) => `<p class="p">${nl2br(p)}</p>`).join("");
    html = html.replace("<!--R:story-->",
      `<section class="sec story"><div class="wrap"><p class="kicker">${name} 이야기</p><h2 class="h2">${name} 변호사님과 함께한 이야기</h2>${paras}</div></section>`);
  }

  // 자주 묻는 질문 (+ 구조화 데이터)
  const faq = Array.isArray(rp.faq) ? rp.faq : [];
  faq.forEach((f, i) => {
    if (has(f && f.q)) setInner(`faq-q-${i}`, esc(f.q));
    if (has(f && f.a)) setInner(`faq-a-${i}`, nl2br(f.a!));
  });
  html = html.replace(/(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/, (all, a, json, c) => {
    try {
      const g = JSON.parse(json);
      for (const n of g["@graph"] || []) {
        if (n["@type"] === "WebPage") { if (has(rp.title)) n.name = rp.title; if (has(rp.desc)) n.description = rp.desc; }
        if (n["@type"] === "FAQPage") n.mainEntity.forEach((q: any, i: number) => {
          const f = faq[i]; if (!f) return;
          if (has(f.q)) q.name = f.q; if (has(f.a)) q.acceptedAnswer.text = f.a;
        });
      }
      return a + JSON.stringify(g) + c;
    } catch { return all; }
  });
  return html;
}

export default async (req: Request, context: { next: () => Promise<Response> }) => {
  const res = await context.next();
  const slug = (new URL(req.url).pathname.match(/^\/regions\/([a-z-]+)\/?$/) || [])[1];
  if (!slug || !(res.headers.get("content-type") || "").includes("text/html")) return res;
  let data: any = null;
  try {
    const r = await fetch(new URL("/api/content", req.url), { headers: { accept: "application/json" } });
    if (r.ok) data = await r.json();
  } catch { /* 저장 내용을 못 불러오면 원래 페이지 */ }
  const rp = data && data.regionPages && data.regionPages[slug];
  if (!rp || typeof rp !== "object") return res;
  const html = applyRegion(await res.text(), rp, Array.isArray(data.plans) ? data.plans : undefined);
  const headers = new Headers(res.headers);
  headers.delete("content-length");
  headers.set("cache-control", "public, max-age=0, must-revalidate");
  return new Response(html, { status: res.status, headers });
};

export const config = { path: "/regions/*" };
