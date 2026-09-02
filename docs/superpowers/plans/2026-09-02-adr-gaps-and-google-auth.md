# NodeLab ADR 공백 + Google 로그인 붙이기 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `giftedonyou` GCP NodeLab 프로젝트로 Google 로그인을 실제로 켜고, ADR-009 비회원 3문제 맛보기를 로그인 벽 없이 테스트할 수 있게 한다.

**Architecture:** Google은 GoTrue `signInWithOAuth`. 사이트 URL은 프로덕션(`nodelab-swart.vercel.app`)이 SoT. 게스트는 `nl_sessions.user_id is null` + 쿠키 `nl_session`으로 풀이하고, 4번째 문항에서만 가입 모달을 띄운다.

**Tech Stack:** Supabase Auth `yrgajwztpuscjbmrbkqg` (thrilluv), Vercel Hobby `nodelab-swart` (thrilluv), GitHub `THRILLUV/Node_Lab`, GCP OAuth 웹 클라이언트는 `giftedonyou` 프로젝트 Nodelab.

## Global Constraints

- ADR이 체크리스트·mvp.md와 충돌하면 ADR이 이긴다.
- 가짜 타이머 로그인 금지. 소셜 키 없으면 버튼은 `준비 중`.
- `public.profiles` ALTER 금지. NodeLab 테이블은 `nl_*`.
- `wireframes/nodelab-proto.html` 수정 금지.
- 화면에서 `CAT_` 코드 비노출.
- Hobby는 서버리스 함수 12개 상한. OAuth는 `api/auth/[provider].mjs` 하나.

---

## 충돌 SoT (지금 빼먹은 이유)

| 문서 | 말 | 지금 코드 |
|---|---|---|
| **ADR-009** | 비회원 웹 접속 → 세션당 3문제 맛보기. 4번째에 가입 모달 | 시작하기 = 로그인 화면. `enterApp`은 `session.user` 있을 때만 |
| ADR-023 | 009와 어긋나면 로그인 후 퍼널 | 009를 죽여서 게스트 테스트가 막힘 |
| `student-loop-checklist` 절대 금지 | 로그인 없이 PDF/풀이 “일단 돌아가게” 금지 | 엔지니어 가드. **유저+ADR-009가 이김** |
| `docs/eng/mvp.md` | 게스트도 가운데서 바로 시작 | 구현 안 됨 |
| 새 Supabase 기본값 | Site URL `http://localhost:3000` | 로그인/메일 확인이 로컬호스트로 떨어짐 |

**결정:** 비회원 3문제는 ADR-009대로 연다. 기록 보관·오답노트·4문제째는 로그인. 체크리스트 금지 줄은 이 계획에서 폐기한다.

---

## 지금 하는 일 (P0) — GCP NodeLab으로 Google + Site URL

GCP 계정: `giftedonyou@gmail.com`. 프로젝트: 콘솔에 보이는 **NodeLab**만 쓴다. 새 프로젝트 만들지 않는다.

1. Credentials에서 웹 OAuth 클라이언트 확인/생성.
2. JS 원본: `https://nodelab-swart.vercel.app`, `http://127.0.0.1:4173`.
3. Redirect: `https://gnuswrvxilwcitleizdx.supabase.co/auth/v1/callback`.
4. Client ID/Secret을 Supabase Authentication → Providers → Google에 넣고 Enable.
5. URL configuration:
   - Site URL: `https://nodelab-swart.vercel.app` (**localhost 아님**)
   - Allow list: `https://nodelab-swart.vercel.app/**`, `http://127.0.0.1:4173/**`
6. 코드는 이미 `signInWithOAuth({ redirectTo: location.origin + '/' })`. `/api/config`가 `auth.google: true`면 버튼이 켜진다.
7. Gemini API는 이 GCP 프로젝트 키를 이미 Vercel `GEMINI_API_KEY`로 쓰고 있으면 회전하지 않는다. 없으면 같은 프로젝트의 Generative Language API 키를 Vercel에만 넣는다.

완료 조건: 프로덕션에서 Google 버튼이 `Google로 계속하기`이고, 콜백이 `nodelab-swart.vercel.app`으로 돌아온다.

---

## P1 — 비로그인 풀이 테스트 (ADR-009)

파일: `js/auth.js`, `index.html` 시작 CTA, `lib/core/usage.mjs`, `api/usage.mjs`.

- [x] 시작하기 / 3초 만에 시작하기 → **로그인 없이** 홈+세션. `user_tier=guest`.
- `POST /api/session` 쿠키로 게스트 세션. `nl_sessions.user_id is null` insert는 이미 됨.
- [x] `usageSnapshot` guest limit **3**.
- [x] 4번째 문항 또는 2번째 변형 → 가입 모달. 카피: *여기서부터는 무료 가입하고 이어 풀 수 있어요.*
- [x] 로그인 화면은 “기록 이어받기”용으로 남긴다. 가짜 `enterApp` 금지.

테스트: guest 3회 통과, 4회는 모달, 로그인 후에만 persist profile.

---

## P2 — 로그인 후만 필요한 ADR (지금 안 막힘)

| ADR | 상태 | 다음에 채울 것 |
|---|---|---|
| 001 5선택지 | 부분 | 유지 |
| 004 컴패니언 | 부분 | QR 페어링 있음. 같은 구글 계정 원터치 바는 로그인 후 |
| 005/008/019 생성·검산 | 부분 | OpenCode+SymPy 있음. 블라인드 전 게이트는 후속 |
| 006 첫 문항 자동 로드 | 빠짐 | 온보딩 후 트랙 1번 자동. 게스트는 2026 홀수 1번으로 시작해도 됨 |
| 007 완료 뱃지 | 빠짐 | 초록 [완료] + 다음 문항 CTA |
| 010 모의고사 3모드 | 부분 | 셔플/재풀이 있음. 오답 맞춤 모드는 로그인 후 |
| 012 3년 보관·삭제 | 빠짐 | Storage 격리 + 마이페이지 삭제. 게스트 원본은 세션 종료 시 폐기 |
| 014 오답노트 | 빠짐 | `nl_wrongnotes` 없음. 로그인 유저만 |
| 016 음성 | 후순위 | 컴패니언 Hold-to-Talk 미완 |
| 018 OCR 프리뷰 | 부분 | 맞아요/고치기 있음. 크레딧 보상 없음 |
| 020/021 CAT | 서류 | 화면에 코드 내지 말 것. 진단은 OCR confirm 뒤 |
| 022 게이트0 | 부분 | `/api/gate` 있음 |
| 023/024 GA4 | 부분 | `track()`만. `G-` ID 없음. `login_success` 미연결 |
| 011 다도메인 | 백로그 | 수학만 |
| 015 | 빈 번호 | 만들지 않음 |

---

## 하지 않는 것

- 카카오/네이버는 각 디벨로퍼스 키 오기 전까지 `준비 중`.
- 결제/Pro 페이월은 구조만. PG 붙이지 않음.
- Cloudflare 프로토 HTML 수정 없음.
