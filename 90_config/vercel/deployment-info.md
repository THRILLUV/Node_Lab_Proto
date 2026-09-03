# 배포 두 줄

값을 이 파일에 적지 않는다. 대시보드에서만 넣는다.

## 테스트 앱 (이 레포 루트)

| | |
|---|---|
| Vercel | `nodelab` / `https://nodelab-swart.vercel.app` |
| Root Directory | 저장소 루트 (`index.html` + `api/`) |
| Production branch | `main` |
| Env 이름 | `SUPABASE_URL`, `SUPABASE_ANON_KEY` (공식 이름도 읽음) |

`20_src/` 를 이 프로젝트 Root Directory로 바꾸지 말 것. 테스트 앱이 죽는다.

## 공식 앱 (별도 레포)

| | 프론트 | API |
|---|---|---|
| Root Directory | `20_src/frontend` | `20_src/backend` |
| 프레임워크 | Next.js | FastAPI |
| Production branch | `main` | `main` |
| Env | `NEXT_PUBLIC_SUPABASE_*`, `BACKEND_URL` | `SUPABASE_*`, `DATABASE_URL`, `FRONTEND_ORIGIN` |

공식 키는 공식 Vercel 팀 대시보드에만 둔다. 테스트 프로젝트에 복사하지 않는다. env 바꾼 뒤 Redeploy.
