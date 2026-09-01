import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { authProviderFlags, socialButtonState } from "../lib/core/social.mjs";

describe("socialButtonState", () => {
  it("disables all providers when no keys are configured", () => {
    const s = socialButtonState({});
    assert.equal(s.google.enabled, false);
    assert.equal(s.kakao.enabled, false);
    assert.equal(s.naver.enabled, false);
    assert.match(s.google.label, /준비 중/);
  });

  it("enables Google only when the flag is on", () => {
    const s = socialButtonState({ google: true });
    assert.equal(s.google.enabled, true);
    assert.equal(s.google.label, "Google로 계속하기");
    assert.equal(s.kakao.enabled, false);
    assert.equal(s.naver.enabled, false);
  });
});

describe("authProviderFlags", () => {
  it("keeps every provider off without env keys", () => {
    const flags = authProviderFlags({});
    assert.deepEqual(flags, { google: false, kakao: false, naver: false });
  });
});
