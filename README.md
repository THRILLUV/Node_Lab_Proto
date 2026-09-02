# Node_Lab

SeSAC AI PM 2조 Node_Lab MVP.

수능 수학 자습 루프. 웹 세션 + 폰 카메라 오버레이(ADR-004).

구현 순서·체크리스트: [`docs/eng/student-loop-checklist.md`](docs/eng/student-loop-checklist.md).  
원자 계획: [`docs/superpowers/plans/2026-09-01-student-loop.md`](docs/superpowers/plans/2026-09-01-student-loop.md).  
로그인 → PDF → 풀이 → 모의고사. 앞 단계 미완료면 다음으로 가지 않는다. 원자 = `checkpoint:` 커밋.

## Vercel MVP

- `/` PC 학습 세션. 5선택지 → 손풀이 OCR 확인 → 힌트. CAT 코드 비노출.
- `/m?s={session_id}` 폰 컴패니언. 후면 카메라 + 글래스 오버레이 + 같은 세션 실시간 연동.
- `api/` session · gate · **guardrail**(별칭) · ocr · ocr-confirm · hint · variant · **verify** · **usage** · config.
- `GEMINI_API_KEY` / `OPENCODE_API_KEY` 없으면 `X-NL-Mock: 1`.
- 동기화: Supabase Realtime(`nl_events`) + BroadcastChannel 폴백.
- 로컬: `npm test` · `npm run dev` (http://127.0.0.1:4173)
- Google OAuth 등록: [`docs/eng/google-oauth.md`](docs/eng/google-oauth.md)
- 설계: [`docs/eng/mvp.md`](docs/eng/mvp.md)

### 환경변수

| 키 | 필수 | 용도 |
|---|---|---|
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` | 아니요(기본값: thrilluv `yrgajwztpuscjbmrbkqg`) | Auth · DB |
| `SUPABASE_SERVICE_ROLE` | 서버 전용 | 관리 작업만 |
| `GEMINI_API_KEY` | 비전 | 게이트/OCR/블라인드 |
| `LLM_BASE_URL` | 기본 OpenCode Zen | `https://opencode.ai/zen/v1` |
| `OPENCODE_API_KEY` | 생성 | 힌트/변형 |
| `LLM_MODEL_GEN` | 기본 `glm-5-free` | 생성 모델 |
| `LLM_MODEL_CHECK` | 선택 | 블라인드 검증 모델 |
| `KAKAO_REST_API_KEY` / `KAKAO_CLIENT_SECRET` | 카카오 앱 키가 있을 때 | `/api/auth/kakao` |
| `NAVER_CLIENT_ID` / `NAVER_CLIENT_SECRET` | 네이버 앱 키가 있을 때 | `/api/auth/naver` |
| `NL_OAUTH_DB_SECRET` | 카카오/네이버 앱 라우트 | `nl_oauth_prepare` |
| `GA_MEASUREMENT_ID` / `GA4_ID` | 없으면 dataLayer만 | ADR-024 |

배포: Vercel 팀 THUV. 이름 `nodelab-mvp` 는 이미 있어 `nodelab-mvp-58f5` (`prj_OWmabbHAQ1DIieEN12tARSA21pLh`) 를 만들었다. Git 링크가 API에서 404가 나면 대시보드에서 `THRILLUV/Node_Lab` 브랜치 `cursor/nodelab-mvp-58f5` 를 연결하면 된다.

PR: https://github.com/THRILLUV/Node_Lab/pull/14

Cloudflare 클릭 프로토는 이 브랜치에서 수정하지 않는다.

클라우드플레어에 올린 클릭 프로토(`wireframes/nodelab-proto.html`)는 그대로 둔다.

PM Grid IA: GitHub Pages `docs/` → https://thrilluv.github.io/Node_Lab/

## 다른 문제집으로 분할 시험

데모 `items/q01.png`만 보고 통과로 치지 마세요.

1. `npm start` 또는 라이브에서 게스트로 들어갑니다.
2. `qa/fixtures/naesin-12.pdf` 또는 `qa/fixtures/pyunip-20.pdf`를 올립니다.
3. 진행 카피가 `시험지를 문항별로 나누고 있어요` / `N문항으로 나누는 중…`인지 봅니다. `30문항` 고정이면 실패입니다.
4. 우측이 `문항 1`–`문항 N`인지, 1번을 눌렀을 때 상단이 그 문항 크롭인지 봅니다.
5. 「추출」이 보이면 실패입니다.

## wireframes/

- `nodelab-wireframe.html` — 웹 ChatGPT식 3단
- `nodelab-proto.html` — 클릭 가능한 웹 3단 자습 플로우 목업 (가짜 OCR/AI)
- `items/` — 업로드된 2026 수능 수학 홀수형 PDF에서 크롭한 30문항 원본 이미지(q01–q30) + 1쪽 전체(page-01). 문제판에는 이 원본만 표시
- `questions.json` — OCR·LaTeX 인식이 끝났다고 가정한 내부 데이터. 풀이 도움·응용문제 생성에만 사용 (변형 3개씩)
- `nodelab-app-wireframe.html` — 아이폰 카메라/홀드투토크
- `nodelab-ia.html` — 서비스 정보구조도
- `nodelab-master.html` — 1차 마스터 HTML (원본 복사, 로컬 원본은 안 건드림)

## 1차 클릭 프로토 범위

사용자 A 플로우만 클릭 구현한다: 인트로 → Google 로그인 → 홈/라이브러리/오답노트 → PDF 학습 세션 → 마이페이지 → 요금제/결제/구독/환불 → 상세 Audit 리포트.

팀 공통 IA에는 관리자·결제 운영·AI 사용량·타겟팅 배너·푸시/알림톡도 유지하지만, 관리자 기능은 B 후속 구현이고 배너는 슬롯, 푸시/알림톡은 문서이므로 이번 사용자 프로토의 앱 화면으로 만들지 않는다. Google OAuth, PG, 실제 환불/사용량 차감은 가짜 상태 전환으로만 표현한다.
