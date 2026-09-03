# 환경 변수 이름

공식 레포와 **키 이름**을 같게 쓴다. 값은 레포에 넣지 않는다.

테스트 앱(이 레포 루트, Vercel `nodelab`)은 예전 이름(`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE`)도 그대로 읽는다. 공식 이름이 오면 그것으로도 동작한다. 우선순위는 테스트 앱 이름이 먼저다.

## 프론트 (Next / Vercel 프로젝트 1)

| 키 | 필수 | 용도 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | 예 | Supabase API URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 예 | anon + RLS |
| `BACKEND_URL` | 예 | FastAPI origin. Next가 `/api/be/*` → `/api/v1/*` |

예시는 `frontend.env.example`, `20_src/frontend/.env.local.example`.

## 백엔드 (FastAPI / Vercel 프로젝트 2)

| 키 | 필수 | 용도 |
|---|---|---|
| `SUPABASE_URL` | 예 | 서버 Supabase URL |
| `SUPABASE_SERVICE_ROLE_KEY` | 서버만 | service_role. 프론트·`NEXT_PUBLIC_*`에 넣지 말 것 |
| `DATABASE_URL` | 예 | Postgres URI (pooler 6543) |
| `FRONTEND_ORIGIN` | 예 | CORS·OAuth 허용. 쉼표로 여러 개 |

예시는 `backend.env.example`, `20_src/backend/.env.example`.

테스트 앱 서버 별칭: `SUPABASE_SERVICE_ROLE` = `SUPABASE_SERVICE_ROLE_KEY`.

## 로그인 (공식 계정으로 새로)

1. Google Cloud OAuth 웹 클라이언트 (공식 GCP).
2. Supabase Auth → Google Enable. Client ID/Secret은 공식 클라이언트.
3. Redirect: `https://<공식-ref>.supabase.co/auth/v1/callback`
4. Site URL = 공식 프론트 도메인. 테스트 `nodelab-swart`를 Site URL로 쓰지 말 것.
5. JavaScript 원본에 공식 프론트 + `http://localhost:3000`.

테스트 앱 OAuth 메모는 `docs/eng/google-oauth.md` (thrilluv / yrgaj 전용).

## 넣지 말 것

- `service_role`을 `NEXT_PUBLIC_*`에
- 테스트 앱 Gemini 유료 키를 게스트 경로에
- 이 레포 git에 실제 키
