# Transplant modules (swap units)

Inventory of **this** repo (`THRILLUV/Node_Lab`) as copy/swap units for a later transplant. Official `myunghui/edu_logic_auditor` is 404 from this token — **unread**. Do not invent 명희 folder names.

**Rule:** Node_Lab is the write target. 명희 repo is read-only reference. When official module routes appear, add an adapter in `lib/core/*` only. Do not rewrite screens to call official URLs directly.

See `docs/eng/official-api-map.md` for route ↔ unit mapping and the unknown-until-invite table.

## Swap units in this tree

| Path | Job | Depends on | Transplant notes |
|---|---|---|---|
| `lib/core/pdf-split.mjs` | Parse exam text into numbered stems/choices and bank rows (`splitExamText`, `toBankItems`). | `lib/core/bbox-crop.mjs` (`itemType`) | Pure string logic. Default `type` is `문항 N`, not `추출`. Pair with layout/crop; do not swap screens onto an official split URL. |
| `lib/core/bbox-crop.mjs` | Clamp normalized boxes, map to pixels, label `문항 N`, parse split-vision JSON. | None (leaf) | Shared by client crop and any future Gemini bbox. Keep names: `clampNormBox`, `pixelBox`, `itemType`, `parseSplitVision`. |
| `lib/core/pdf-layout.mjs` | Turn pdf.js text items into markers and per-item normalized boxes. | `bbox-crop.mjs` (`clampNormBox`) | Browser + tests. Uses PDF user-space height, not scaled viewport. |
| `lib/core/pdf-extract.mjs` | Server-side: decode base64 PDF, extract text via `pdfjs-dist` legacy, then split into bank items. | `pdfjs-dist/legacy`, `pdf-split.mjs` | Node only. Client crop plates stay in `js/pdf.js`; this path has no JPEG plates. |
| `js/pdf.js` | Browser pdf.js: render pages, crop plates from marker boxes, merge with `/api/split`, write `window.NL` session bank. | `pdf-split.mjs`, `pdf-layout.mjs`, `bbox-crop.mjs`; `fetch("/api/split")` | Keep calling Node_Lab `/api/split`. CDN pdf.js 4.10.38. `applySessionBank` / `splitHomeFile` are the UI contract. |
| `api/split.mjs` | POST: split `text` and/or `pdf_b64` into `{ items, count, text, pageCount }`. | `http.mjs`, `pdf-split.mjs`, `pdf-extract.mjs` | Vercel function. Counts toward Hobby 12; do not add a second split API. Official split, if any, is adapted behind this handler. |
| `api/gate.mjs` | POST: classify upload as math / maybe / not_math / unreadable; optional Gemini vision when keyed. | `http.mjs`, `lib/core/gate.mjs`, `ocr.mjs` (`estimateImageBytes`), `gemini.mjs` | Screens: `js/upload.js`, `js/app.js`. Labels are ADR-022; do not change copy here. |
| `api/ocr.mjs` | POST: gate, run OCR/vision, save preview, return lines + `session_id`. | `http.mjs`, `gate.mjs`, `ocr.mjs`, `session.mjs`, `llm.mjs` | Screens: `js/solve.js`, `js/app.js`, `js/companion.js`. |
| `api/ocr-confirm.mjs` | POST: confirm/retake OCR; charge usage unless retake. | `http.mjs`, `ocr.mjs`, `session.mjs`, `usage.mjs` | Join copy comes from usage ledger, not the screen. |
| `api/hint.mjs` | POST: build hint payload; optional live LLM rewrite of message. | `http.mjs`, `hint.mjs`, `llm.mjs`, `solve.mjs` | Screens keep `/api/hint`. |
| `api/variant.mjs` | POST: live variant if keyed, else bank `questions.json`; verify before return. | `http.mjs`, `variant.mjs`, `verify.mjs`, `llm.mjs`, `questions.json` | Screens: `js/app.js`, `js/mock.js`. |
| `api/usage.mjs` | GET: guest usage snapshot + session cookie. | `http.mjs`, `session.mjs`, `usage.mjs` | Wired in `scripts/dev.mjs`. No `js/*` fetch yet; still a swap unit. |
| `api/session.mjs` | GET/POST: issue/renew cookie `session_id`. | `http.mjs`, `session.mjs` | Screens: `js/upload.js`, `js/app.js`. |
| `api/config.mjs` | GET: public Supabase anon, LLM flags, social provider flags. | `http.mjs`, `social.mjs`, `llm.mjs` | Default `yrgaj` URL/anon in this file is THRL test, not official. Do not point at 명희 env. |
| `lib/core/usage.mjs` | In-memory ledger: guest 3 / free 10 / pro unlimited; join prompt. | None | Process-local Map — not durable. Official usage service, if any, adapters here. Policy names stay ADR-025. |
| `lib/core/identity.mjs` | Map Supabase session (or guest) to `{ name, email, initials, provider }`. | None | Used by `js/guest.js`. Display only; no official auth URL in the screen. |
| `lib/core/social.mjs` | Button labels/enabled flags; merge env + remote Supabase `/auth/v1/settings`. | `oauth-shared.mjs` | `api/config.mjs` is the HTTP surface. Google flag is remote-only in current code. |
| `lib/core/gemini.mjs` | Gemini vision generateContent with flash model fallbacks; parse JSON. | `GEMINI_API_KEY` / `GOOGLE_API_KEY` | Imported by `llm.mjs` and `api/gate.mjs`. THRL test keys only. Guest must not use production Gemini (use free-tier key or local crop). |

## Future swap units (not in this tree)

Planned Track B / admin-2nd. Do not invent official admin paths.

| Path | Job | Depends on | Transplant notes |
|---|---|---|---|
| `lib/core/admin-summary.mjs` | One read model for admin mock + `nl_*` counts (`source: mock` if empty). | unread official admin API; THRL `nl_profiles` / `nl_billing` / `nl_events` when present | Adapter lives here when 명희 publishes a module route. |
| `api/admin/summary.mjs` | GET one Hobby-safe admin payload. Auth: `?k=` or `NL_ADMIN_KEY`, not student Google. | `admin-summary.mjs`, `http.mjs` | Do not split into many admin functions. Screens still hit this Node_Lab URL. |
| `admin.html` | Deployable copy of `wireframes/nodelab-admin.html` (SCR810–850, 910 mock). | `/api/admin/summary` | Do not edit `wireframes/nodelab-proto.html`. Do not fetch official hosts from this page. |

## Copy order (when transplanting)

1. Leaves: `bbox-crop.mjs`, `usage.mjs`, `identity.mjs`, `gemini.mjs`.
2. PDF: `pdf-split.mjs` → `pdf-layout.mjs` → `pdf-extract.mjs` → `js/pdf.js` → `api/split.mjs`.
3. Loop: core `gate`/`ocr`/`hint`/`variant`/`session`/`social` then matching `api/*.mjs`.
4. Admin last: `admin-summary.mjs` → `api/admin/summary.mjs` → `admin.html`.

Screens stay on Node_Lab `/api/*`. Official routes, once observed, go in `official-api-map.md` and behind `lib/core/*`.
