import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");

const REQUIRED = [
  "10_doc/00_overview/이식.md",
  "10_doc/10_legal/signup/0. 이_폴더만_쓰면_됨.md",
  "10_doc/10_legal/signup/1. 화면_체크_별명.md",
  "10_doc/10_legal/signup/2. 필수_이용약관.md",
  "10_doc/10_legal/signup/3. 필수_개인정보_수집이용_동의.md",
  "10_doc/10_legal/signup/4. 선택_마케팅_수신_동의.md",
  "10_doc/20_design/signup-consent.md",
  "10_doc/20_design/data-dictionary-nl.md",
  "20_src/frontend/package.json",
  "20_src/frontend/next.config.js",
  "20_src/frontend/.env.local.example",
  "20_src/frontend/lib/supabaseClient.js",
  "20_src/frontend/app/signup/page.jsx",
  "20_src/frontend/app/welcome/page.jsx",
  "20_src/backend/.env.example",
  "90_config/env/README.md",
  "90_config/env/frontend.env.example",
  "90_config/env/backend.env.example",
  "90_config/vercel/deployment-info.md",
  "90_config/supabase/project-info.md",
  "91_mig/supabase/migrations/20260903090000_nl_profiles.sql",
  "91_mig/supabase/migrations/20260903090001_nl_signup_consent.sql",
];

describe("official-shaped transplant tree", () => {
  it("has the folders 명희 copies into edu_logic_auditor", () => {
    for (const rel of REQUIRED) {
      assert.equal(existsSync(join(ROOT, rel)), true, rel);
    }
  });

  it("uses official env key names in the examples", () => {
    const front = readFileSync(join(ROOT, "90_config/env/frontend.env.example"), "utf8");
    const back = readFileSync(join(ROOT, "90_config/env/backend.env.example"), "utf8");
    assert.match(front, /NEXT_PUBLIC_SUPABASE_URL=/);
    assert.match(front, /NEXT_PUBLIC_SUPABASE_ANON_KEY=/);
    assert.match(front, /BACKEND_URL=/);
    assert.match(back, /SUPABASE_URL=/);
    assert.match(back, /SUPABASE_SERVICE_ROLE_KEY=/);
    assert.match(back, /DATABASE_URL=/);
    assert.match(back, /FRONTEND_ORIGIN=/);
    assert.equal(front.includes("eyJ"), false);
    assert.equal(back.includes("eyJ"), false);
  });

  it("does not tell anyone to overwrite official onboarding or profiles", () => {
    const guide = readFileSync(join(ROOT, "10_doc/00_overview/이식.md"), "utf8");
    assert.match(guide, /app\/onboarding/);
    assert.match(guide, /덮어쓰/);
    assert.match(guide, /public\.profiles/);
    assert.match(guide, /app\/signup/);
  });
});
