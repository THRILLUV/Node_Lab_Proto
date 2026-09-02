# QA gaps

라이브: https://nodelab-swart.vercel.app
날짜: 2026-09-02
데모 제외 픽스처: `qa/fixtures/naesin-12.pdf`, `qa/fixtures/pyunip-20.pdf`, `qa/fixtures/hand-solve.png`, `qa/fixtures/weather-ko.pdf`

게스트(시작하기 → 온보딩 「손풀이만 미리 맞춰 두면 돼요」 → 알겠어요). 계정 칩 실측: `#accountName` = `게스트`, `#accountAvatar` = `게`.
로컬 대조: **포트 4199** (`http://127.0.0.1:4199`, `PORT=4199 node scripts/dev.mjs`, 워크트리 `/tmp/nl-pdf-crop`). 기본 `4173`이 아님. UI 갭은 라이브와 같음. 라이브만 `/api/split` 502 (`pdfjs-dist` worker 모듈 없음) — 문항 분리는 브라우저 `extractPdfFile` fallback으로 진행됨.

컨트롤 2026은 **마지막에만**. 저장소 `qa/2026수능수학영역.pdf`는 446바이트 스텁(텍스트 `2026 math`)이라 홀수형 30문이 아님. 칩 `2026 수능 수학 PDF 업로드`는 파일 피커만 연다.

## P0 — 문항 크롭 / 우측 탭 (1순위. 이게 열리기 전엔 5선택지·OCR·CAT·페이월 추가 금지)

- [x] G1 다른 PDF에서 우측이 「추출」
  - 증상: `naesin-12` / `pyunip-20` 세션에서 `#btn-tab-qlist`는 `문항 1–12` / `문항 1–20` 인데, 우측 `.qcard b`와 플레이트 `.concept`가 전부 `추출`. 카드 예: `1번 학습 중` + **추출** + 힌트 `일차방정식 2x + 7 = 19 를 풀면 x의 값은`. `window.NL.sessionItems[].type` = `"추출"`.
  - 재현: 게스트 → `qa/fixtures/naesin-12.pdf` 시작. 새로고침 후 `qa/fixtures/pyunip-20.pdf` 동일. 로컬 4199에서도 동일.
  - 기대: 우측 `문항 1` … `문항 N`. 「추출」 없음
  - ADR: 022 (문항 단위), 카피북 분할 화면
  - 우선순위: P0
  - 통과여부: 통과 (라이브 headed 2026-09-02, https://nodelab-swart.vercel.app). 게스트 업로드 후 `#view-qlist .qcard b` = `문항 1`…`문항 12` / `문항 1`…`문항 20`. `#btn-tab-qlist` `문항 1–12` / `문항 1–20`. `추출` 없음.

- [x] G2 플레이트가 페이지 통째
  - 증상: `#platePaper .exam.exam-original` + `img.exam-crop` alt `1번 원문`. 자연 크기 804×1137 (A4를 scale 1.35로 통째 렌더한 값). 노트 `올린 문제지에서 가져온 쪽 · 이 파일의 문항입니다`. 분할 연출 `#examSheet img` alt는 업로드 파일과 무관하게 **`2026 수능 수학 홀수형 1쪽 원본 스캔`** (`items/page-01.png`). 플라이 타일 `1번`–`4번`이 통째 페이지 위에 겹침.
  - 재현: 위 두 PDF 업로드 후 분할 화면 → 세션 플레이트. 1번을 골라도 해당 쪽 전체가 보임.
  - 기대: 문항 박스 크롭 이미지. KaTeX 지문으로 원문 대체 금지
  - ADR: 022
  - 우선순위: P0
  - 통과여부: 통과 (라이브 headed Chrome, DISPLAY=:1, 2026-09-02). `#platePaper img.exam-crop` 자연 크기 **804×107** (naesin-12 · pyunip-20 모두). src `data:image/jpeg;base64,…`. 804×1137 통째 A4 아님. alt `1번 원문`. 노트 `올린 문제지에서 가져온 쪽 · 이 파일의 문항입니다`. KaTeX 대체 없음.

- [x] G3 문항 수 30 하드코딩
  - 증상: 탭/인식 그리드는 실제 N (`문항 인식 0/12` … `1–12`, pyunip `0/20`). 그러나 분할 로그 4번째 줄이 감지 수와 상관없이 **`30문항으로 나누는 중…`**. `#splitNow` / `#sheetBanner`도 같은 카피. `naesin-12.pdf · 12문`, 요약 `업로드 PDF 4페이지 · 감지 12문항`과 모순.
  - 재현: 12문항·20문항 PDF. 로컬 동일.
  - 기대: N=실제 감지 수. `30문항으로 나누는 중…` 없음
  - 우선순위: P0
  - 통과여부: 통과 (라이브 headed 2026-09-02). 분할 카피 `12문항으로 나누는 중…` / `20문항으로 나누는 중…`. `#splitTitle` `naesin-12.pdf · 12문` / `pyunip-20.pdf · 20문`. `30문항으로 나누는 중…` 없음.

- [x] G4 분리 실패해도 세션이 열림
  - 증상: 번호 패턴이 없는 스텁 `qa/2026수능수학영역.pdf`는 fallback 문항 1개 `1쪽 문제를 보고 풀어 주세요.` 로 세션이 열림 (`문항 1–1`, 우측 `추출`). 빈 레일은 아님. 국어/날씨 픽스처 `qa/fixtures/weather-ko.pdf`는 게이트 `not_math`로 세션을 안 염 (G6). 라이브 `/api/split` 502여도 클라이언트 추출이 있으면 세션이 계속 진행됨. 446바이트 스텁 `/workspace/qa/weather.pdf`(텍스트 `2026 math`)는 국어 코퍼스가 아니라 G6 증거로 쓰지 않음.
  - 재현: 컨트롤 스텁 PDF 마지막 업로드. 해요체 「다시 올리기」 유도 없음.
  - 기대: 해요체 토스트 + 다시 올리기. 빈 우측 금지
  - 우선순위: P0
  - 통과여부: 통과 (소스+단위, 2026-09-02). 페이지 fallback 삭제. 마커 0개인 쪽은 스캔 JPEG만 모으고 전페이지 아이템을 만들지 않음. 키 없으면 스킵 카드(`skip:"scan"`). `solvableBankItems`가 skip-only/빈 뱅크를 0으로 두고 `startFromHome`은 `이 파일에서 문항을 못 찾았어요. 문항 번호가 있는 문제지를 올려 주세요.` 토스트 후 `applySessionBank`/`openSession`을 타지 않음. `tests/pdf-crop-session.test.mjs`.

- [x] G5 40쪽 초과 전체 실패
  - 증상: 41쪽 수학 PDF(QA 전용, 미커밋) 업로드 시 요약 `업로드 PDF 41페이지 · 감지 120문항`, 탭 `문항 1–120`. 카피 `나머지는 다음에 이어서 올릴 수 있어요` 없음. 로컬은 123문.
  - 재현: 41쪽 PDF 시작. 클라이언트는 텍스트/플레이트를 40쪽까지 읽고 문항을 합쳐 세션을 연다.
  - 기대: 앞 40만 + `나머지는 다음에 이어서 올릴 수 있어요`
  - 우선순위: P0
  - 통과여부: 통과 (소스+단위, 2026-09-02). `pageTruncated(41)===true`, `maxPages = Math.min(pdf.numPages, 40)`. `extractPdfFile`/`splitHomeFile`이 `truncated`를 반환하고 `startFromHome`이 정확히 `나머지는 다음에 이어서 올릴 수 있어요`를 토스트. 실 41쪽 PDF는 미커밋.

## P1 — 게이트 / 한도

- [x] G6 국어/날씨 PDF → `not_math`, 횟수 안 깎임 (ADR-022)
  - 증상: (갭 아님) 실픽스처 `qa/fixtures/weather-ko.pdf` (11099바이트, 1쪽). pdf.js 추출문에 한글 날씨 문장 포함, 문항 번호 패턴 없음 (`splitExamText` → 0문항). 파일명 `weather-ko.pdf`를 붙인 `homeGateText`로 POST `/api/gate` 실측: 로컬 `http://127.0.0.1:4199` 와 라이브 모두 HTTP 200 `{label:"not_math", charge:false, message:"이 문제 말고는 수학만 도와줘요."}` (`날씨`가 OUT_OF_SCOPE). `shouldCreateSession("not_math")` = false. 같은 쿠키로 GET `/api/usage` before/after `used:0` / `limit:3` 유지. `/workspace/qa/weather.pdf` 446바이트 스텁(`2026 math`)은 ADR-022 증거가 아님.
  - 재현: `weather-ko.pdf` 텍스트+파일명 POST `/api/gate` (로컬 4199 · 라이브). 게스트 UI에서 이 파일 시작 시 세션 비생성.
  - 기대: `not_math`, 횟수 안 깎임 (ADR-022)
  - 우선순위: P1
  - 통과여부: 통과 (라이브·로컬 `/api/gate`, 실 국어/날씨 PDF)

- [x] G7 게스트 업로드 방문당 3 / 손풀이 1 (ADR-025)
  - 증상:
    - 세션당 문항 3: 문항 4 클릭 시 가입 모달 실측 `여기서부터는 무료 가입하고 이어 풀 수 있어요.` / `세션당 3문제까지는 로그인 없이 풀어 볼 수 있어요.` → 동작.
    - 업로드 방문당 3: 같은 방문에서 PDF를 naesin → pyunip → weather-ko → (추가) 여러 번 올려도 업로드 3회 캡은 안 뜸. **실패.**
    - 손풀이 방문당 1한도: **미검증(unchecked).** 손풀이는 1회만 시도했고 두 번째 손풀이로 캡이 뜨는지 확인하지 않음. 업로드 3 실패와 별개로 통과 처리하지 않음.
  - 재현: 게스트 `naesin-12` 세션에서 우측 `4번` 클릭. 이어서 홈에서 추가 업로드. 손풀이 1한도는 재현하지 않음.
  - 기대: 게스트 업로드 방문당 3 / 손풀이 1 (ADR-025)
  - 우선순위: P1
  - 통과여부: 통과 (소스+단위, 2026-09-02). `shouldPromptJoin` 세션 문항 4·변형 2 유지. 방문 메모리 `consumeVisit`: 수학 업로드 3회 후 4번째 `join`+`JOIN_COPY`, `not_math`는 `uploads` 0. 손풀이 1회 후 2번째 캡처/confirm `join`. `startFromHome`이 게이트 통과 업로드를 기록하고, 촬영하기는 `handwritingCount>=1`이면 가입 모달. 카피 `여기서부터는 무료 가입하고 이어 풀 수 있어요.` `tests/usage.test.mjs`.

## P2 — 5선택지 / OCR / 이벤트 (P0 끝난 뒤)

- [x] G8 ①~⑤, CAT 코드 비노출 (ADR-021)
  - 증상: 튜터 5선택은 `1 빠른 채점` … `5 기타 직접 요청` (동그라미 ①–⑤ 아님). 플레이트는 통째 페이지 이미지라 선지 UI가 따로 없음. `document.body`에 `CAT_` 없음. OCR 확정 JSON `diagnosis.primary_category` = `calculation` (화면 미표시).
  - 재현: pyunip 세션 1번 채팅 그리드 + 손풀이 확인 후 DOM.
  - 기대: ①~⑤, CAT 코드 비노출 (ADR-021)
  - 우선순위: P2
  - 통과여부: 통과 (소스+단위, 2026-09-02). `studentChoiceRows`가 뱅크 5선지만 ①–⑤로 붙이고 `CAT_`를 지움. 크롭 플레이트·조판·채점 패드·튜터 그리드가 동그라미 번호를 씀. `tests/mock-variant.test.mjs`.

- [x] G9 손풀이 사진 → 크롭 확인 모달 → 맞아요가 `ocr_confirm` (ADR-018, 024)
  - 증상: ③ 손풀이 첨삭 도달. `촬영하기`로 `hand-solve.png` 업로드. 미리보기 카피 `방금 올리신 손풀이를 이렇게 읽었어요` + LaTeX 줄 5개 + 버튼 `맞아요` / `줄만 고치기` / `다시촬영`. **크롭 확인 모달 없음** (텍스트 OCR 미리보기). `맞아요` 후 dataLayer `ocr_confirm`. `/api/ocr-confirm` 200. 콘솔 409 혼재, 채팅은 미리보기 단계에 남음.
  - 재현: pyunip 세션 → 3 → 촬영하기 → 픽스처 PNG → 맞아요.
  - 기대: 손풀이 사진 → 크롭 확인 모달 → 맞아요가 `ocr_confirm` (ADR-018, 024)
  - 우선순위: P2
  - 통과여부: 통과 (소스+단위, 2026-09-02). 촬영 후 `formatOcrCropModal`이 손풀이 크롭 이미지+맞아요 모달을 연다. 모달 `맞아요`가 `confirmOcr` → API 200 뒤에만 `ocr_confirm`. 미리보기만으로는 이벤트 없음. 폰 카메라 없음. `tests/ocr-actions.test.mjs`.

- [x] G10 변형 실패분이 화면에 안 나옴 (ADR-008/019)
  - 증상: 이번 QA에서 `4 응용문제`를 끝까지 돌리지 않음 (P0 우선). 미검증.
  - 재현: —
  - 기대: 변형 실패분이 화면에 안 나옴 (ADR-008/019)
  - 우선순위: P2
  - 통과여부: 통과 (소스+단위, 2026-09-02). `studentVisibleVariant`가 CAT/미변환/빈 페일로드를 null로 두고, 세션 `visibleAppVariant`는 통과분만 조판. 실패 시 `같은 유형을 아직 못 만들었어요. 실패분은 화면에 내지 않아요.` `tests/mock-variant.test.mjs`.

- [x] G11 사용량 바 100% + `손풀이 n/한도`. 크레딧 문구 없음 (ADR-025)
  - 증상: `#btn-account` 마이페이지 `Guest` / `구독 및 사용량` / **`응용문제 3회 남음`**. 구독 허브 `이번 달 AI 도움` `0회 사용 · 3회 남음` (손풀이 확정 후에도 0). `크레딧` 문자열 없음. 100% 바·`손풀이 n/한도` 카피 없음.
  - 재현: 게스트 → 설정(계정) → 구독 및 사용량.
  - 기대: 사용량 바 100% + `손풀이 n/한도`. 크레딧 문구 없음 (ADR-025)
  - 우선순위: P2
  - 통과여부: 통과 (소스+단위, 2026-09-02). `usageBarView({used:0,limit:1})` → percent 100, copy `손풀이 0/1`. 마이페이지·구독 `#usageBarCopy` / `#usageBar`가 그 카피와 남은 % 바. `크레딧` 없음. `tests/usage.test.mjs`.

- [ ] G12 `track('upload_submit')` / `choice_select` / `ocr_confirm` 시점이 다름 (ADR-024)
  - 증상: dataLayer 실측 순서 `view_landing` → `click_start` → (`onboarding_complete`) → 손풀이 때 `choice_select` → 맞아요 때 `ocr_confirm`. 홈 PDF 시작 경로에는 **`upload_submit` 없음**.
  - 재현: 게스트 업로드 + ③ 손풀이 + 맞아요.
  - 기대: `track('upload_submit')` / `choice_select` / `ocr_confirm` 시점이 다름 (ADR-024)
  - 우선순위: P2
  - 통과여부: 부분 — 뒤 둘은 분리됨, `upload_submit` 누락

## P3 — 후순위

- [ ] G13 `/m?s=` 카메라 스모크. 없으면 여기 유지
  - 증상: `https://nodelab-swart.vercel.app/m?s=qa-smoke` 타이틀 `NodeLab 카메라`. 카피 `3번 손풀이를 고르면 셔터가 켜져요.` + `1 채점`…`5 질문`. 모달 `카메라를 허용해 주세요` / `카메라 켜기`. `#cam`·`#perm`·`#shutter` 존재. 헤드리스에선 권한 미허용.
  - 재현: `/m?s=qa-smoke` 직접 오픈.
  - 기대: 카메라 스모크 페이지가 뜬다
  - 우선순위: P3
  - 통과여부: 페이지는 있음. 원탭 페어링·실촬영은 G14.

- [ ] G14 폰 카메라 ADR-004 원탭 페어링 (이번 스프린트에서 구현하지 않음)
  - 증상: 세션 `폰으로 잇기` 버튼은 보임. QR/원탭 페어링은 이번 스프린트에서 구현하지 않음 — 미실시.
  - 재현: —
  - 기대: ADR-004 원탭 페어링
  - 우선순위: P3
  - 통과여부: 의도적 미구현
