# NodeLab 백엔드 계획 — stem-tutor-agent 포크·병합

- 정책 SoT: `docs/adr/*` (충돌 시 ADR이 이긴다). 화면 카피: 카피북 + `docs/prompts/korean_tutor_prompts.md`.
- 원본(업스트림): https://github.com/ZelinZhou-THU/stem-tutor-agent — 반입 시점 커밋 `833e4b6`
- 포크 URL(목표): https://github.com/THRILLUV/stem-tutor-agent
  - 이 에이전트의 토큰은 `Node_Lab` 한정이라 계정 포크 생성이 403이다. **THRILLUV 계정에서 Fork 버튼 1클릭** 필요. 포크가 생기면 `engine/` 변경분을 그대로 푸시한다.
  - 그 전까지 병합·수정은 이 레포 `engine/`(git subtree, squash)에서 진행한다. LICENSE(원본) 동봉.

## 1. 업스트림 구조 (읽은 그대로)

- LangGraph 워크플로우 `engine/stem_tutor/graph/workflow.py`:
  `complexity_gate ─▶ ocr_preprocess ─▶ parse_student_solution ─▶ generate_reference_solution ─▶ verify_steps(SymPy 1342줄) ─▶ diagnose_error ─▶ generate_feedback ─▶ generate_review_problems ─▶ finalize_report`
- 모델 그룹: `reasoning / fast / ocr` — `settings.py` + `key.env`로 결정. OpenAI 호환 프로바이더 1종(`providers/openai_compatible_provider.py`) + mock.
- FastAPI 서버 `web/app.py`(1458줄) + Vercel 진입점 `api.py` + `vercel.json` 동봉 → Vercel 배포 가능.
- 에러 택소노미 `taxonomy/errors.py`: CHAIN_RULE_MISUSE 등 대학 미적분 코드. 과목 YAML(`subjects/*.yaml`)은 calculus 외 물리 다수.

## 2. 그래프 노드 ↔ NodeLab 루프 매핑

NodeLab 루프: 로그인 → 온보딩 → PDF/사진 → 문항 고정 → 5선택지 → (손풀이면 OCR 확인) → 진단 → 힌트 → 변형

| 업스트림 노드 | NodeLab 단계 | 정책 | 고칠 것 |
|---|---|---|---|
| (없음) | **게이트0 비수학 판정** | ADR-022 | **신규 노드 `input_gate`** 를 그래프 앞에 추가. not_math/unreadable이면 엔진 미호출·미차감. Gemini 첫 비전 호출에 라벨 동승 |
| `complexity_gate` | 내부 유지 | — | 유지(단순 문항 fastpath). 화면 노출 없음 |
| `ocr_preprocess` | 손풀이 OCR | ADR-017/018 | 모델을 `gemini-3.7-flash`로. pix2tex/Qwen OCR 금지 |
| (없음) | **OCR 확인 모달** (맞아요/줄만 고치기/다시촬영) | ADR-018·021§0 | **HITL 체크포인트 신규**: `parse_student_solution` 앞에서 그래프를 **일시정지**하고 확인된 라인만 진입. 확인 전 진단 금지 |
| `parse_student_solution` | 확인된 손풀이 단계화 | ADR-021§3 | 입력을 "확인된 텍스트"로 한정 |
| `generate_reference_solution` | 기준 풀이 | ADR-003 | reasoning=Gemini. 내부용, 화면 스포일러 금지 |
| `verify_steps` (SymPy) | 단계 검산 | ADR-003/019 | 유지 — 이 파일이 포크의 핵심 가치 |
| `diagnose_error` | **CAT v0.6 진단** | ADR-021 | 택소노미 출력을 CAT 필드(`primary_category, status, confidence, evidence_quote, error_step_index`)로 재매핑. calculus 코드는 내부 로그로만 |
| `generate_feedback` | 사람말 힌트 카드 | ADR-002/013·카피북 | 프롬프트를 `korean_tutor_prompts.md` 해요체로 교체. **CAT_2 등 코드 화면 금지** — 개념이 안 붙음/식을 못 세움/계산 실수/조건 누락 |
| `generate_review_problems` | 변형 문제 | ADR-005/008 | fast=DeepSeek V4 Flash 생성 → SymPy(게이트2·3) → **Gemini 블라인드 재풀이(게이트4) 신규** → 실패분 비노출, 2연속 실패 시 `questions.json` 백업 |
| `finalize_report` | 오답노트 기록 | ADR-021§6 | confirmed & primary≠null 만 기록. deferred 미기록 |

5선택지 라우팅(ADR-021§2): ①빠른채점·②개념 = 엔진 진단 미호출(②는 드릴다운 프롬프트만) / ③손풀이 = 전체 그래프 / ④변형 = review_problems만 / ⑤질문 = 손풀이 첨부 시에만 진단.

## 3. 런타임 모델 — 이미 교체함

| 그룹 | 업스트림 기본값 | → NodeLab (적용됨) |
|---|---|---|
| reasoning | qwen3.6-plus | **gemini-3.7-flash** |
| fast | deepseek-v3.2 | **deepseek-v4-flash** |
| ocr | qwen3.6-plus | **gemini-3.7-flash** |
| detection | qwen3-30b | **gemini-3.7-flash** |

- 적용 파일: `engine/stem_tutor/settings.py`(기본값), `engine/key.env.example`.
- 게이트웨이: Gemini는 OpenAI 호환 엔드포인트(`generativelanguage.googleapis.com/v1beta/openai`), DeepSeek V4 Flash는 OpenCode Zen(`opencode.ai/zen/v1`) 또는 DeepSeek 직통. 무료 검증 기간에는 env로만 `glm-5-free` 대체(코드 수정 없음).
- Kimi/GLM/qwen 기본값 복원 금지. Web Speech STT·SpeechSynthesis·KaTeX는 클라이언트($0), Groq Whisper/Claude 미사용.

## 4. 수정 지점 목록 (다음 구현 순서)

1. `providers/`: 모델 그룹별 base_url/api_key 분리 (지금은 단일 `PARATERA_URL`) — Gemini와 DeepSeek 게이트웨이가 다르므로 필수.
2. `graph/workflow.py`: `input_gate`(ADR-022)와 OCR 확인 체크포인트(그래프 2분할: pre-OCR / post-confirm) 삽입.
3. `nodes/diagnose_error.py` + `taxonomy/`: CAT v0.6 필드로 출력 스키마 교체. `subjects/` 물리 YAML은 로드 제외(ADR-022 G9 — 과목 모드 없음).
4. `nodes/generate_feedback.py` + `prompts/templates.py`: 해요체 템플릿 이식.
5. `nodes/generate_review_problems.py`: 5게이트(ADR-008) — 블라인드 재풀이 게이트 추가, 실패 재시도 1회 + 백업 배출.
6. `web/app.py`: NodeLab API 표면(`docs/eng/mvp.md` §2)으로 축소 라우팅. JWT는 Supabase 토큰 검증으로 교체.
7. 사용량: 게이트 실패·deferred 미차감(ADR-022§3), 손풀이 확정 1회만 과금 카운트(ADR-021§8).

## 5. 배포 형태

- 엔진은 Python(FastAPI)이므로 Vercel Python 함수(업스트림 `api.py` 방식 유지) 또는 별도 서비스. 프론트(`wireframes/nodelab-proto.html`)와 같은 Vercel 프로젝트에 `engine/api.py`를 함수로 올리는 것을 1안으로 한다.
- 실패/키 부재 시 `mock_provider` 폴백이 이미 있어(`ALLOW_MOCK_FALLBACK`) 데모가 죽지 않는다.
