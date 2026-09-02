# Cursor 핸드오프: 배포 프로토에 백엔드 연결 + UX 반영

> **현재 스프린트(우선):** `docs/prompts/CURSOR_SPRINT_QA_THEN_PDF_SPLIT.md`  
> 절대경로: `/Users/thrill/.aside/u/3/projects/2-조-프로젝트/Node_Lab/docs/prompts/CURSOR_SPRINT_QA_THEN_PDF_SPLIT.md`  
> 다른 문제집 PDF 문항 크롭 QA → 투두 → 순서 수정. 이 파일은 배경 핸드오프.

역할: 너는 구현 에이전트다. **제품 정책(무엇을)은 아래 ADR을 따른다. 너는 시스템/화면 설계(어떻게)를 하고 코드를 짠다.**
제품 가설을 뒤집거나 모델을 바꾸거나 CAT 코드를 학생 화면에 내지 마라.

---

## 0. 결정 vs 설계 (중요)

이미 된 것 = **결정사항 (What / Why / When)**
- ADR-001~024, 카피북, 모델 스택 PDF, Day2-3 트래킹 엑셀, IA 1차

아직 안 된 것 = **엔지니어링 설계 (How)** — 네가 한다
- API 경로·스키마, DB 테이블, 폴더 구조, 컴포넌트 트리, 상태관리, 에러 처리 구현, 반응형 브레이크포인트 수치, 실제 CSS/토큰
- 피그마 컴포넌트 라이브러리(TDS)는 이 레포 밖. 화면은 카피북 문장 + 기존 프로토 레이아웃을 기준으로 고쳐라.
- ADR을 다시 쓰지 마라. 충돌하면 ADR을 이기고, 구현만 바꿔라.

지금 `nodelab-proto.html`은 **클릭 연극**이다. PDF 분할·채점은 가짜다. 이걸 실제 API에 붙이고, 결정된 UX 카피/가드레일/이벤트를 심는 게 이번 일.

---

## 1. 경로 (반드시 이 레포·이 파일)

| 무엇 | 경로 |
|---|---|
| GitHub | `https://github.com/THRILLUV/Node_Lab` |
| 작업 브랜치 | `cursor/nodelab-clickable-proto-58f5` |
| 배포 프로토 (Live) | `https://nodelab-proto.indispensable-soil.workers.dev` |
| 소스 | `wireframes/nodelab-proto.html` |
| 문항 데이터 | `wireframes/questions.json` |
| 로컬 클론 | `/Users/thrill/.aside/u/3/projects/2-조-프로젝트/Node_Lab` |
| 결정 문서 | `docs/adr/ADR-*.md` |
| 카피 | `docs/NodeLab_전화면_토스_톤앤매너_카피북.md` |
| 모델·검산 | `docs/NodeLab_확정_모델엔진_스택.pdf` |
| GA 가설 엑셀 | `docs/NodeLab_Day2-3_데이터수집계획_2조.xlsx` |
| 이벤트 심는 순간 | `docs/adr/ADR-024-ga4-instrumentation.md` |
| CAT MVP 적용 | `docs/adr/ADR-021-cat-mvp-application.md` |
| 가드레일 | `docs/adr/ADR-022-input-guardrails.md` |

하지 말 것:
- `nodelab-master.html` / H-STUDY 파일 수정 금지
- React로 통째 재작성 금지. 기존 HTML 프로토를 확장하거나, 같은 UX를 유지한 최소 서버를 옆에 붙여라.
- 네이티브 iOS/Android 앱 만들지 마라. 웹/PWA만.
- pix2tex, Qwen LaTeX-OCR, Groq Whisper, Claude를 MVP 런타임에 넣지 마라.

배포: 기존 Workers URL이 살아 있게 같은 프로젝트로 올리거나, 올리는 방법을 README에 한 단락으로 남겨라. 새 URL이면 채팅에 명시.

---

## 2. 잠긴 제품 결정 (요약 — 원문은 ADR)

**루프:** 구글 로그인 → 온보딩 5지선다(레벨테스트 아님) → PDF/사진 → 문항 고정 → 5선택지 → (손풀이면 OCR 확인 후 CAT) → 변형은 DeepSeek 출제 + SymPy + Gemini 블라인드.

**모델 MVP:** Gemini 3.7 Flash (OCR·CAT·블라인드), DeepSeek V4 Flash (변형 생성), SymPy, Web Speech STT($0), SpeechSynthesis TTS($0), KaTeX. 유료는 Gemini+DeepSeek뿐.

**CAT:** 백엔드만. 화면에는 `개념이 안 붙음 / 식을 못 세움 / 계산 실수 / 조건 누락`. 손풀이+OCR 확인 후에만 진단. deferred는 오답노트에 안 넣음. (ADR-021)

**가드레일:** 수학 아니면 본 루프 스킵, 사용량 안 깎음. 물리·초등은 과목 모드 없음. maybe면 한 번만 물어봄. (ADR-022)

**카피:** 해요체. 랜딩 히어로: `새벽에 문제집 풀다 막힐 때, / 과외쌤 부르듯 편하게.`

**GA:** `track()` 하나. 클릭 이벤트 vs 서버 커밋 이벤트 구분. `ocr_confirm`은 미리보기에서 찍지 않음. (ADR-023/024)

**BM 참고:** 로그인 후 무료 체험 → 월 구독. ADR-009의 비회원 3문제와 충돌하면 **로그인 후 퍼널**을 따른다.

---

## 3. 네가 할 설계 (이번 작업에서 문서/코드로 남겨라)

구현 들어가기 전에 짧게 써라 (레포 안 `docs/eng/` 또는 README):
1. 화면 트리 (기존 프로토 화면 + 없는 것만: 인트로/로그인/온보딩/가드레일 카드/OCR 확인/페이월)
2. API 목록 (method, path, 요청/응답 JSON, 실패 코드)
3. 테이블 초안 (user, session, item, attempt, ai_request, event) — PII/손글씨 원문 장기저장 금지
4. 환경변수 (`GEMINI_API_KEY`, `DEEPSEEK_API_KEY`, `GA_MEASUREMENT_ID`)

그다음 코드.

우선순위:
1. 기존 프로토 UX 유지한 채 서버 붙이기 (업로드 → 문항 리스트 → 5선택지)
2. Gemini 비전으로 손풀이/PDF (한글+수식). 전용 LaTeX OCR 없음
3. OCR 확인 모달 → 그 다음 CAT 분기 카피
4. 변형: DeepSeek 생성, SymPy 가능하면, 없으면 Gemini 블라인드만이라도. 게이트 실패는 화면에 안 냄
5. 가드레일 카드 (비수학)
6. 카피북 문장으로 버튼/빈상태 교체
7. `track()` + dataLayer (G- 없어도 dataLayer/console)

스코프 밖 (하지 마):
- 관리자 콘솔 풀구현, 지식그래프, 게이지 3개, 등급 예측, 네이티브 앱, 유료 Whisper

---

## 4. 완료 조건

- Live 또는 로컬에서: 로그인(또는 개발 스킵 토글) → 샘플/업로드 → 1번 고정 → 5선택지 → 손풀이 미리보기 → 맞아요 → 힌트 카드가 사람말로 보임
- 비수학 업로드 시 거절 카드, 사용량 안 깎임
- 학생 화면에 CAT_2 없음
- dataLayer에 `choice_select` / `ocr_confirm`이 서로 다른 순간에 찍힘
- README에 실행 방법, 환경변수, 배포 URL
