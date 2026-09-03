# Official env transplant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Official-shaped folders and env names so signup can be copied into `edu_logic_auditor`.

**Architecture:** Keep the live vanilla app at repo root. Add `10_doc` / `20_src` / `90_config` / `91_mig`. Alias official env keys in `lib/core/env-names.mjs`. Sync portable modules into `20_src/frontend/lib/nl`.

**Tech Stack:** Node 22, Next 15.5 (reference app only), Supabase env names, Postgres migrations.

## Global Constraints

- Do not merge this repo into official `main`.
- Do not ALTER `public.profiles`.
- Do not overwrite official `app/onboarding` or `app/admin`.
- No secrets in git.
- Live Vercel root directory stays the vanilla app.

---

### Done in this branch

- [x] Env aliases + tests
- [x] Official folder tree + 이식.md
- [x] Next signup/welcome reference routes
- [x] `nl_profiles` migrations
- [x] Module sync script
