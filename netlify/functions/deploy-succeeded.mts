/**
 * 배포가 끝날 때마다 IndexNow로 네이버·빙 등에 "사이트가 바뀌었다"고 자동 알림
 * (IndexNow 참여 검색엔진끼리 공유됨) — 운영 배포에서만 실행
 */
const HOST = "xn--hy1bj5x75biyv.com";
const KEY = "e761b84c2d45d8c12a1afe76406ea8e3";
const URLS = ["/", "/lawyer-marketing/", "/law-firm-marketing/", "/legal-marketing/", "/regions/", "/llms.txt", "/sitemap.xml"].map((p) => "https://" + HOST + p);

export default async (req: Request) => {
  let body: any = {};
  try { body = await req.json(); } catch {}
  const ctx = body?.payload?.context;
  if (ctx && ctx !== "production") return new Response("skip: " + ctx);
  const data = JSON.stringify({ host: HOST, key: KEY, keyLocation: "https://" + HOST + "/" + KEY + ".txt", urlList: URLS });
  const targets = ["https://searchadvisor.naver.com/indexnow", "https://api.indexnow.org/indexnow"];
  const results = await Promise.allSettled(targets.map((u) =>
    fetch(u, { method: "POST", headers: { "Content-Type": "application/json; charset=utf-8" }, body: data }).then((r) => u + " " + r.status)
  ));
  const log = results.map((r) => (r.status === "fulfilled" ? r.value : "error " + (r as any).reason)).join(" | ");
  console.log("IndexNow:", log);
  return new Response(log);
};
