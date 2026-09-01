# NodeLab MVP 엔지니어링 설계 (구현 전 고정)

- 정책 SoT: `docs/adr/ADR-001~024`, 카피북, 모델스택 PDF. 충돌 시 ADR이 이긴다.
- 이 문서는 How만 정한다: 화면 트리 / API / 테이블 / 환경변수.
- 프론트는 React 재작성 없이 `wireframes/nodelab-proto.html` 확장. 백엔드는 Vercel 서버리스(`api/`).

---

## 1. 화면 트리

```
인트로(랜딩)                      ← 게스트도 가운데서 바로 시작 (IA v0.11)
 ├─ 로그인 모달                   ← Google(동작) · Kakao · Naver (env 키 있으면 활성)
 │   └─ 첫 가입 → 온보딩 5지선다   ← 레벨테스트 아님. 세션 기본값만 저장 (ADR-021 §0)
 │       └─ 트랙 1번 문제 자동 로드 (ADR-006)
 ├─ 홈 (컴포저 / 사이드바)
 ├─ 학습 세션
 │   ├─ 상단: 원본 크롭 문제판 고정
 │   ├─ 5선택지 (ADR-001)
 │   ├─ [게이트0] 비수학/판독불가 거절 카드 (ADR-022)
 │   ├─ OCR 미리보기 → 맞아요/줄만 고치기/다시촬영 (ADR-018)
 │   ├─ 힌트/첨삭 카드 — 사람말만, CAT 코드 비노출 (ADR-021 §4)
 │   └─ 변형 문제 (5게이트 통과분만, ADR-008)
 ├─ 모바일 컴패니언 `/m?s={session_id}`  ← 카메라 오버레이 + Realtime 동기화 (ADR-004, `docs/eng/companion.md`)
 ├─ 오답노트 (confirmed만)
 ├─ 마이페이지 (프로필/설정/청구 탭)
 └─ 페이월 모달 (ADR-009 · 로그인 후 퍼널 우선)
```

## 2. API 목록 (Vercel `api/`)

| Method Path | 요청 | 응답 | 실패 |
|---|---|---|---|
| POST `/api/gate` | `{image_b64\|text, session_id}` | `{label: math_problem\|maybe_math\|not_math\|unreadable}` | 502 `gate_unavailable` |
| POST `/api/ocr` | `{image_b64, item_index}` | `{lines:[{step,latex}], confidence}` | 502 |
| POST `/api/ocr-confirm` | `{session_id, item_index, result: ok\|edit\|retake, lines?}` | `{ok:true, diagnosis?}` — 서버가 CAT 진단 실행 | 409 미리보기 없음 |
| POST `/api/hint` | `{item_index, choice, ocr_confirmed_lines?}` | `{style, message, evidence_quote?, error_step_index?}` 사람말 카드 | 502 |
| POST `/api/variant` | `{item_index}` | `{stem, choices[5], answer_masked:true, request_id}` 게이트 통과분만 | 502 → 정적 백업 variants |
| POST `/api/verify` (Python) | `{expr_original, expr_variant, answer}` | `{pass, reasons[]}` SymPy 게이트2·3 | 400 |
| POST `/api/session` | `{}` | `{session_id}` 서버 발급, F5 재발급 금지 | |
| GET `/api/usage` | 쿠키 | `{tier, used, limit}` | |
| GET `/api/auth/naver` + `/callback` | OAuth code | Supabase 유저 upsert 후 세션 | |

- Gemini 분류 라벨은 첫 비전 호출에 동승 (ADR-022 §3, 왕복 1회).
- 게이트 실패·미확정(deferred)·OCR 미확인은 어떤 차감/기록도 없음.
- 키 없는 로컬/데모: 모든 엔드포인트가 `X-NL-Mock: 1`로 questions.json 기반 목업 응답. UX·이벤트 검증용.

## 3. 테이블 초안 (Supabase)

```
profiles        id uuid PK = auth.users, tier text default 'free', exam_track, tutor_mode, created_at
sessions        id uuid PK, user_id FK null(게스트), started_at, ended_at, entry text
items           id, session_id FK, item_index int, concept_name text, source text
attempts        id, item_id FK, choice text, created_at            -- choice_select 원장
ocr_confirms    id, item_id FK, result text, confidence numeric, confirmed_at
diagnoses       id, item_id FK, primary_category text, status text, confidence numeric,
                error_step_index int, evidence_quote text          -- 화면 비노출, confirmed만 오답노트
wrongnotes      id, user_id, item_id, concept_name, state text     -- 미해결/변형1회/마스터
variants        id, item_id, request_id, passed bool, shown bool   -- 실패분 shown=false 고정
usage_ledger    id, user_id, kind text, delta int, created_at      -- 게이트 실패는 기록 안 함
plans           code PK('free','pro'), price_krw int
subscriptions   id, user_id, plan_code, status, current_period_end
ai_request_log  id, request_id, model_name, purpose, tokens_in, tokens_out, created_at
                -- 원문/손글씨/이메일 저장 금지 (ADR-012·023§5). 손글씨 이미지는 Storage 단기.
```

## 4. 환경변수

| 키 | 용도 |
|---|---|
| `GEMINI_API_KEY` | 비전: 게이트0 분류 + OCR + 블라인드 검증 (Gemini 3.7 Flash) |
| `LLM_BASE_URL` | 생성자. 기본 `https://opencode.ai/zen/v1` (OpenAI 호환) |
| `OPENCODE_API_KEY` | 위 게이트웨이 키 |
| `LLM_MODEL_GEN` | 지금 `glm-5-free`(무료) → 확정 스택 `deepseek-v4-flash`로 env만 교체 |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE` | DB·Auth·Storage |
| `NAVER_CLIENT_ID` / `NAVER_CLIENT_SECRET` | 네이버 OAuth (커스텀 라우트) |
| `GA_MEASUREMENT_ID` | `G-…` 없으면 dataLayer만 (ADR-024) |

- Kakao는 Supabase 내장 제공자라 대시보드에서만 설정(코드 env 불필요).
- STT/TTS는 Web Speech/SpeechSynthesis 클라이언트, KaTeX 클라이언트 — 서버 비용 0 (ADR-019).

## 5. 이벤트 (ADR-023/024 그대로)

`track(name, params)` 단일 진입점. 클라이언트 즉시: `view_landing, click_start, choice_select, paywall_view, wrongnote_*`. 서버 성공 후: `login_success, onboarding_complete, upload_submit, guardrail_block, first_item_ready, item_view, ocr_confirm, feedback_shown, variant_shown, item_complete, begin_checkout, purchase(웹훅만)`. `ocr_confirm`은 미리보기에서 절대 안 찍음.
