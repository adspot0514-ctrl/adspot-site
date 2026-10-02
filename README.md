# 애드스팟 홈페이지 (애드스팟.com) — Cloudflare Pages

## 구성
- `public/` — 홈페이지·안내·지역 페이지·관리자 화면 (정적 파일)
- `functions/api/[[path]].js` — 상담 접수, 관리자, 통계, 이미지·영상 (Cloudflare Pages Functions)
- `functions/regions/_middleware.js` — 지역 페이지에 관리자 수정 내용을 서버에서 끼워 넣음
- `lib/` — 서버 공통 코드
- `public/_headers` — 관리자 검색 차단, 이미지 캐시 설정

## Cloudflare 설정 (최초 1회)
- 빌드: 프레임워크 없음 · 빌드 명령 비움 · 출력 디렉터리 `public`
- 바인딩: D1 데이터베이스 → 변수 이름 `DB` / KV 네임스페이스 → `MEDIA_KV` (또는 R2 버킷 → `MEDIA`)
- 환경 변수(암호): `ADMIN_PASSWORD`, `ADMIN_SECRET`
- 데이터베이스 표는 첫 요청 때 자동으로 만들어집니다.

## 관리자 (애드스팟.com/admin)
- 상담문의 · 홈페이지 수정 · 지역 페이지 · 통계
- 홈페이지 수정 탭: 백업 내려받기 / 백업 불러오기 / 검색엔진에 알리기
