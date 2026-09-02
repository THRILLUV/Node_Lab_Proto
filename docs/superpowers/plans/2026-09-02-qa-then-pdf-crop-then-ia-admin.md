# QA → 문항 크롭 → (이후) IA·관리자 정렬 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 데모 2026 홀수형이 아닌 문제집 PDF 2종에서도 문항별 원문 크롭 + 우측 `문항 1–N`이 되게 한다. 그게 `[x]`된 뒤에만 IA v0.12 프론트와 명희 관리자 목업을 THRL 테스트 Vercel에 붙인다.

**Architecture:** 라이브 앱(`https://nodelab-swart.vercel.app`)의 분할은 텍스트 정규식(`ITEM_RE`) + 페이지 통째 플레이트 + `type: "추출"`이다. 스캔/다른 번호 체계면 정규식이 비고, 우측이 「추출」만 남는다. How는 **pdf.js 텍스트 아이템의 좌표로 문항 박스 크롭(무료)** 을 먼저 쓰고, 좌표가 없는 스캔 페이지만 **Gemini 3.7 Flash bbox**(유료 키, 게스트는 `GOOGLE_FREE_TIER_KEY`만)로 보강한다. 정책은 ADR이 이긴다. ADR 파일은 다시 쓰지 않는다.

**Tech Stack:** static HTML + vanilla JS + pdf.js + KaTeX, Vercel `api/*.mjs` (Hobby 12 function — 새 함수 만들지 말고 기존 `/api/split`에 넣음), Gemini 3.7 Flash, Supabase `nl_*`, `node --test`.

## Global Constraints

- 정책 SoT: ADR-001–014, 016–025. 충돌 시 **021 > CAT**, **025 > 요금 이름·한도·바**, **019 > 모델 id**, **022 > 업로드 게이트**, **024 > 이벤트**.
- ADR을 다시 쓰지 마라. 모델을 바꾸지 마라. CAT 코드를 학생 화면에 내지 마라.
- `wireframes/nodelab-proto.html` 원본 수정 금지. 슬림 `slim/index.html`에 기능 추가 금지.
- React 통째 재작성 금지. 가짜 `setTimeout` 로그인 금지.
- 크레딧 UI, 「프로/VIP」 이름 금지. 화면 밸브는 횟수 + 100% 사용량 바 (ADR-025).
- 게스트에 프로덕션 Gemini 키 쓰지 마라 (`GOOGLE_FREE_TIER_KEY` 또는 로컬 좌표 크롭만).
- 이번 스프린트에서 **관리자 콘솔 풀구현 금지**. 관리자·공식 레포 모듈 API는 Track B.
- 커밋 접두사 Track A: `checkpoint:`. 고친 투두는 같은 커밋에서 `[x]`.
- 배포: `npx vercel --prod` (git push가 아님). 프로젝트 `nodelab` / 라이브 `https://nodelab-swart.vercel.app`.
- Cloudflare 클릭 프로토(`nodelab-proto.indispensable-soil.workers.dev`) 깨지 말 것.
- NodeLab 테이블은 `nl_*`. `public.profiles` ALTER 금지.
- 계정: GCP는 `giftedonyou@gmail.com` / 프로젝트 Nodelab. Supabase·Vercel·GitHub는 `thrilluv`만.

---

## 지금 레포가 갈라져 있는 이유 (실행 전에 읽을 것)

| 브랜치 | 역할 | 코드 상태 |
|---|---|---|
| `cursor/nodelab-clickable-proto-58f5` | 스프린트 프롬프트·ADR-025·요금/플로우 문서 SoT. **이 계획 작성 전에 `git pull` 완료.** | P6 프로토 + 문서. `js/pdf.js` / `lib/core/pdf-split.mjs` / `api/split.mjs` / 게스트 3문항 **없음** |
| `cursor/nodelab-real-loop-58f5` | THRL 혼자 쓰는 Vercel 테스트 (`nodelab-swart`) | 게스트 3문항, Google(yrgaj), `/api/split` 텍스트 분할, 「추출」 버그 **여기 있음** |
| `cursor/nodelab-admin-2nd-58f5` | 관리자 5화면 목업 + 백엔드 시임 | `wireframes/nodelab-admin.html` (원본 프로토 HTML은 건드리지 말 것) |
| 공식 팀 레포 | 팀장 장명희 (`myunghui.jang@gmail.com`) | Gmail 초대: `myunghui/edu_logic_auditor`. 이 토큰으로는 **404**. 수락 전엔 모듈 API를 추측해서 맞추지 말 것 |

**실행 브랜치:** `cursor/nodelab-pdf-crop-58f5` 를 **`cursor/nodelab-real-loop-58f5`에서** 딴다. 클릭어블 프로토에서 crop을 짜면 라이브에 안 간다.

```bash
git fetch origin cursor/nodelab-real-loop-58f5
git checkout -b cursor/nodelab-pdf-crop-58f5 origin/cursor/nodelab-real-loop-58f5
# 스프린트 문서만 clickable-proto에서 가져온다 (ADR 내용 수정 없음)
git checkout origin/cursor/nodelab-clickable-proto-58f5 -- \
  docs/prompts/CURSOR_SPRINT_QA_THEN_PDF_SPLIT.md \
  docs/adr/ADR-025-plan-names-usage-bar.md
```

IA SoT (오늘 수정본, 2026-09-02 06:27 UTC):  
[NodeLab_정보구조도_v0.12.xlsx](https://docs.google.com/spreadsheets/d/1Hw4Na2DNFiJKJXCyMfCriHZifE4t2J2s/edit?gid=1419062998#gid=1419062998)

슬랙 MCP는 이 세션에서 discovery 실패. 공식 레포 구조는 초대 수락 후 Track B에서 다시 연다.

---

## 트랙 순서 (어기면 실패)

```
Track A (이번 스프린트, 프롬프트 그대로)
  1. QA (코드 쓰기 전) — 데모 2026 말고 PDF 2종 + 사진 1장
  2. docs/eng/qa-gaps.md 번호 투두
  3. P0 문항 크롭 + 우측 문항 1–N  (이것만 먼저)
  4. 남은 투두 위에서 아래로

Track B (P0 [x] 이후, 별도 실행)
  5. IA v0.12 학생 화면 델타 (인트로/로그인/마이페이지)
  6. 명희 관리자 목업을 /admin 으로 배포 + nl_* 읽기 연결
  7. 공식 레포 모듈 API가 보이면 그때 경로만 맞춘다
```

Track B를 Track A보다 먼저 하면 스프린트 금지 항목(관리자 풀구현)을 어긴다.

---

## File map (Track A)

| Path | Role |
|---|---|
| `docs/eng/qa-gaps.md` | QA 증상/재현/기대/ADR/우선순위 투두. 고치면 같은 커밋에서 `[x]` |
| `docs/eng/pdf-item-crop.md` | How만. 정책 문장 복사 금지. bbox 정규화·폴백 순서 |
| `lib/core/pdf-split.mjs` | `splitExamText`, `toBankItems`. `type` 기본값 `"추출"` 삭제 |
| `lib/core/bbox-crop.mjs` | **신규.** 정규화 bbox → 픽셀, 제목 `문항 N`, vision JSON 파서 |
| `lib/core/pdf-layout.mjs` | **신규.** pdf.js item `{str, x, y, w, h}` 에서 문항 마커 y절 |
| `js/pdf.js` | 페이지 렌더 + 레이아웃 크롭. 실패 시 세션 열지 않음 |
| `lib/core/pdf-extract.mjs` | 서버 텍스트 추출. 레이아웃 배열도 같이 반환 가능하게 |
| `lib/core/gemini.mjs` | `purpose === "split"` bbox 프롬프트 추가. 모델 id 변경 금지 |
| `api/split.mjs` | 기존 함수에 bbox 옵션만 추가. 새 Vercel function 금지 |
| `index.html` | `question()` 레일 라벨, `splitLines` 30 하드코딩 제거. 프로토 원본 아님 |
| `tests/pdf-split.test.mjs` | 기존 텍스트 분할 + type 기본값 |
| `tests/bbox-crop.test.mjs` | **신규** |
| `tests/pdf-layout.test.mjs` | **신규** |
| `qa/fixtures/` | 데모가 아닌 PDF 2종 + 손풀이 사진. `.gitignore`에 `qa/` 있으면 픽스처만 예외 |

Track B 파일은 Task 8 이후에만 연다.

---

## How (정책 아님 — `docs/eng/pdf-item-crop.md`에 이 순서로 적는다)

1. 클라이언트가 페이지를 canvas JPEG로 그린다 (기존 `renderPage`).
2. 같은 페이지의 pdf.js `textContent.items`를 `{str, x, y, w, h}`로 둔다. `join(" ")`만 하면 번호가 사라진다.
3. 마커: `^\s*(?:문\s*)?(\d{1,2})\s*[\.．번)]` 또는 원문자 `①`이 **문항 시작**일 때만 (보기 `1)` 과 구분 — 기존 `splitExamText` 규칙 유지).
4. 문항 n 크롭 = 마커 n의 y → 다음 마커 y (없으면 페이지 하단). x는 본문 열(왼쪽 여백~가운데). 여백 8px.
5. 마커가 페이지에 2개 미만(스캔): 로그인한 세션이거나 `GOOGLE_FREE_TIER_KEY`가 있을 때만 Gemini split. 게스트+유료키 금지. 둘 다 없으면 그 페이지는 스킵 카드.
6. 파일 전체 문항 0개면 세션을 열지 않고 `이 파일에서 문항을 못 찾았어요`.
7. 40쪽 초과는 앞 40만. 카피: `나머지는 다음에 이어서 올릴 수 있어요`.
8. 레일 제목/탭 = `문항 ${n}`. `추출` 문자열 금지.
9. 데모 `items/q01.png`–`q30.png`는 2026 칩 폴백만. 임의 업로드의 플레이트가 되면 실패.

---

### Task 0: 실행 브랜치를 real-loop에서 연다

**Files:**
- Create: (branch only)
- Modify: none

**Interfaces:**
- Consumes: `origin/cursor/nodelab-real-loop-58f5`, `origin/cursor/nodelab-clickable-proto-58f5` (docs only)
- Produces: local branch `cursor/nodelab-pdf-crop-58f5`

- [ ] **Step 1: 브랜치 생성**

```bash
cd /workspace
git fetch origin cursor/nodelab-real-loop-58f5
git checkout -b cursor/nodelab-pdf-crop-58f5 origin/cursor/nodelab-real-loop-58f5
git checkout origin/cursor/nodelab-clickable-proto-58f5 -- \
  docs/prompts/CURSOR_SPRINT_QA_THEN_PDF_SPLIT.md \
  docs/adr/ADR-025-plan-names-usage-bar.md \
  docs/superpowers/plans/2026-09-02-qa-then-pdf-crop-then-ia-admin.md
git add docs/prompts/CURSOR_SPRINT_QA_THEN_PDF_SPLIT.md \
  docs/adr/ADR-025-plan-names-usage-bar.md \
  docs/superpowers/plans/2026-09-02-qa-then-pdf-crop-then-ia-admin.md
git commit -m "docs: bring sprint prompt and crop plan onto the live test branch"
git push -u origin cursor/nodelab-pdf-crop-58f5
```

Expected: HEAD가 real-loop의 `1275e1b`(또는 그 이후) 위에 있고, `js/pdf.js`와 `lib/core/pdf-split.mjs`가 있다.

- [ ] **Step 2: 확인**

```bash
test -f js/pdf.js && test -f lib/core/pdf-split.mjs && test -f api/split.mjs
git rev-parse --abbrev-ref HEAD
```

Expected: 파일 세 개 존재, 브랜치 `cursor/nodelab-pdf-crop-58f5`.

---

### Task 1: 코드 없이 QA하고 `qa-gaps.md`를 쓴다

**Files:**
- Create: `docs/eng/qa-gaps.md`
- Create: `qa/fixtures/naesin-12.pdf`, `qa/fixtures/pyunip-20.pdf`, `qa/fixtures/hand-solve.png` (로컬 생성, 데모 2026 복제 금지)
- Test: none yet

**Interfaces:**
- Consumes: 라이브 `https://nodelab-swart.vercel.app`, 로컬 `node scripts/dev.mjs` (포트 4173)
- Produces: 번호 투두. P0은 문항 크롭

데모 컨트롤(합격 비교용, 2종에 안 넣음): `qa/2026수능수학영역.pdf`  
거절용: `qa/weather.pdf`  
다른 수학 2종: **반드시 문항 수 ≠ 30** 인 자체 픽스처. 수능 홀수형 뱅크를 다시 올리면 스프린트 실패.

픽스처 생성 스크립트(QA 때만, 커밋은 PDF 결과물):

```javascript
// scripts/qa-make-fixtures.mjs  — 이 태스크에서 만들어 돌리고, 산출 PDF만 qa/fixtures/에 둔다
import { PDFDocument, StandardFonts } from "pdf-lib"; // 없으면 순수 PDF 바이트로 12/20문항 텍스트 페이지를 직접 써도 됨
```

pdf-lib가 없으면 `tests/fixtures/exam-mini.pdf`를 복제하지 말고, 최소 PDF ASCII로 `1. ... ①` 12문항 / `1번 ...` 20문항을 만든다.

- [ ] **Step 1: 라이브에서 데모 말고 2종 + 사진을 올린다**

절차:
1. 시크릿으로 `https://nodelab-swart.vercel.app` → 게스트 시작.
2. `qa/fixtures/naesin-12.pdf` 업로드 → 시작. 우측 라벨·플레이트 스크린/DOM 기록.
3. 새로고침 후 `qa/fixtures/pyunip-20.pdf` 동일.
4. 손풀이 사진 1장 (세션 ③).
5. `qa/weather.pdf` — 거절·횟수 안 깎임.
6. 컨트롤로 2026 홀수형 칩/PDF는 **마지막에만**. 2종 대신 쓰면 안 됨.

기록 필드(항목마다): 증상 / 재현 / 기대 / 관련 ADR / 우선순위 / 통과여부.

- [ ] **Step 2: `docs/eng/qa-gaps.md` 작성**

아래 골격을 실제 QA 결과로 채운다. 추측으로 `[x]` 하지 말 것.

```markdown
# QA gaps

라이브: https://nodelab-swart.vercel.app
날짜: 2026-09-02
데모 제외 픽스처: `qa/fixtures/naesin-12.pdf`, `qa/fixtures/pyunip-20.pdf`, `qa/fixtures/hand-solve.png`

## P0 — 문항 크롭 / 우측 탭 (1순위. 이게 열리기 전엔 5선택지·OCR·CAT·페이월 추가 금지)

- [ ] G1 다른 PDF에서 우측이 「추출」
  - 증상:
  - 재현:
  - 기대: 우측 `문항 1` … `문항 N`. 「추출」 없음
  - ADR: 022 (문항 단위), 카피북 분할 화면
- [ ] G2 플레이트가 페이지 통째
  - 증상:
  - 재현:
  - 기대: 문항 박스 크롭 이미지. KaTeX 지문으로 원문 대체 금지
  - ADR: 022
- [ ] G3 문항 수 30 하드코딩
  - 증상: 탭/연출이 30
  - 재현: 12문항·20문항 PDF
  - 기대: N=실제 감지 수. `30문항으로 나누는 중…` 없음
- [ ] G4 분리 실패해도 세션이 열림
  - 기대: 해요체 토스트 + 다시 올리기. 빈 우측 금지
- [ ] G5 40쪽 초과 전체 실패
  - 기대: 앞 40만 + `나머지는 다음에 이어서 올릴 수 있어요`

## P1 — 게이트 / 한도

- [ ] G6 국어/날씨 PDF → `not_math`, 횟수 안 깎임 (ADR-022)
- [ ] G7 게스트 업로드 방문당 3 / 손풀이 1 (ADR-025)

## P2 — 5선택지 / OCR / 이벤트 (P0 끝난 뒤)

- [ ] G8 ①~⑤, CAT 코드 비노출 (ADR-021)
- [ ] G9 손풀이 사진 → 크롭 확인 모달 → 맞아요가 `ocr_confirm` (ADR-018, 024)
- [ ] G10 변형 실패분이 화면에 안 나옴 (ADR-008/019)
- [ ] G11 사용량 바 100% + `손풀이 n/한도`. 크레딧 문구 없음 (ADR-025)
- [ ] G12 `track('upload_submit')` / `choice_select` / `ocr_confirm` 시점이 다름 (ADR-024)

## P3 — 후순위

- [ ] G13 `/m?s=` 카메라 스모크. 없으면 여기 유지
- [ ] G14 폰 카메라 ADR-004 원탭 페어링 (이번 스프린트에서 구현하지 않음)
```

- [ ] **Step 3: 커밋**

```bash
git add docs/eng/qa-gaps.md qa/fixtures/naesin-12.pdf qa/fixtures/pyunip-20.pdf
git commit -m "checkpoint: QA gaps before crop work"
git push -u origin cursor/nodelab-pdf-crop-58f5
```

---

### Task 2: 크롭 수학 + 레일 제목 — 실패하는 테스트

**Files:**
- Create: `lib/core/bbox-crop.mjs` (Step 3에서)
- Create: `tests/bbox-crop.test.mjs`
- Modify: `tests/pdf-split.test.mjs`
- Modify: `lib/core/pdf-split.mjs` (Step 3에서)

**Interfaces:**
- Consumes: `toBankItems(items)` 현재 `type: it.type || "추출"`
- Produces:
  - `clampNormBox({x,y,w,h}) -> {x,y,w,h}` 각 축 0–1, w/h > 0
  - `pixelBox(box, width, height) -> {sx,sy,sw,sh}` 정수 픽셀
  - `itemType(n) -> "문항 ${n}"`
  - `parseSplitVision(json) -> {items:[{n,bbox,skip}], truncated}`
  - `toBankItems` 기본 type이 `"추출"`이 아님

- [ ] **Step 1: 실패하는 테스트**

`tests/bbox-crop.test.mjs`:

```javascript
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { clampNormBox, pixelBox, itemType, parseSplitVision } from "../lib/core/bbox-crop.mjs";

describe("clampNormBox", () => {
  it("clips to 0-1 and drops non-positive size", () => {
    assert.deepEqual(clampNormBox({ x: -0.2, y: 0.1, w: 2, h: 0.3 }), { x: 0, y: 0.1, w: 1, h: 0.3 });
    assert.equal(clampNormBox({ x: 0.2, y: 0.2, w: 0, h: 0.1 }), null);
  });
});

describe("pixelBox", () => {
  it("maps a half-page box on a 1000x2000 page", () => {
    const p = pixelBox({ x: 0.1, y: 0.2, w: 0.8, h: 0.25 }, 1000, 2000);
    assert.deepEqual(p, { sx: 100, sy: 400, sw: 800, sh: 500 });
  });
});

describe("itemType", () => {
  it("never returns 추출", () => {
    assert.equal(itemType(7), "문항 7");
    assert.notEqual(itemType(1), "추출");
  });
});

describe("parseSplitVision", () => {
  it("keeps numbered boxes and marks not_math skips", () => {
    const out = parseSplitVision({
      items: [
        { n: 1, bbox: { x: 0.1, y: 0.1, w: 0.8, h: 0.3 } },
        { n: 2, skip: "not_math" },
      ],
    });
    assert.equal(out.items.length, 2);
    assert.equal(out.items[1].skip, "not_math");
  });
});
```

`tests/pdf-split.test.mjs`에 추가:

```javascript
it("labels bank rows as 문항 N instead of 추출", () => {
  const bank = toBankItems([{ n: 4, stem: "2x+1=5 를 푸시오.", choices: [] }]);
  assert.equal(bank[0].type, "문항 4");
  assert.ok(!bank.some((row) => row.type === "추출"));
});
```

- [ ] **Step 2: 테스트가 실패하는지 본다**

```bash
node --test tests/bbox-crop.test.mjs tests/pdf-split.test.mjs
```

Expected: FAIL — `ERR_MODULE_NOT_FOUND` for `bbox-crop.mjs`, 그리고 `추출` assertion.

- [ ] **Step 3: 최소 구현**

`lib/core/bbox-crop.mjs`:

```javascript
export function clampNormBox(box = {}) {
  const x = Math.min(1, Math.max(0, Number(box.x) || 0));
  const y = Math.min(1, Math.max(0, Number(box.y) || 0));
  const w = Math.min(1 - x, Math.max(0, Number(box.w) || 0));
  const h = Math.min(1 - y, Math.max(0, Number(box.h) || 0));
  if (w < 0.02 || h < 0.02) return null;
  return { x, y, w, h };
}

export function pixelBox(box, width, height) {
  const b = clampNormBox(box);
  if (!b) return null;
  return {
    sx: Math.round(b.x * width),
    sy: Math.round(b.y * height),
    sw: Math.max(1, Math.round(b.w * width)),
    sh: Math.max(1, Math.round(b.h * height)),
  };
}

export function itemType(n) {
  return `문항 ${Number(n) || 1}`;
}

export function parseSplitVision(json = {}) {
  const items = (json.items || []).map((it, i) => ({
    n: Number(it.n) || i + 1,
    bbox: clampNormBox(it.bbox || it.box || {}),
    skip: it.skip || "",
  }));
  return { items, truncated: Boolean(json.truncated) };
}
```

`lib/core/pdf-split.mjs` `toBankItems`:

```javascript
import { itemType } from "./bbox-crop.mjs";
// type: it.type || itemType(Number(it.n) || i + 1),
```

- [ ] **Step 4: 테스트 통과**

```bash
node --test tests/bbox-crop.test.mjs tests/pdf-split.test.mjs
```

Expected: PASS.

- [ ] **Step 5: 커밋**

```bash
git add lib/core/bbox-crop.mjs lib/core/pdf-split.mjs tests/bbox-crop.test.mjs tests/pdf-split.test.mjs
git commit -m "checkpoint: item titles and bbox math, no 추출 default"
```

같은 커밋에서 `qa-gaps.md`의 G1 기대(라벨) 중 코드만 해당하면 아직 `[x]` 하지 말 것. UI 연결 전이다.

---

### Task 3: pdf.js 좌표 → 문항 y절

**Files:**
- Create: `lib/core/pdf-layout.mjs`
- Create: `tests/pdf-layout.test.mjs`

**Interfaces:**
- Consumes: `splitExamText` 마커 규칙과 같은 번호
- Produces:
  - `normalizePdfItems(items) -> [{str,x,y,w,h}]`  (y는 페이지 위=0)
  - `findItemMarkers(tokens) -> [{n, y}]`
  - `boxesFromMarkers(markers, pageW, pageH) -> [{n, bbox}]`

- [ ] **Step 1: 실패하는 테스트**

```javascript
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { findItemMarkers, boxesFromMarkers } from "../lib/core/pdf-layout.mjs";

const tokens = [
  { str: "수학", x: 40, y: 20, w: 40, h: 12 },
  { str: "1.", x: 50, y: 80, w: 16, h: 14 },
  { str: "2x+5=17", x: 70, y: 80, w: 80, h: 14 },
  { str: "2.", x: 50, y: 240, w: 16, h: 14 },
  { str: "f(x)=x^2", x: 70, y: 240, w: 80, h: 14 },
];

describe("findItemMarkers", () => {
  it("uses 1. / 2. starts and ignores leftover words", () => {
    const marks = findItemMarkers(tokens);
    assert.deepEqual(marks.map((m) => m.n), [1, 2]);
    assert.equal(marks[0].y, 80);
  });
});

describe("boxesFromMarkers", () => {
  it("crops from marker y to the next marker y", () => {
    const boxes = boxesFromMarkers(findItemMarkers(tokens), 400, 600);
    assert.equal(boxes.length, 2);
    assert.ok(boxes[0].bbox.h > 0.2);
    assert.ok(boxes[0].bbox.y < boxes[1].bbox.y);
  });
});
```

- [ ] **Step 2: 실패 확인**

```bash
node --test tests/pdf-layout.test.mjs
```

Expected: FAIL module not found.

- [ ] **Step 3: 구현**

`lib/core/pdf-layout.mjs` — 마커 정규식은 `/(?:^|\s)(?:문\s*)?(\d{1,2})\s*[\.．번]/` 만. `1)` 보기는 마커가 아님. y 정규화는 `y / pageH`. 박스 높이 최소 0.08.

- [ ] **Step 4: 통과 후 커밋**

```bash
node --test tests/pdf-layout.test.mjs tests/bbox-crop.test.mjs tests/pdf-split.test.mjs
git add lib/core/pdf-layout.mjs tests/pdf-layout.test.mjs
git commit -m "checkpoint: layout markers to per-item boxes"
```

---

### Task 4: 클라이언트 크롭을 세션에 붙인다

**Files:**
- Modify: `js/pdf.js` (`extractPdfFile`, `applySessionBank`)
- Modify: `index.html` (`question()` title/concept, `splitLines` 4번째 줄, `renderRecognition` fallback 30)
- Create: `docs/eng/pdf-item-crop.md`

**Interfaces:**
- Consumes: `boxesFromMarkers`, `pixelBox`, `itemType`, `toBankItems`
- Produces: 각 item.plate = 크롭 data URL. `window.NL.sessionItems.length === N` (30 아님)

- [ ] **Step 1: `extractPdfFile`이 페이지 통째 plate를 문항 plate로 바꾸게**

`js/pdf.js` 루프:
1. `page.getTextContent()` → token 배열 (transform `[a,b,c,d,e,f]` 에서 x=e, y = viewport.height - f — pdf.js는 아래가 0).
2. `findItemMarkers` → `boxesFromMarkers`.
3. 같은 canvas에서 `pixelBox`로 `drawImage` 크롭 → `toDataURL("image/jpeg", 0.85)`.
4. `toBankItems`에 `{n, stem, plate, type: itemType(n)}`.
5. 마커 0이고 이미지만 있으면 그 페이지는 스킵(스캔은 Task 5). 파일 전체 0이면 `{items:[]}`.
6. **페이지당 1장 fallback을 삭제한다.** 그게 「추출」+통째 플레이트의 원인이다.

`index.html`:
- `title` / `concept`: `it.type || ("문항 " + it.n)` — `"추출"` 리터럴 삭제.
- `splitLines` 네 번째: `count + "문항으로 나누는 중…"`.
- `renderRecognition` total: `items.length`. `|| 30` 삭제.
- `openSession(skipSplit)` visibleTabs: `sessionItems.length`. `|| 30` 삭제.

`docs/eng/pdf-item-crop.md`에 Task 상단 How 9줄을 그대로 옮긴다. ADR 문장 재작성 금지.

- [ ] **Step 2: 로컬에서 12문항·20문항 PDF로 확인**

```bash
node scripts/dev.mjs
# 브라우저: 게스트 시작 → naesin-12.pdf → 우측 문항 1–12, 1번 플레이트 높이 < 페이지 높이
# pyunip-20.pdf → 문항 1–20. 「추출」 0건
```

Expected: 탭 텍스트 `문항 1–12` / `문항 1–20`. `document.body.innerText`에 `추출` 없음.

- [ ] **Step 3: 전체 테스트 + 커밋 + qa-gaps G1–G3 중 재현된 것 `[x]`**

```bash
node --test
git add js/pdf.js index.html docs/eng/pdf-item-crop.md docs/eng/qa-gaps.md
git commit -m "checkpoint: crop uploaded PDFs into 문항 1–N tabs"
```

---

### Task 5: 스캔 페이지 + 40쪽 + 실패 UX + (가드된) Gemini bbox

**Files:**
- Modify: `lib/core/gemini.mjs` (`purpose === "split"`)
- Modify: `api/split.mjs`
- Modify: `js/pdf.js` (`splitHomeFile`)
- Modify: `index.html` (`startFromHome` 실패 카피)
- Test: `tests/api.test.mjs` 또는 신규 `tests/split-vision.test.mjs` — **실제 Gemini 호출 없이** parse + purpose 분기만

**Interfaces:**
- Consumes: `geminiVision({ imageB64, purpose: "split" })`, `parseSplitVision`
- Produces: `/api/split`가 `{ pages: [{ n, image_b64 }] }` 를 받아 `{ items:[{n,bbox,skip}] }` 반환. pdf_b64 전체 재전송은 4.5MB 한도 때문에 페이지 JPEG만.

게스트: `process.env.GOOGLE_FREE_TIER_KEY` 없으면 스캔 페이지는 스킵 카드. 유료 `GEMINI_API_KEY`로 게스트 split 하지 말 것.

split 프롬프트 (모델 id 그대로 `gemini-3.7-flash`):

```
이 시험지 사진에서 수학 문항 박스만 찾아 JSON만 답하세요.
{"items":[{"n":1,"bbox":{"x":0,"y":0,"w":1,"h":1},"skip":""}],"truncated":false}
bbox는 페이지 대비 0~1. 수학이 아니면 skip="not_math". CAT 코드 금지.
```

40쪽: 클라이언트 `maxPages = 40`. `pdf.numPages > 40`이면 토스트 `나머지는 다음에 이어서 올릴 수 있어요`.

- [ ] **Step 1: 키 없이 parse 테스트**

```javascript
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseSplitVision } from "../lib/core/bbox-crop.mjs";

it("drops garbage boxes from a model-shaped payload", () => {
  const out = parseSplitVision({ items: [{ n: 3, bbox: { x: 0.05, y: 0.4, w: 0.9, h: 0.2 } }] });
  assert.equal(out.items[0].n, 3);
  assert.ok(out.items[0].bbox);
});
```

- [ ] **Step 2–4:** 구현 → `node --test` → 스캔 픽스처(텍스트 레이어 없는 1페이지)로 로컬 확인.

- [ ] **Step 5: 커밋**

```bash
git commit -m "checkpoint: scan-page bbox split behind free-tier key"
```

`qa-gaps.md` G2/G4/G5 재QA 후 `[x]`.

---

### Task 6: README + 라이브 배포 + P0 닫기

**Files:**
- Modify: `README.md` — 다른 PDF로 시험하는 방법 한 단락
- Modify: `docs/eng/qa-gaps.md` — P0 `[x]`

- [ ] **Step 1: README에 추가**

```markdown
## 다른 문제집으로 분할 시험

데모 `items/q01.png`만 보고 통과로 치지 마세요.

1. `npm start` 또는 라이브에서 게스트로 들어갑니다.
2. `qa/fixtures/naesin-12.pdf` 또는 `qa/fixtures/pyunip-20.pdf`를 올립니다.
3. 진행 카피가 `시험지를 문항별로 나누고 있어요` / `N문항으로 나누는 중…`인지 봅니다. `30문항` 고정이면 실패입니다.
4. 우측이 `문항 1`–`문항 N`인지, 1번을 눌렀을 때 상단이 그 문항 크롭인지 봅니다.
5. 「추출」이 보이면 실패입니다.
```

- [ ] **Step 2: 엔진 없이 프로덕션 배포**

기존과 같이 `/tmp/nodelab-ship` 복사본에서 `npx vercel --prod`. `engine/`, `api/verify.py` 제외. Hobby 12 function.

- [ ] **Step 3: 라이브에서 12·20문항 다시 QA.** P0 전부 `[x]`일 때만 커밋.

```bash
git add README.md docs/eng/qa-gaps.md
git commit -m "checkpoint: P0 crop verified on non-demo PDFs"
git push -u origin cursor/nodelab-pdf-crop-58f5
```

라이브 URL이 바뀌면 채팅에 명시. Workers 프로토는 그대로.

---

### Task 7: P0 다음 투두만, 위에서 아래로

P0이 `[x]`가 아니면 이 태스크를 열지 마라.

순서: G6 게이트 → G7 게스트 한도(이미 real-loop에 있으면 QA만) → G8–G12.  
G13–G14 폰은 구현하지 않고 투두에 남긴다.

한 갭 = 한 커밋 `checkpoint:`. 리팩터만 하는 커밋 금지.

---

## Track B — P0 닫힌 뒤에만 (별도 실행)

스프린트 문구: **관리자 콘솔 풀구현 금지.** 아래는 다음 원자 묶음이다. Track A와 같은 커밋에 넣지 마라.

### Task 8: IA v0.12 학생 화면 델타

**SoT:** `NodeLab_정보구조도_v0.12.xlsx` (gid `1419062998`). 1 = 데모데이.

데모데이 학생 쪽 (박태희 담당, 이 테스트 앱):

| 화면 | v0.12 | 지금 real-loop | 작업 |
|---|---|---|---|
| 인트로 | 게스트도 가운데에서 학습 시작. 저장·지난기록·마이페이지는 로그인 창 | 게스트 시작 있음 | 카피/히어로만 IA에 맞춤. 카드 4번 저장 약속은 가입 후로 |
| 로그인 | 구글·카카오·네이버만. 첫 가입 → 온보딩. 게스트 기록 안 넘어감 | Google 실연동, 카카오/네이버 준비 중 | 키 없이 버튼 켜지 말 것. 게스트→회원 이관 없음 유지 |
| 마이페이지 | 이름·이메일 읽기전용. 설정 탭. 로그아웃 → 빈 인트로 | 게스트 목업 제거됨 | 설정 탭 껍데기만. 결제 실연동 금지 |
| 온보딩 OB-00–05 | 손소연/김홍. 레벨테스트형 3–5문항 | 없음 | **홍/소연 화면. 이번 앱에서 풀구현하지 않음.** 첫 Google 후 5선택 온보딩(ADR·플로우 02)만 최소 |
| 문제풀이 SCR510 | 김홍 | 5선택지 있음 | 크롭 P0가 전제. IA 폴더명 `solving`은 라우팅이 아니라 정보구조 |

우선순위 2(추후): AI 서비스 관리, 로그, 운영 정책. 결제 SCR610–660은 구조만.

카피 충돌: 플로우 설계서 09행에 `Pro 페이월`이 남아 있다. **ADR-025가 이긴다** — 베이직/헤비. ADR 파일을 고쳐서 맞추지 말고 화면 카피만 고친다.

### Task 9: 관리자 목업을 THRL Vercel에 배포 + nl_* 읽기

**목업 SoT (이 레포):** `cursor/nodelab-admin-2nd-58f5` → `wireframes/nodelab-admin.html`  
복사본: `admin.html` (또는 `/admin`). **`wireframes/nodelab-proto.html` 수정 금지.**

IA v0.12 서비스관리 데모데이 1순위:

| 화면ID | 내용 | 백엔드 |
|---|---|---|
| SCR810 | 회원 가입 현황 | `nl_profiles` / auth users 카운트. 없으면 목업 숫자 + `source: mock` |
| SCR820 | 회원 구독/결제 | `nl_billing` 읽기. 결제 실행 없음 |
| SCR830 | 환불 / AI 사용량·원가 (시트에 ID 중복 — 화면 두 개로 쪼갬) | `nl_events` 집계. 토큰 원가는 장부 필드만 |
| SCR840 | 고객 요청 / 사용자행동 | 큐 테이블 없으면 목업 리스트 |
| SCR850 | VOC | 목업 |
| SCR910 | 관리자 계정/권한 | 로컬 allowlist. 학생 세션과 섞지 말 것 |

연결: `GET /api/admin/summary.mjs` 하나. Hobby 한도 때문에 admin을 모듈별로 쪼개지 말 것. **공식 레포가 모듈 API를 공개하면 그때 프록시만 갈아끼운다.**

인증: 쿼리 `?k=` 또는 env `NL_ADMIN_KEY`. 학생 Google과 공유하지 말 것.

### Task 10: 공식 레포가 열린 뒤 환경만 맞춘다

1. `myunghui/edu_logic_auditor` 초대 수락 여부 확인. 404면 중단하고 URL을 채팅에 적는다.
2. 모듈 폴더/라우트 표를 `docs/eng/official-api-map.md`에만 적는다 (ADR 아님).
3. THRL Vercel env는 계속 yrgaj + nodelab-swart. 공식 키를 이 테스트 프로젝트에 넣지 말 것.
4. 프론트 fetch 경로만 맵에 맞게. 공식 DB를 이 앱의 쓰기 대상으로 바꾸지 말 것.

---

## Self-review

1. **Spec coverage (스프린트 §0–6):** pull → QA 2종+사진 → qa-gaps → P0 crop first → checkpoint 커밋 → README 시험 단락 → 라이브 URL. ADR 재작성 없음. 관리자 풀구현은 Track B로 분리.
2. **IA v0.12 / 명희 공식 / 슬랙:** Track B. 슬랙 MCP 다운, 공식 레포 404 — 추측 구현 금지.
3. **Placeholder scan:** 픽스처는 생성 방법으로 명시. How는 좌표 크롭 → 가드된 vision.
4. **Type consistency:** `clampNormBox` / `pixelBox` / `itemType` / `parseSplitVision` / `findItemMarkers` / `boxesFromMarkers` 이름을 Task 2–5에서 그대로 쓴다. `추출`은 기본값에서 제거.

---

## 실행 선택

이 계획이 `docs/superpowers/plans/2026-09-02-qa-then-pdf-crop-then-ia-admin.md`에 있다.

1. **Subagent-Driven (권장)** — 태스크마다 새 서브에이전트, 사이 리뷰
2. **Inline Execution** — 이 세션에서 executing-plans로 Task 0부터

Track A만 먼저. Track B는 P0 `[x]` 후에 새 계획 없이 이 문서 Task 8–10을 이어서 연다.
