# Official folder map (observed)

How only. Does not rewrite ADRs. No secrets.

Official repo: `myunghui/edu_logic_auditor`. This token cannot push there. Copy **from** this tree **into** that tree.

| Official | This repo drop-in |
|---|---|
| `10_doc/` | `10_doc/` |
| `20_src/frontend` Next 15 App Router, JS, `@/` | `20_src/frontend` |
| `20_src/backend` FastAPI 3.12 | env examples only |
| `90_config/env` · `vercel` · `supabase` | `90_config/` |
| `91_mig/supabase/migrations/` | `91_mig/supabase/migrations/` |
| `app/onboarding/` | do not copy over |
| `app/admin/` | do not copy over |
| new `app/signup/` · `app/welcome/` | `20_src/frontend/app/signup` · `welcome` |

Frontend env names: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `BACKEND_URL`.  
Backend env names: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `FRONTEND_ORIGIN`.

Live test app stays at repo root. `/api/be/*` rewrite is the official front→back path; screens in this test app still call `/api/*`.
