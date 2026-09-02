# Cursor 스프린트: QA → 투두 → 문항 크롭 MVP

역할: 너는 구현 에이전트다. **정책(What)은 ADR이 이긴다. 너는 How만 설계하고 코드를 고친다.**
ADR을 다시 쓰지 마라. 모델을 바꾸지 마라. CAT 코드를 학생 화면에 내지 마라.

**이번 스프린트 한 줄:** 다른 수능/내신 문제집 PDF를 올려도 **문항별로 크롭**되어 우측이 **문항 1–N**이 되어야 한다. 지금은 데모 PDF만 되고, 다른 파일을 올리면 자르지 않고 우측에 「추출」만 뜬다. 그걸 포함해 **직접 QA → 갭 투두 → 순서대로 수정**한다.

---

## 0. 작업 순서 (이 순서를 어기면 실패)

1. `git pull` 이 브랜치.
2. **코드 작성 전에** 로컬/라이브에서 QA. 데모 2026 수능 홀수형 **말고** 다른 수학 문제집 PDF 최소 2종 + 사진 1장.
3. 갭을 `docs/eng/qa-gaps.md`에 번호 투두로 적는다. (증상 / 재현 / 기대 / 관련 ADR / 우선순위)
4. **1순위는 PDF → 문항 크롭 → 우측 문항 탭.** 이게 깨져 있으면 5선택지·OCR·CAT·페이월을 더 붙이지 마라.
5. 그다음 투두를 위에서 아래로 한 원자씩. 커밋 접두사 `checkpoint:`.
6. 고친 항목은 같은 커밋에서 투두를 `[x]`로 바꾼다.

금지:
- 투두 없이 리팩터
- React로 통째 재작성
- `wireframes/nodelab-proto.html` 원본 수정 (클릭 프로토 SoT. 복사는 OK)
- 슬림 `slim/index.html`에 기능 추가
- 가짜 `setTimeout` 로그인 유지
- pix2tex / Qwen LaTeX-OCR / Groq Whisper / Claude / 네이티브 앱
- 크레딧 UI, 「프로/VIP」 이름
- 관리자 콘솔 풀구현

---

## 1. 경로 (이 파일만 열면 된다)

| 무엇 | 절대 경로 |
|---|---|
| GitHub | `https://github.com/THRILLUV/Node_Lab` |
| 브랜치 | `cursor/nodelab-clickable-proto-58f5` |
| 이 프롬프트 | `/Users/thrill/.aside/u/3/projects/2-조-프로젝트/Node_Lab/docs/prompts/CURSOR_SPRINT_QA_THEN_PDF_SPLIT.md` |
| 이전 핸드오프 | `/Users/thrill/.aside/u/3/projects/2-조-프로젝트/Node_Lab/docs/prompts/CURSOR_BACKEND_UX_HANDOFF.md` |
| 학생루프 체크리스트 | `/Users/thrill/.aside/u/3/projects/2-조-프로젝트/Node_Lab/docs/eng/student-loop-checklist.md` |
| MVP How | `/Users/thrill/.aside/u/3/projects/2-조-프로젝트/Node_Lab/docs/eng/mvp.md` |
| 카피북 | `/Users/thrill/.aside/u/3/projects/2-조-프로젝트/Node_Lab/docs/NodeLab_전화면_토스_톤앤매너_카피북.md` |
| 모델 스택 PDF | `/Users/thrill/.aside/u/3/projects/2-조-프로젝트/Node_Lab/docs/NodeLab_확정_모델엔진_스택.pdf` |
| 요금·토큰 종합 | `/Users/thrill/.aside/u/3/projects/2-조-프로젝트/Node_Lab/docs/NodeLab_요금제_모델분업_토큰이코노믹스_종합명세서.pdf` |
| 한도표 원문 | `/Users/thrill/.aside/u/3/projects/2-조-프로젝트/Node_Lab/docs/adr/ADR-025-plan-names-usage-bar.md` |
| 퍼널 골격 | `/Users/thrill/.aside/u/3/projects/2-조-프로젝트/Node_Lab/docs/adr/ADR-009-tier-funnel-policy.md` |
| 가드레일 | `/Users/thrill/.aside/u/3/projects/2-조-프로젝트/Node_Lab/docs/adr/ADR-022-input-guardrails.md` |
| CAT | `/Users/thrill/.aside/u/3/projects/2-조-프로젝트/Node_Lab/docs/adr/ADR-021-cat-mvp-application.md` |
| OCR 확인 | `/Users/thrill/.aside/u/3/projects/2-조-프로젝트/Node_Lab/docs/adr/ADR-018-ocr-correction-and-reward-loop.md` |
| 모델 | `/Users/thrill/.aside/u/3/projects/2-조-프로젝트/Node_Lab/docs/adr/ADR-019-final-model-stack-specification.md` |
| GA | `/Users/thrill/.aside/u/3/projects/2-조-프로젝트/Node_Lab/docs/adr/ADR-023-ga4-funnel-events.md` 그리고 `/Users/thrill/.aside/u/3/projects/2-조-프로젝트/Node_Lab/docs/adr/ADR-024-ga4-instrumentation.md` |
| 프로토 UX | `/Users/thrill/.aside/u/3/projects/2-조-프로젝트/Node_Lab/wireframes/nodelab-proto.html` |
| 데모 크롭(2026 홀수형만) | `/Users/thrill/.aside/u/3/projects/2-조-프로젝트/Node_Lab/wireframes/items/` |
| 라이브 클릭 프로토 | `https://nodelab-proto.indispensable-soil.workers.dev` |
| 로컬 클론 | `/Users/thrill/.aside/u/3/projects/2-조-프로젝트/Node_Lab` |

ADR 전체: `ADR-001`–`014`, `016`–`025`. **ADR-015 없음.** 충돌 시 **021 > CAT**, **025 > 요금 이름·한도·바**, **019 > 유료 모델 id**, **022 > 업로드 게이트**, **024 > 이벤트 심는 법**.

포크 베이스(라이브러리 아님): `https://github.com/ZelinZhou-THU/stem-tutor-agent` — NodeLab 루프에 맞춰 적응. OSS 기본 모델(Kimi/GLM)로 바꾸지 마라.

---

## 2. 잠긴 결정 (화면/원가에 그대로 쓸 것)

### 루프
구글 로그인 → 온보딩 ≤5 선택(레벨테스트 아님) → PDF/사진 → **문항별 원문 크롭 고정** → 5선택지(①채점 ②개념 ③손풀이 ④변형 ⑤자유질문) → 손풀이면 OCR 확인 후에만 CAT → 변형은 DeepSeek 생성 + SymPy + Gemini 블라인드.

카피: 해요체. 히어로 `새벽에 문제집 풀다 막힐 때, / 과외쌤 부르듯 편하게.`
웹/PWA만.

### 모델 (ADR-019)
| 역할 | 모델 | 비고 |
|---|---|---|
| OCR·게이트·개념·CAT·블라인드 | `gemini-3.7-flash` | 전용 LaTeX OCR 없음 |
| 변형 생성 | `deepseek-v4-flash` | 생성만. 검산은 SymPy+Gemini |
| 검산 | SymPy 로컬 $0 | 실패분은 화면에 안 냄 |
| STT/TTS | Web Speech / SpeechSynthesis | 유료 Whisper 없음 |
| 렌더 | KaTeX | 원문 문제판은 **크롭 이미지**가 우선 |

비회원만 무료 키 격리 (`GOOGLE_FREE_TIER_KEY` 등). 라이트 이상은 유료 Gemini. 게스트에 프로덕션 키 쓰지 마라.

### 요금 (ADR-025가 이름·한도 SoT. 009는 퍼널 골격만)

이름: **비회원 / 라이트(0, 가입) / 베이직 9,900 / 헤비 29,900**. 프로·VIP·크레딧 게이지 금지.

화면 밸브 = **횟수 + 100% 사용량 바**(손풀이 월한도=100%). 대화 턴은 바에서 안 깎음. 가드레일 실패는 안 깎음.

| | 비회원 | 라이트 | 베이직 | 헤비 |
|---|---|---|---|---|
| 저장·오답노트 | 안 됨 | 됨 | 됨 | 됨 |
| 업로드 일 | 방문당 3 | 10 | 없음 | 없음 |
| 업로드 월 | — | 300 | 300 | 1,000 |
| 손풀이 일 | 방문당 1 | 5 | 20 | 없음 |
| 손풀이 월 | — | 150 | 600 | 1,000 |
| 응용 일 | 방문당 1 | 5 | 없음 | 없음 |
| 응용 월 | 올린 문항 안 1 | 150 | 문항당 3 (최대 900) | 문항당 무제한, 합 1,000 |

라이트 0% → `베이직으로 이어 풀기`. 베이직·헤비만 이번 달 횟수 팩. 게스트 세션은 서버 저장 없음. 온보딩은 **첫 구글 로그인 후만**.

원가 감각(ADR-019, 환율 1,400): 손풀이 1회 Gemini ≈ 9.45원, 변형 1회 ≈ 2.80원. 마진 타깃 ~50%+. 한글 토큰 1.4~2배는 **장부만**, 바 계산 아님.

### CAT (021)
백엔드만. 화면 카피: `개념이 안 붙음 / 식을 못 세움 / 계산 실수 / 조건 누락`.
①② 선택지는 CAT 없음. ③손풀이+OCR 확인 후에만. deferred/confidence<0.6은 오답노트 안 넣음.

### 가드레일 (022)
게이트0이 OCR·CAT보다 앞. PDF는 **파일 전체가 아니라 문항 단위**.
`not_math`/`unreadable`는 본 루프 스킵, 횟수 안 깎음.
G3: 50MB / 약 40쪽. 초과는 앞만 나누고 전체 실패로 만들지 마.

### GA (023/024)
`track()` 하나. 손글씨·지문·CAT 코드 이벤트에 넣지 마.
`ocr_confirm`은 미리보기 클릭이 아니라 맞아요/수정 **커밋**.

---

## 3. PM이 본 현재 증상 (반드시 재현)

- 구현은 어느 정도 붙어 있다. **데모 2026 수능 홀수형 크롭 PNG**(`wireframes/items/q01–q30`)에 기대어 있다.
- **다른 수능/문제집 PDF**를 올리면:
  - 문항 박스 크롭이 안 된다 (페이지 통째 또는 미분할).
  - 우측 레일이 **문항 1–N**이 아니라 「추출」 같은 미완성 라벨만 보인다.
- 기대 UX (카피북): 분할 화면 `시험지를 문항별로 나누고 있어요` → 세션 상단 **원문 크롭** 고정 → 우측 **문항 1–N** / 사이드 채팅 / 모의고사.

체크리스트 정직 표(`docs/eng/student-loop-checklist.md`): PDF 업로드→분할은 최근까지 **연극**이었다. 지금 코드가 그 이상이면 QA로 증명하고, 아니면 이 구멍을 1순위로 메워라.

---

## 4. PDF 문항 분할 — 합격 조건

다른 PDF 2종에서 전부 통과해야 한다. 데모 `items/q01.png`만 보여 주면 실패.

1. 업로드 후 진행 화면이 보인다. 카피북 문장. 스피너만 무한루프 금지.
2. 각 문항은 **잘린 이미지**(원문 스캔)로 저장된다. 문제판에 KaTeX 지문만 넣고 원문을 버리지 마라.
3. 우측 = `문항 1` … `문항 N`. 「추출」 같은 개발자 라벨 없음.
4. 1번을 누르면 상단 문제판이 그 크롭으로 바뀐다. 5선택지는 그 문항 컨텍스트.
5. 30문항이 아닌 시험지도 된다 (12문항 내신, 20문항 편입 등). 숫자를 30에 하드코딩하지 마라.
6. 40쪽 초과는 앞 구간만 나누고 `나머지는 다음에 이어서 올릴 수 있어요`.
7. 비수학 페이지/문항은 스킵 카드. 파일 전체 실패 아님.
8. 실패 시 해요체 에러 + 다시 올리기. 빈 우측 패널 금지.
9. 게스트는 방문당 업로드 3 / 손풀이 1. 라이트 이상은 ADR-025 한도.

How(렌더 라이브러리, bbox JSON, 스토리지)는 네가 설계해서 `docs/eng/`에 짧게 남긴 뒤 구현. 정책은 위 합격 조건이 이긴다.

추천 방향(강제 아님): PDF 페이지 → 이미지 → Gemini 3.7 Flash가 문항 bbox+번호 → 크롭 PNG → `nl_items`. 데모 `items/`는 폴백/목업.

---

## 5. QA 체크 (투두에 통과/실패를 적어라)

- [ ] 데모 2026 홀수형 PDF/칩
- [ ] **다른** 수능 수학 PDF
- [ ] 내신/편입 수학 PDF (문항 수 ≠ 30)
- [ ] 손풀이 사진 1장 (크롭 확인 모달 → 맞아요)
- [ ] 국어/셀카 업로드 → 거절, 횟수 안 깎임
- [ ] 5선택지 ①~⑤, CAT 코드 비노출
- [ ] 변형 실패분이 화면에 안 나옴
- [ ] 사용량 바 100% + `손풀이 n/한도` (크레딧 문구 없음)
- [ ] 모바일 `/m?s=` 카메라가 있으면 스모크, 없으면 투두에 후순위
- [ ] `track('upload_submit')` / `choice_select` / `ocr_confirm` 시점이 다름

---

## 6. 완료 조건

- `docs/eng/qa-gaps.md`가 있고, P0(문항 크롭)이 `[x]`
- 데모가 아닌 PDF로: 업로드 → N개 크롭 → 우측 문항 탭 → 1번 고정 → 5선택지
- README에 실행, env, **다른 PDF로 시험하는 방법** 한 단락
- 라이브 URL이 바뀌면 채팅에 명시. 기존 Workers 클릭 프로토는 깨지 말 것

끝나면 투두 남은 항목과 다음 원자만 짧게 보고하면 된다.
