# PDF item crop (How)

How only. Policy stays in ADRs — this file does not rewrite them.

1. 클라이언트가 페이지를 canvas JPEG로 그린다 (기존 `renderPage`).
2. 같은 페이지의 pdf.js `textContent.items`를 `{str, x, y, w, h}`로 둔다. `join(" ")`만 하면 번호가 사라진다.
3. 마커: `^\s*(?:문\s*)?(\d{1,2})\s*[\.．번)]` 또는 원문자 `①`이 **문항 시작**일 때만 (보기 `1)` 과 구분 — 기존 `splitExamText` 규칙 유지).
4. 문항 n 크롭 = 마커 n의 y → 다음 마커 y (없으면 페이지 하단). x는 본문 열(왼쪽 여백~가운데). 여백 8px.
5. 마커가 페이지에 2개 미만(스캔): 로그인한 세션이거나 `GOOGLE_FREE_TIER_KEY`가 있을 때만 Gemini split. 게스트+유료키 금지. 둘 다 없으면 그 페이지는 스킵 카드.
6. 파일 전체 문항 0개면 세션을 열지 않고 `이 파일에서 문항을 못 찾았어요`.
7. 40쪽 초과는 앞 40만. 카피: `나머지는 다음에 이어서 올릴 수 있어요`.
8. 레일 제목/탭 = `문항 ${n}`. `추출` 문자열 금지.
9. 데모 `items/q01.png`–`q30.png`는 2026 칩 폴백만. 임의 업로드의 플레이트가 되면 실패.
