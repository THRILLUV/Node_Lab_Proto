# Official API map (read-only)

How only. This file does not rewrite ADRs.

**Write target:** `THRILLUV/Node_Lab` (this repo, THRL test Vercel `nodelab` / `https://nodelab-swart.vercel.app`).

**Read-only reference:** 장명희’s official GitHub repo, invited as `myunghui/edu_logic_auditor`. From this token that URL is **404**. Treat the official tree as **unread**. Do not invent folder names, route strings, or table names from it.

When the invite is accepted, fill the official columns in this file only. Do not copy official code here as the write source of truth. Do not point this test app’s writes at an official database.

## Ownership

| Role | Repo | Allowed |
|---|---|---|
| THRL | `THRILLUV/Node_Lab` | Write screens, `api/*`, `lib/core/*`, Vercel env for `yrgaj` + `nodelab-swart` |
| 명희 | official (unread) | Read after invite. Never push, never modify from this token |
| Screens | `index.html`, `js/*`, `admin.html` (future) | Keep calling **this** app’s `/api/*` paths |
| Adapter | `lib/core/*` only | When official module routes exist, proxy/adapt there. Do not rewrite screens to official URLs |

## Adapter rule

1. Browser and static screens continue to `fetch("/api/…")` on Node_Lab.
2. If an official module later exposes a route, add or change a function in `lib/core/*` (or the existing `api/*.mjs` handler that already imports it) so the **same** Node_Lab URL still works.
3. Do not change `js/*.js` to call a 명희 host or path directly.
4. Official keys stay out of the THRL test Vercel project. Official DB is not this app’s write target.

## Node_Lab routes that screens already call

These are **this** repo. Official equivalents are unknown until invite.

| Node_Lab path | Method | Handler | Core swap unit | Screen callers (this repo) |
|---|---|---|---|---|
| `/api/split` | POST | `api/split.mjs` | `pdf-split.mjs`, `pdf-extract.mjs` | `js/pdf.js` (`splitHomeFile`) |
| `/api/gate` | POST | `api/gate.mjs` | `gate.mjs`, `ocr.mjs`, `gemini.mjs` | `js/upload.js`, `js/app.js` |
| `/api/ocr` | POST | `api/ocr.mjs` | `ocr.mjs`, `gate.mjs`, `session.mjs`, `llm.mjs` | `js/solve.js`, `js/app.js`, `js/companion.js` |
| `/api/ocr-confirm` | POST | `api/ocr-confirm.mjs` | `ocr.mjs`, `session.mjs`, `usage.mjs` | `js/solve.js`, `js/app.js` |
| `/api/hint` | POST | `api/hint.mjs` | `hint.mjs`, `llm.mjs`, `solve.mjs` | `js/solve.js`, `js/app.js` |
| `/api/variant` | POST | `api/variant.mjs` | `variant.mjs`, `verify.mjs`, `llm.mjs` | `js/app.js`, `js/mock.js` |
| `/api/usage` | GET | `api/usage.mjs` | `usage.mjs`, `session.mjs` | `scripts/dev.mjs` (wired); not yet a `js/*` fetch |
| `/api/session` | GET/POST | `api/session.mjs` | `session.mjs` | `js/upload.js`, `js/app.js` |
| `/api/config` | GET | `api/config.mjs` | `social.mjs`, `llm.mjs` | `js/auth.js`, `js/pair.js`, `js/app.js`, `js/mock.js`, `js/companion.js` |

Future (not in this tree yet; planned on `cursor/nodelab-admin-2nd-58f5` / Track B):

| Node_Lab path | Method | Handler | Core swap unit | Screen |
|---|---|---|---|---|
| `/api/admin/summary` | GET | `api/admin/summary.mjs` | `lib/core/admin-summary.mjs` | `admin.html` (copy of `wireframes/nodelab-admin.html`) |

Hobby Vercel: keep admin as **one** summary function. Do not split admin into many serverless files.

Client-only PDF crop (`js/pdf.js`) does not have an official URL. It uses `lib/core/pdf-layout.mjs` + `bbox-crop.mjs` in the browser, then may POST `/api/split`.

## Official side — unknown until invite accepted

Do not fill invented names. After invite, add one row per official module with the **observed** path.

| Official path (unread) | Official job (unread) | Maps to Node_Lab unit | Adapter location (when known) | Notes |
|---|---|---|---|---|
| *unknown until invite accepted* | — | `lib/core/pdf-split.mjs` | `lib/core/*` only | Text exam split |
| *unknown until invite accepted* | — | `lib/core/bbox-crop.mjs` | `lib/core/*` only | Normalized bbox + vision JSON parse |
| *unknown until invite accepted* | — | `lib/core/pdf-layout.mjs` | `lib/core/*` only | Marker → box |
| *unknown until invite accepted* | — | `lib/core/pdf-extract.mjs` | `lib/core/*` only | Server pdf.js extract |
| *unknown until invite accepted* | — | `js/pdf.js` | keep client; adapter only if official split API exists | Browser crop + `/api/split` |
| *unknown until invite accepted* | — | `api/split.mjs` | handler stays; core may proxy | |
| *unknown until invite accepted* | — | `api/gate.mjs` | `lib/core/gate.mjs` / `gemini.mjs` | ADR-022 labels |
| *unknown until invite accepted* | — | `api/ocr.mjs` | `lib/core/ocr.mjs` | |
| *unknown until invite accepted* | — | `api/ocr-confirm.mjs` | `lib/core/ocr.mjs` + `usage.mjs` | |
| *unknown until invite accepted* | — | `api/hint.mjs` | `lib/core/hint.mjs` | |
| *unknown until invite accepted* | — | `api/variant.mjs` | `lib/core/variant.mjs` | |
| *unknown until invite accepted* | — | `api/usage.mjs` | `lib/core/usage.mjs` | Guest 3 / free 10 (ADR-025) |
| *unknown until invite accepted* | — | `api/session.mjs` | `lib/core/session.mjs` | Cookie session |
| *unknown until invite accepted* | — | `api/config.mjs` | `lib/core/social.mjs` | Public flags only |
| *unknown until invite accepted* | — | `lib/core/identity.mjs` | `lib/core/identity.mjs` | Guest vs member display |
| *unknown until invite accepted* | — | `lib/core/social.mjs` | `lib/core/social.mjs` | Provider button flags |
| *unknown until invite accepted* | — | `lib/core/gemini.mjs` | `lib/core/gemini.mjs` | Vision; THRL test key only |
| *unknown until invite accepted* | — | future `admin-summary` | `lib/core/admin-summary.mjs` | `nl_*` read; `source: mock` if empty |

## Env (do not mix)

| Project | Use |
|---|---|
| THRL Vercel `nodelab` / `nodelab-swart` | `yrgaj` Supabase, THRL Gemini/OpenCode keys already on this project |
| Official 명희 deploy | unread; do not paste official secrets into THRL env |

## Invite check

If `myunghui/edu_logic_auditor` is still 404, stop mapping official paths. Leave this table as unknown. Put the working clone URL in chat when it exists — do not guess a file tree.
