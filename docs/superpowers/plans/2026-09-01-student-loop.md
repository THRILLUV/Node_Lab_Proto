# Student Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.  
> **Living checklist (check boxes here AND in):** `docs/eng/student-loop-checklist.md`  
> **Order lock:** login → PDF → solve → mock exam. Do not start a later task while an earlier checkbox is open.

**Goal:** Vercel 루트 앱에서 프로토와 같은 3단 UI로, 실제 로그인 후 PDF→풀이→ADR-010 모의고사까지 한 줄로 동작하게 한다.

**Architecture:** `wireframes/nodelab-proto.html` 을 루트 `index.html` 로 복사하고(원본 불변) `js/auth.js` / `js/upload.js` / `js/solve.js` / `lib/core/mock.mjs` 만 훅으로 붙인다. 이미 있는 `api/*` + `lib/core/*` + `m.html` + `js/bus.js` 는 재사용한다. NodeLab 데이터는 Supabase `nl_*` 테이블. 기존 `profiles` 는 건드리지 않는다.

**Tech Stack:** static HTML + vanilla JS + KaTeX, Vercel `api/*.mjs`, Supabase Auth + Postgres + Realtime, Gemini(없으면 mock), `node --test`.

## Global Constraints

- ADR-001–024 + 카피북이 SoT. 충돌 시 ADR.
- `wireframes/nodelab-proto.html` 수정 금지.
- 프론트 React 재작성 금지.
- 힌트/OCR/변형 화면에 `CAT_` 금지 (ADR-021 §4).
- 게이트 실패·OCR 미확인은 차감/원장 없음 (ADR-022, ADR-023).
- 원자 = 커밋. 메시지 `checkpoint: P{n}.{m} …`.
- 이메일/비밀번호는 대시보드에 소셜 키 없이도 동작해야 한다. 소셜 키 없으면 버튼 disabled. 가짜 `setTimeout` 로그인 금지.
- 기존 Supabase `public.profiles` 컬럼 변경 금지. NodeLab은 `nl_*`.
- 새 Supabase 프로젝트 생성 금지(비용). 프로젝트 `rccewveplhbgkhrxloui` 재사용.

---

## File map

| Path | Role |
|---|---|
| `docs/eng/student-loop-checklist.md` | 운영 체크리스트. 매 커밋에서 박스 갱신 |
| `slim/` | 슬림 OCR UI 롤백 복사본. Vercel이 `/` 로 쓰지 않음 |
| `index.html` | 프로토 복사본. 학생 UI |
| `items/` | `wireframes/items/` 복사. 문제판 PNG |
| `js/auth.js` | Supabase 세션, 이메일 로그인, 소셜 분기 |
| `js/upload.js` | 파일 선택, gate0, session bind |
| `js/solve.js` | OCR 미리보기/confirm/hint, 폰 페어 |
| `lib/core/profile.mjs` | `nl_profiles` upsert 페이로드 |
| `lib/core/mock.mjs` | 모드1 셔플 |
| `supabase/nl_schema.sql` | `nl_*` DDL + RLS |
| `api/*` | 이미 있음. 시그니처 유지 |
| `m.html`, `js/companion.js`, `js/bus.js` | 이미 있음 |

---

### Task P0.2: Archive slim UI

**Files:**
- Create: `slim/index.html`, `slim/app.css`, `slim/app.js`
- Modify: `docs/eng/student-loop-checklist.md` (P0.2 `[x]`, STATUS.next → P0.3)

**Interfaces:**
- Consumes: current root `index.html` (69 lines), `css/app.css`, `js/app.js`
- Produces: rollback copies under `slim/`. Root files stay until P1.2

- [x] **Step 1:** Copy the three files into `slim/`
- [x] **Step 2:** `test -f slim/index.html && wc -l slim/index.html` — expect ~69
- [x] **Step 3:** Check P0.2 in the checklist, set STATUS.next to P0.3
- [x] **Step 4:** Commit `checkpoint: P0.2 archive slim OCR UI`

---

### Task P0.3: Local PNG mime

**Files:**
- Create: `tests/dev-mime.test.mjs`
- Modify: `scripts/dev.mjs` `mime` map
- Modify: checklist P0.3

**Interfaces:**
- Produces: `scripts/dev.mjs` serves `.png` as `image/png` (and jpg/jpeg/webp/svg)

- [x] **Step 1: Failing test** for a `mimeFor(ext)` helper (extract from `dev.mjs` if needed)

```js
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mimeFor } from "../scripts/dev.mjs";

describe("dev mime", () => {
  it("serves png as image/png", () => {
    assert.equal(mimeFor(".png"), "image/png");
  });
});
```

- [x] **Step 2:** Run `node --test tests/dev-mime.test.mjs` — FAIL (export missing)
- [x] **Step 3:** Export `mimeFor` and add png/jpg/jpeg/webp/svg
- [x] **Step 4:** Test PASS. Commit `checkpoint: P0.3 local png mime`

---

### Task P1.1: Copy plates

**Files:** Create `items/q01.png`–`q30.png`, `items/page-01.png` (copy, not move)

- [x] `cp -R wireframes/items items`
- [x] `ls items | wc -l` ≥ 31
- [x] `git diff --exit-code wireframes/nodelab-proto.html`
- [x] Checklist + commit `checkpoint: P1.1 copy item plates to /items`

---

### Task P1.2: Restore proto as `/`

**Files:** Replace root `index.html` with copy of proto. Do not edit `wireframes/`.

- [x] `cp wireframes/nodelab-proto.html index.html`
- [x] `grep -c leftRail index.html` ≥ 1
- [x] `wc -l index.html` ~3556
- [x] `git diff --exit-code -- wireframes/nodelab-proto.html`
- [x] Checklist + commit `checkpoint: P1.2 restore proto as index.html`

---

### Task P1.3: Verify layout

- [x] `npm run dev` (port 4174 after mime change)
- [x] `curl -s http://127.0.0.1:4174/ | grep -c leftRail` ≥ 1 (got 1)
- [x] `curl -sI http://127.0.0.1:4174/items/q01.png` → 200 `image/png`
- [x] `wireframes/nodelab-proto.html` diff empty
- [x] Checklist `checkpoint: P1.3 verify proto layout locally`

---

### Task P2.1: `nl_*` schema + profile helper

**Files:**
- Create: `supabase/nl_schema.sql`, `lib/core/profile.mjs`, `tests/profile.test.mjs`

**Interfaces:**
- Produces:

```js
export function nlProfileRow({ id, display_name = "", exam_track = "", tutor_mode = "", tier = "free" }) {
  if (!id) throw new Error("id required");
  return { id, display_name, exam_track, tutor_mode, tier };
}
```

- SQL tables exactly: `nl_profiles`, `nl_sessions`, `nl_items`, `nl_attempts`, `nl_ocr_confirms`
- Do not `ALTER public.profiles`

- [x] Write failing test: missing `id` throws; valid payload has `tier: "free"`
- [x] Run FAIL, implement, PASS
- [x] Commit `checkpoint: P2.1 nl_* schema and profile helper`

---

### Task P2.2: Apply SQL on project `rccewveplhbgkhrxloui`

- [x] Apply `supabase/nl_schema.sql` via Supabase SQL
- [x] Describe `nl_profiles` — columns exist
- [x] Describe `profiles` — columns unchanged vs before (id, nickname, role, email, created_at, updated_at)
- [x] Commit `checkpoint: P2.2 apply nl_* on supabase`

---

### Task P2.3: Email/password on proto login card

**Files:** Create `js/auth.js`. Modify `index.html` login card + script tag. Remove the 900ms Google fake from the copied proto (root only).

**Interfaces:**
- `initAuth({ supabaseUrl, supabaseAnon })`
- `signInWithEmail(email, password)` / `signUpWithEmail(email, password)`
- `onAuth(session => …)` calls proto `enterApp()` only when `session` is non-null

- [x] Test: helper rejects empty email (pure function in `lib/core/auth-validate.mjs`)
- [x] Wire form on `#loginScreen`
- [x] Google button does **not** call `enterApp` in this task (P2.4)
- [x] Commit `checkpoint: P2.3 email password auth on proto login`

---

### Task P2.4: Social buttons real-or-disabled

- [x] If provider configured: `signInWithOAuth({ provider })`
- [x] Else: `disabled` + 사람말 “준비 중”. No timer success
- [x] Naver stays disabled until `api/auth/naver` exists
- [x] Commit `checkpoint: P2.4 social buttons real-or-disabled`

---

### Task P2.5: Persist profile + session row

- [x] After auth: upsert `nl_profiles`, insert `nl_sessions` (`entry=login`)
- [x] Guest `/m?s=` still works without auth
- [x] Commit `checkpoint: P2.5 persist profile and session on login`

---

### Task P3.1: Real file picker

**Files:** `js/upload.js`, root `index.html` `attachPdf` / `#chip-upload`

- [x] Hidden `input[type=file] accept=".pdf,image/*"`
- [x] `startFromHome` without a file does not open a session
- [x] Chip shows file name
- [x] Commit `checkpoint: P3.1 real file picker on home`

---

### Task P3.2: Gate0 before create

- [x] `POST /api/gate` for text or image
- [x] `not_math` / `unreadable` → reject card, no session, no ledger
- [x] Keep existing weather test green
- [x] Commit `checkpoint: P3.2 gate0 before session create`

---

### Task P3.3: Bind `/api/session` after split

- [x] Gate pass → `POST /api/session` → `nl_sessions` insert → existing `startSplit()`
- [x] Cookie `nl_session` not re-minted on F5 (`issueSession` already does this)
- [x] Commit `checkpoint: P3.3 bind session id after split`

---

### Task P3.4: Bind bank plates

- [x] Session 1–30 use `items/qNN.png` + `questions.json`
- [x] Plate shows original PNG only
- [x] Commit `checkpoint: P3.4 bind question bank plates`

---

### Task P4.1–P4.4: Solve loop on proto chat

Reuse `api/ocr`, `api/ocr-confirm`, `api/hint`, `js/bus.js`, `m.html`.

- [x] P4.1 Capture → OCR preview. No `phase=handDone` fake. Commit `checkpoint: P4.1 ocr preview on capture`
- [x] P4.2 맞아요 / 줄만 고치기 / 다시촬영 → `/api/ocr-confirm`. Preview does not fire `ocr_confirm`. Commit `checkpoint: P4.2 ocr confirm three actions`
- [ ] P4.3 `/api/hint`, assert no `CAT_`. `node --test tests/hint.test.mjs tests/api.test.mjs`. Commit `checkpoint: P4.3 human hint no CAT codes`
- [ ] P4.4 Proto chrome “폰으로 잇기” → `/m?s={session_id}`. Commit `checkpoint: P4.4 pair phone from proto chrome`

---

### Task P5.1–P5.4: Mock exam ADR-010

- [ ] P5.1 Replace theatrical two-card hub with three modes. `#mockBtn` does not toast-only. Commit `checkpoint: P5.1 mock hub three modes`
- [ ] P5.2 `lib/core/mock.mjs` Fisher-Yates items + choices; answer index moves. Tests first. Commit `checkpoint: P5.2 mock mode1 shuffle`
- [ ] P5.3 New `nl_sessions` row, empty attempts, original order. Commit `checkpoint: P5.3 mock mode2 clean retry`
- [ ] P5.4 Variants via `api/variant` + `questions.json`. No gen key → 10-q mini. Commit `checkpoint: P5.4 mock mode3 variants`

---

### Task P6: Persona QA

Only after P5.4. QA on proto UI, not slim.

- [ ] P6.1 수능: login → 2026 chip → split → Q1 choices → OCR → hint → mock mode1
- [ ] P6.2 독학사: login → left-rail session → loop → mock mode2
- [ ] P6.3 편입: login → transfer session → loop → mock mode3 mini
- [ ] `wireframes/nodelab-proto.html` still clean
- [ ] `npm test` 0 failures
- [ ] No `setTimeout` Google login in root `index.html`

---

## Spec coverage

| Spec | Task |
|---|---|
| 화면 트리 로그인/온보딩/홈/세션 (`docs/eng/mvp.md`) | P1, P2, P3, P4 |
| ADR-004 companion `/m` | existing + P4.4 |
| ADR-006 first item after onboarding | P2.5 + P3.4 (sample 1번) |
| ADR-010 mock 3 modes | P5 |
| ADR-018 OCR confirm | P4.2 |
| ADR-021 no CAT on screen | P4.3 |
| ADR-022 gate0 | P3.2 |
| ADR-023 ocr_confirm after confirm only | P4.2 |
| 카피북 Google 버튼 | P2.3–P2.4 |
| CF proto untouched | every task verify |

## Placeholder scan

No TBD. Social keys may be absent — handled by disabled buttons (P2.4), not a placeholder.

## Type consistency

- `session_id`: uuid string, cookie `nl_session`
- `nl_profiles.id` = `auth.users.id`
- OCR confirm `result`: `ok` \| `edit` \| `retake`
- Mock modes: `1` shuffle, `2` clean, `3` variant
