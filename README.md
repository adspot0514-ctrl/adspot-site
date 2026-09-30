# 애드스팟 홈페이지 (애드스팟.com)

## 구성
- `public/` — 홈페이지 파일 (index.html, styles.css, app.js, content-defaults.js, assets/)
- `public/admin/` — 관리자 페이지 (애드스팟.com/admin)
- `netlify/functions/api.mts` — 상담문의 저장 · 관리자 로그인 · 콘텐츠 저장 (Netlify Functions + Netlify Blobs)
- `netlify.toml` — Netlify 설정

## 관리자 페이지
- 주소: https://애드스팟.com/admin
- 비밀번호: Netlify → 프로젝트 → 환경 변수(Environment variables) → `ADMIN_PASSWORD`
  - 바꾼 뒤에는 Netlify에서 한 번 다시 배포(Deploys → Trigger deploy)해야 적용됩니다.
- 상담문의: 홈페이지 신청서로 들어온 문의 확인, 상태(신규·연락함·완료)·메모, CSV 내려받기
- 홈페이지 수정: 연락처, 메인 문구, 함께하는 시간 파트너, 상품 가격, 분야별 추천 조합, 성장 이야기, 푸터 사업자 정보
  - 저장하면 홈페이지에 바로 반영됩니다. 저장한 값이 없으면 `content-defaults.js`의 기본값이 쓰입니다.

## 배포
GitHub 저장소에 변경을 올리면 Netlify가 자동으로 배포합니다.
