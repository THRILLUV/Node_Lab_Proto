import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  ONBOARDING_TITLE,
  SAVE_PROMISE_COPY,
  onboardingCompletePayload,
  onboardingProfilePatch,
  onboardingQuestions,
  shouldShowMemberOnboarding,
} from "../lib/core/onboarding.mjs";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const guest = await readFile(new URL("../js/guest.js", import.meta.url), "utf8");
const persistSrc = await readFile(new URL("../lib/core/persist.mjs", import.meta.url), "utf8");

describe("IA v0.12 onboarding — 5-choice session defaults, not a level test", () => {
  it("asks five session-default questions and never scores CAT", () => {
    assert.equal(onboardingQuestions().length, 5);
    const ids = onboardingQuestions().map((q) => q.id);
    assert.deepEqual(ids, ["exam_track", "target_band", "initial_pain_point", "volume", "tutor_mode"]);
    for (const q of onboardingQuestions()) {
      assert.equal(q.options.length, 5);
      assert.equal(JSON.stringify(q).includes("CAT_"), false);
      assert.equal(JSON.stringify(q).includes("레벨테스트"), false);
    }
    assert.equal(ONBOARDING_TITLE, "딱 30초면 맞춤 설정이 끝나요");
  });

  it("is for first Google sign-in only, never for guests", () => {
    assert.equal(shouldShowMemberOnboarding({ guest: true, onboarded: false }), false);
    assert.equal(shouldShowMemberOnboarding({ guest: false, onboarded: false }), true);
    assert.equal(shouldShowMemberOnboarding({ guest: false, onboarded: true }), false);
  });

  it("emits exam_kind/intent/input_type and a profile patch", () => {
    const answers = {
      exam_track: "2026 수능 홀수",
      target_band: "1등급",
      initial_pain_point: "손풀이를 점검받고 싶어요",
      volume: "막힐 때만",
      tutor_mode: "손풀이 봐주기",
    };
    assert.deepEqual(onboardingCompletePayload(answers), {
      exam_kind: "2026 수능 홀수",
      intent: "손풀이를 점검받고 싶어요",
      input_type: "손풀이 봐주기",
    });
    assert.deepEqual(onboardingProfilePatch(answers), {
      exam_track: "2026 수능 홀수",
      tutor_mode: "손풀이 봐주기",
    });
  });
});

describe("IA v0.12 onboarding — wiring and 저장 약속 after signup", () => {
  it("opens the 5-choice flow after first member sign-in, not guest start", () => {
    assert.match(html, /shouldShowMemberOnboarding/);
    assert.match(html, /openOnboarding/);
    assert.match(guest, /window\.NL\.shouldShowMemberOnboarding = shouldShowMemberOnboarding/);
    const enter = html.slice(html.indexOf("window.NL.enterApp"), html.indexOf("window.NL.toast"));
    assert.match(enter, /opts && opts\.guest/);
    assert.equal(enter.includes("손풀이만 미리 맞춰 두면 돼요"), false);
  });

  it("moves the 저장 약속 copy to the after-signup complete card", () => {
    assert.match(SAVE_PROMISE_COPY, /기록과 오답을 다음 세션에 연결/);
    const landing = html.slice(html.indexOf('id="landingScreen"'), html.indexOf('id="loginScreen"'));
    assert.equal(landing.includes(SAVE_PROMISE_COPY), false);
    assert.match(html, /SAVE_PROMISE_COPY/);
    assert.match(html, /첫 문제 시작하기/);
  });

  it("persists exam_track and tutor_mode on nl_profiles, not public.profiles", () => {
    assert.match(persistSrc, /exam_track/);
    assert.match(persistSrc, /tutor_mode/);
    assert.equal(persistSrc.includes("public.profiles"), false);
    assert.match(html, /persistOnboarding/);
  });
});
