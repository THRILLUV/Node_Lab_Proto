# NodeLab 학생 루프 — 원자 체크리스트

> **한 줄 규칙:** `로그인 → PDF 업로드 → 문항 풀이 → 모의고사` 만 순서대로 한다.  
> 앞 단계가 `[ ]` 이면 뒤 단계를 시작하지 않는다.  
> 원자 하나 = 커밋 하나. 커밋 메시지 접두사 `checkpoint:`.  
> 이 파일의 체크박스는 **같은 커밋에서** `[x]` 로 바꾼다.

```
STATUS
phase: P6
next: none
blocked_by: none
last_checkpoint: P6.3
```

---

## 0. 이 파일을 어떻게 쓰는가

1. `STATUS.next` 가리키는 원자만 연다.
2. **선행** 이 모두 `[x]` 인지 확인한다. 아니면 거기로 돌아간다.
3. **작업** 을 그대로 한다. 옆 원자와 합치지 않는다.
4. **검증** 명령을 실행하고 출력을 읽는다. 실패하면 다음으로 가지 않는다.
5. 이 파일에서 해당 원자를 `[x]` 로 바꾸고 `STATUS` 를 다음 번호로 올린다.
6. `checkpoint: P1.2 …` 로 커밋하고 push 한다.
7. 롤백: `git log --oneline --grep checkpoint` 에서 지점을 고른 뒤  
   `git revert <sha>` (안전) 또는 `git checkout <sha> -- <path>`.

### 절대 금지

- `wireframes/nodelab-proto.html` 수정 (클라우드플레어 클릭 프로토 SoT).
- 슬림 `index.html`(69줄 랜딩)에 기능을 더 붙이는 것. 그건 우회였다.
- 로그인 없이 PDF/풀이/모의고사를 “일단 돌아가게” 만드는 것.
- Google 클릭을 `setTimeout` 후 `enterApp()` 하는 가짜 로그인 유지.
- 힌트/OCR 응답에 `CAT_` 코드 노출.
- 기존 Supabase `profiles`(다른 앱 nickname/role) 컬럼을 덮어쓰는 것. NodeLab은 `nl_*`.

### 이미 재사용 가능한 것 (다시 만들지 말 것)

| 자산 | 위치 | 비고 |
|---|---|---|
| 프로토 UI SoT | `wireframes/nodelab-proto.html` | 복사만. 원본 불변 |
| 문항 이미지 | `wireframes/items/q01.png`–`q30.png`, `page-01.png` | Vercel 루트 `items/` 로 복사 |
| 문항 뱅크 | `questions.json` | 목업 OCR/변형 |
| API | `api/{session,gate,ocr,ocr-confirm,hint,variant,config}.mjs` | 슬림 UI에만 연결되어 있음 |
| 코어 | `lib/core/{gate,ocr,hint,session,http,gemini}.mjs` | `npm test` 대상 |
| 폰 컴패니언 | `m.html`, `js/companion.js` | `/m?s=` |
| 세션 버스 | `js/bus.js` | BroadcastChannel + `nl_events` |
| Realtime 테이블 | Supabase `nl_events` | 이미 있음. 세션/유저 테이블은 없음 |

---

## 1. 요청 순서 vs 실제 (정직 표)

| # | 요청한 순서 | 지금 | 증거 |
|---|---|---|---|
| 1 | 로그인 (Google/Kakao/Naver + 이메일, Supabase Auth) | **안 됨** | 프로토 `#btn-google-login` 은 900ms 후 `enterApp()`. 슬림 UI는 로그인 화면 없음. `signInWith` 코드 0건 |
| 2 | 프로필/세션 DB | **부분** | `nl_events` 만 있음. `nl_sessions` / `nl_profiles` / `nl_items` 없음 |
| 3 | 홈 3단 UI (좌측 세션 레일) | **안 됨** | 루트 `index.html` 69줄. `#leftRail` 없음 |
| 4 | PDF 업로드 → 분할 → 세션 | **연극** | `attachPdf()` 가 칩만 켠다. 파일 input 없음 |
| 5 | 5선택지 + OCR 미리보기 + 힌트 | **슬림에만** | `js/app.js` + `api/ocr*`. 프로토 `data-action=capture` 는 `phase=handDone` 가짜 |
| 6 | 폰으로 잇기 `/m` | **슬림에만** | `m.html` 동작. 프로토 크롬에 QR 없음 |
| 7 | 실전 모의고사 ADR-010 3모드 | **안 됨** | `#mockBtn` → `openHub("mock")` → `create-mock` 토스트만 |
| 8 | 페르소나 QA (수능/독학사/편입) | **안 됨** | UI가 프로토가 아니라서 미실시 |

**결론:** 이전에 슬림 OCR부터 가서 순서가 틀렸다. 이 체크리스트가 순서를 복구하는 단일 워크플로우이다.

---

## P0 — 롤백 지점 고정

선행 없이 지금 바로 한다.

### P0.1 이 워크플로우 문서를 커밋한다

- [x] **완료 조건:** `docs/eng/student-loop-checklist.md` 와 `docs/superpowers/plans/2026-09-01-student-loop.md` 가 HEAD에 있다.
- **검증:** `test -f docs/eng/student-loop-checklist.md && git log -1 --oneline`
- **커밋:** `checkpoint: P0.1 student-loop workflow checklist`

### P0.2 슬림 OCR MVP를 롤백 파일로 보존한다

- [x] **선행:** P0.1
- **작업:** 현재 루트 `index.html`(69줄), `css/app.css`, `js/app.js` 를 지우지 말고 옆에 복사한다.
  - `index.html` → `slim/index.html`
  - `css/app.css` → `slim/app.css`
  - `js/app.js` → `slim/app.js`
- **완료 조건:** `slim/` 이 있고 루트 파일을 아직 프로토로 덮지 않았다.
- **검증:** `test -f slim/index.html && wc -l slim/index.html` → 약 69
- **커밋:** `checkpoint: P0.2 archive slim OCR UI`

### P0.3 로컬 서버가 PNG를 깨지지 않게 내게 한다

- [x] **선행:** P0.2
- **파일:** `scripts/dev.mjs`
- **작업:** `mime` 에 `.png` `.jpg` `.jpeg` `.webp` `.svg` 를 넣는다. 구현 전에 `tests/dev-mime.test.mjs` 가 실패하는지 확인.
- **완료 조건:** `node --test tests/dev-mime.test.mjs` PASS. `http://127.0.0.1:4173/items/q01.png` 가 나중에 200이 될 준비.
- **커밋:** `checkpoint: P0.3 local png mime`

---

## P1 — 프로토 UI를 Vercel 루트로 복원

로그인 버튼을 만지기 전에, 학생이 보는 화면이 프로토와 같아야 한다.

### P1.1 문항 이미지를 루트 `items/` 로 복사한다

- [x] **선행:** P0.3
- **작업:** `cp -R wireframes/items items` (`wireframes/` 원본은 그대로).
- **완료 조건:** `items/q01.png` … `items/q30.png`, `items/page-01.png` 존재.
- **검증:** `ls items | wc -l` → 31 이상
- **커밋:** `checkpoint: P1.1 copy item plates to /items`

### P1.2 프로토 HTML을 루트 `index.html` 로 복사한다

- [x] **선행:** P1.1
- **작업:** `cp wireframes/nodelab-proto.html index.html`. `wireframes/nodelab-proto.html` 은 diff 0.
- **완료 조건:** 루트 `index.html` 에 `#leftRail`, `#btn-google-login`, `#mockBtn`, `#chip-upload` 가 있다. 줄 수 ≈ 3556.
- **검증:**
  ```bash
  git diff --exit-code wireframes/nodelab-proto.html
  grep -c leftRail index.html   # >= 1
  wc -l index.html              # ~3556
  ```
- **커밋:** `checkpoint: P1.2 restore proto as index.html`

### P1.3 로컬에서 3단 레이아웃이 켜지는지 확인한다

- [x] **선행:** P1.2
- **작업:** `npm run dev`. 랜딩 → (가짜 로그인 그대로) → 홈. 좌측 `+ 새 자습 세션`, 가운데 컴포저, `#chip-upload` 보임.
- **완료 조건:** 스크린샷 또는 curl 로 `index.html` 이 proto 마크업을 주는지 기록.
- **검증:** `curl -s http://127.0.0.1:4173/ | grep -c leftRail` → >= 1  
  `curl -sI http://127.0.0.1:4173/items/q01.png` → 200
- **커밋:** `checkpoint: P1.3 verify proto layout locally` (검증만이면 체크만 하고 빈 커밋 만들지 말 것. 수정이 있으면 그 수정과 함께)

---

## P2 — 로그인 + Supabase (PDF보다 먼저)

가짜 `enterApp()` 을 실제 세션으로 바꾼다. 소셜 키가 없어도 **이메일/비밀번호는 동작**해야 한다.

### P2.1 NodeLab 테이블 SQL을 테스트와 함께 고정한다

- [x] **선행:** P1.3
- **생성:** `supabase/nl_schema.sql`, `lib/core/profile.mjs`, `tests/profile.test.mjs`
- **스키마 (이 이름만 쓴다):**
  - `nl_profiles` — `id uuid PK` = `auth.users.id`, `tier text default 'free'`, `exam_track text`, `tutor_mode text`, `display_name text`, `created_at`
  - `nl_sessions` — `id uuid PK`, `user_id uuid null`, `entry text`, `exam_key text`, `started_at`, `ended_at`
  - `nl_items` — `id`, `session_id`, `item_index int`, `concept_name`, `source`
  - `nl_attempts` — `id`, `item_id`, `choice`, `created_at`
  - `nl_ocr_confirms` — `id`, `item_id`, `result`, `confidence`, `confirmed_at`
  - 기존 `public.profiles` 는 ALTER 하지 않는다.
- **완료 조건:** `upsertNlProfile({ id, display_name })` 가 순수 함수/헬퍼 테스트로 통과. SQL 파일이 위 테이블을 만든다.
- **커밋:** `checkpoint: P2.1 nl_* schema and profile helper`

### P2.2 스키마를 Supabase 프로젝트에 적용한다

- [x] **선행:** P2.1
- **프로젝트:** `rccewveplhbgkhrxloui` (PM grid). 새 프로젝트 만들지 말 것(비용 확인 필요).
- **작업:** `nl_schema.sql` 적용. RLS: 본인 `nl_profiles`/`nl_sessions` 읽고쓰기, 게스트 세션은 `user_id is null` + 세션 id 소유 쿠키.
- **완료 조건:** `nl_profiles` 테이블 describe 가 컬럼을 돌려준다. `profiles` 컬럼 집합이 적용 전과 같다.
- **커밋:** `checkpoint: P2.2 apply nl_* on supabase`
- **적용 메모:** migration `nl_core_tables` on `rccewveplhbgkhrxloui`. `nl_profiles/sessions/items/attempts/ocr_confirms` 존재. `profiles` 컬럼 그대로: id, nickname, role, email, created_at, updated_at.

### P2.3 이메일/비밀번호 로그인 UI를 프로토 카드에 붙인다

- [x] **선행:** P2.2
- **파일:** `index.html` 로그인 카드 (`#loginScreen`). 어댑터는 `js/auth.js` (인라인 거대 스크립트에 한 줄 훅만).
- **작업:** `[이메일로 계속하기]` 필드 + 가입/로그인. 카피북: 버튼은 **Google로 계속하기** 유지. 이메일은 보조.
- **완료 조건:** 콘솔에 새 OAuth 앱을 안 만들어도 `signUp`/`signInWithPassword` 가 세션을 만든다. 실패 시 사람말 에러.
- **검증:** 로컬에서 가입 → `enterApp()` 이 `authenticated` + supabase session 있을 때만 호출됨.
- **커밋:** `checkpoint: P2.3 email password auth on proto login`

### P2.4 Google / Kakao / Naver 버튼을 진짜 상태에 연결한다

- [x] **선행:** P2.3
- **작업:**
  - 대시보드에 제공자 키가 있으면 `signInWithOAuth`.
  - 없으면 버튼을 disabled 하고 “준비 중” — **가짜 성공 금지**.
  - 네이버는 `api/auth/naver` 가 생길 때까지 disabled.
- **완료 조건:** 키 없는 환경에서 Google을 눌러도 `enterApp()` 이 호출되지 않는다.
- **커밋:** `checkpoint: P2.4 social buttons real-or-disabled`

### P2.5 로그인 성공 시 `nl_profiles` + `nl_sessions` 한 줄을 남긴다

- [x] **선행:** P2.4
- **파일:** `js/auth.js`, 필요 시 `api/session.mjs` 가 `user_id` 를 받게
- **완료 조건:** 로그인 후 `nl_profiles` 에 upsert, `nl_sessions` 에 `entry=login` 행. 게스트 `/m?s=` 페어링은 그대로 허용.
- **커밋:** `checkpoint: P2.5 persist profile and session on login`

---

## P3 — PDF 업로드 → 세션

로그인한 뒤에만 홈에서 업로드를 실제 파일로 받는다.

### P3.1 홈 칩/첨부 버튼이 실제 `input[type=file]` 을 연다

- [x] **선행:** P2.5
- **파일:** `index.html` `#chip-upload`, `#btn-attach`, `#lbl-attach`
- **작업:** `attachPdf()` 연극을 `accept=.pdf,image/*` 파일 선택으로 교체. 선택 전엔 `startFromHome` 이 세션을 열지 않음(칩만 켜던 동작 제거).
- **완료 조건:** 파일 없이 전송 시 세션이 안 열리고, 파일 선택 시 칩에 파일명이 보인다.
- **커밋:** `checkpoint: P3.1 real file picker on home`

### P3.2 업로드에 게이트0을 건다

- [x] **선행:** P3.1
- **파일:** `js/upload.js`, `api/gate.mjs` (기존)
- **작업:** 텍스트/이미지 → `POST /api/gate`. `not_math`/`unreadable` 이면 세션 생성 없음, 차감 없음 (ADR-022).
- **완료 조건:** “오늘 날씨” 입력은 거절 카드. 수학 PDF/기본 칩(2026 수능)은 통과.
- **검증:** 기존 `tests/api.test.mjs` gate 케이스 유지 + 업로드 헬퍼 테스트.
- **커밋:** `checkpoint: P3.2 gate0 before session create`

### P3.3 통과 후 `/api/session` + `nl_sessions` 행 + 분할 연극

- [x] **선행:** P3.2
- **작업:** 게이트 통과 → `POST /api/session` → `nl_sessions` insert (`exam_key`, `user_id`) → 기존 `startSplit()` UX 유지 → 세션 화면.
- **완료 조건:** F5 해도 쿠키 `nl_session` 이 재발급되지 않음 (`lib/core/session.mjs` 기존 동작). 화면은 프로토 분할→문항 1.
- **커밋:** `checkpoint: P3.3 bind session id after split`

### P3.4 기본 뱅크를 문항판에 묶는다

- [x] **선행:** P3.3
- **작업:** `questions.json` + `items/qNN.png` 를 세션 30문에 매핑. 문제판은 원본 PNG만 (프로토와 동일).
- **완료 조건:** 문항 1–30 탭이 각각의 `items/qNN.png` 를 보여준다.
- **커밋:** `checkpoint: P3.4 bind question bank plates`

---

## P4 — 풀이 루프 (프로토 채팅에 API 연결)

슬림 `js/app.js` 를 화면에 쓰지 않는다. 프로토 채팅 훅에 API만 붙인다.

### P4.1 `촬영하기` 가 `/api/ocr` 을 호출한다

- [x] **선행:** P3.4
- **파일:** `js/solve.js`, `index.html` `data-action="capture"`
- **작업:** 가짜 `phase=handDone` 삭제. 이미지(데모 손풀이 또는 파일) → OCR 미리보기 카드.
- **완료 조건:** 미리보기에 줄/라텍스. `GEMINI_API_KEY` 없으면 `X-NL-Mock: 1` 목업.
- **커밋:** `checkpoint: P4.1 ocr preview on capture`

### P4.2 맞아요 / 줄만 고치기 / 다시촬영

- [x] **선행:** P4.1
- **작업:** ADR-018. `ok`/`edit`/`retake` → `POST /api/ocr-confirm`. 미리보기에서 `ocr_confirm` 이벤트 금지 (ADR-023).
- **완료 조건:** 미리보기 없음 + confirm → 409 (기존 테스트). 확인 후에만 다음 카드.
- **커밋:** `checkpoint: P4.2 ocr confirm three actions`

### P4.3 힌트 카드 — 사람말만

- [x] **선행:** P4.2
- **작업:** `POST /api/hint`. 응답 JSON/화면 어디에도 `CAT_` 없음.
- **검증:** `node --test tests/hint.test.mjs tests/api.test.mjs`
- **커밋:** `checkpoint: P4.3 human hint no CAT codes`

### P4.4 프로토 세션 크롬에 “폰으로 잇기” QR

- [x] **선행:** P4.3
- **작업:** 슬림 페어 모달을 프로토 세션 상단으로 옮긴다. URL `/m?s={session_id}`. `js/bus.js` 재사용.
- **완료 조건:** PC에서 QR/링크 → `/m` 오버레이. `wireframes/` 불변.
- **커밋:** `checkpoint: P4.4 pair phone from proto chrome`

---

## P5 — 실전 모의고사 (ADR-010)

풀이 루프가 한 문항이라도 확인된 뒤에 허브를 진짜로 만든다.

### P5.1 모의고사 허브를 3모드로 교체한다

- [x] **선행:** P4.4
- **파일:** `index.html` `renderHub("mock")`, `#mockBtn`
- **작업:** 연극 카드 2장 삭제. 모드1 셔플 / 모드2 원본 재풀이 / 모드3 변형. 카피는 ADR-010.
- **완료 조건:** `#mockBtn` 과 `create-mock` 이 모드 선택을 연다. 토스트만으로 세션을 바꾸지 않는다.
- **커밋:** `checkpoint: P5.1 mock hub three modes`

### P5.2 모드 1 — 클라이언트 셔플 ($0)

- [x] **선행:** P5.1
- **생성:** `lib/core/mock.mjs`, `tests/mock.test.mjs`
- **작업:** Fisher-Yates로 문항 순서 + 5보기 순서. 답 인덱스도 같이 이동.
- **완료 조건:** 같은 시드면 같은 순열. 보기 셔플 후 정답 번호가 따라간다.
- **커밋:** `checkpoint: P5.2 mock mode1 shuffle`

### P5.3 모드 2 — 클린 재도전 ($0)

- [x] **선행:** P5.2
- **작업:** 같은 `exam_key` 새 `nl_sessions` 행. attempts/ocr 비움. 문항 순서·보기 원본.
- **완료 조건:** 이전 채점/힌트가 새 세션 채팅에 안 남는다.
- **커밋:** `checkpoint: P5.3 mock mode2 clean retry`

### P5.4 모드 3 — 변형 (키 없으면 Free 10문 미니)

- [x] **선행:** P5.3
- **작업:** `questions.json` variants + `POST /api/variant`. 생성 키 없으면 10문. CAT 비노출.
- **완료 조건:** Free 기본 10문. Pro/키 있으면 30문 자리만 열고 실패 시 정적 백업.
- **커밋:** `checkpoint: P5.4 mock mode3 variants`

---

## P6 — 커밋된 앱으로 페르소나 QA

구현을 “다 됐다”고 말하기 전에만 한다. 슬림 UI로 QA 하지 않는다.

### P6.1 수능 페르소나

- [x] **선행:** P5.4
- **경로:** 로그인 → 2026 수능 PDF 칩 → 분할 → 1번 5선택지 → OCR → 힌트 → 모의고사 모드1
- **커밋:** 실패 수정이 있으면 `checkpoint: P6.1 suneung qa fix`, 없으면 체크만

### P6.2 검정고시·독학사 페르소나

- [x] **선행:** P6.1
- **경로:** 로그인 → 좌측 독학사 세션 → 동일 루프 → 모의고사 모드2
- **커밋:** `checkpoint: P6.2 self-study qa` (수정 있을 때만)

### P6.3 편입 페르소나

- [x] **선행:** P6.2
- **경로:** 로그인 → 편입 세션 → 동일 루프 → 모의고사 모드3(미니)
- **커밋:** `checkpoint: P6.3 transfer qa`

---

## 완료 게이트 (전부 `[x]` 이기 전에는 “다 됐다” 금지)

- [x] P0–P5 모든 원자 `[x]`
- [x] `wireframes/nodelab-proto.html` git diff 비어 있음
- [x] `npm test` (루트 `tests/*.test.mjs`) 실패 0
- [x] 루트 `/` 가 3단 프로토 UI
- [x] 가짜 Google `setTimeout` 로그인 코드 없음
- [x] 힌트 JSON에 `CAT_` 없음
- [x] `#mockBtn` 이 ADR-010 3모드 중 하나를 실제로 연다
- [x] P6 세 페르소나 경로를 브라우저 또는 동등한 검증으로 통과
