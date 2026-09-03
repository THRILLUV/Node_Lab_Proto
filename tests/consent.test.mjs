import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  emptyConsentState,
  consentToggle,
  allChecked,
  canSubmitConsent,
  AGE_BANDS,
  nicknameError,
  consentProfilePatch,
  hasCompletedSignup,
  signupStorageKey,
} from "../lib/core/consent.mjs";

describe("emptyConsentState", () => {
  it("returns all flags false", () => {
    assert.deepEqual(emptyConsentState(), {
      terms: false,
      privacy: false,
      marketing: false,
      over14: false,
    });
  });
});

describe("consentToggle", () => {
  it('toggles all four on with "all"', () => {
    const next = consentToggle(emptyConsentState(), "all");
    assert.deepEqual(next, {
      terms: true,
      privacy: true,
      marketing: true,
      over14: true,
    });
  });

  it('toggles all four off when already all on', () => {
    const allOn = consentToggle(emptyConsentState(), "all");
    const next = consentToggle(allOn, "all");
    assert.deepEqual(next, emptyConsentState());
  });

  it("turns off only marketing when all are on", () => {
    const allOn = consentToggle(emptyConsentState(), "all");
    const next = consentToggle(allOn, "marketing");
    assert.equal(next.marketing, false);
    assert.equal(next.terms, true);
    assert.equal(next.privacy, true);
    assert.equal(next.over14, true);
    assert.equal(allChecked(next), false);
  });
});

describe("allChecked", () => {
  it("is true only when all four flags are true", () => {
    assert.equal(allChecked(emptyConsentState()), false);
    assert.equal(
      allChecked({ terms: true, privacy: true, marketing: true, over14: true }),
      true,
    );
    assert.equal(
      allChecked({ terms: true, privacy: true, marketing: false, over14: true }),
      false,
    );
  });
});

describe("canSubmitConsent", () => {
  it("requires terms, privacy, and over14 only", () => {
    assert.equal(canSubmitConsent(emptyConsentState()), false);
    assert.equal(
      canSubmitConsent({ terms: true, privacy: true, marketing: false, over14: true }),
      true,
    );
    assert.equal(
      canSubmitConsent({ terms: true, privacy: false, marketing: true, over14: true }),
      false,
    );
  });
});

describe("AGE_BANDS", () => {
  it("lists the six age bands with en-dash", () => {
    assert.deepEqual(AGE_BANDS, [
      "14–16세",
      "17–19세",
      "20–24세",
      "25–29세",
      "30–39세",
      "40세 이상",
    ]);
  });
});

describe("nicknameError", () => {
  it("rejects nicknames outside 2–12 characters", () => {
    assert.equal(nicknameError(""), "별명은 2~12자로 지어 주세요.");
    assert.equal(nicknameError("a"), "별명은 2~12자로 지어 주세요.");
    assert.equal(nicknameError("abcdefghijklm"), "별명은 2~12자로 지어 주세요.");
  });

  it("trims whitespace before length check", () => {
    assert.equal(nicknameError("  ab  "), "");
    assert.equal(nicknameError("  a  "), "별명은 2~12자로 지어 주세요.");
  });

  it("rejects profanity", () => {
    const banned = ["시발", "씨발", "병신", "개새", "새끼", "fuck", "shit"];
    for (const word of banned) {
      assert.equal(nicknameError(word), "쓸 수 없는 단어가 들어 있어요.", `expected ban for ${word}`);
      assert.equal(nicknameError(`xx${word}yy`), "쓸 수 없는 단어가 들어 있어요.", `expected ban for embedded ${word}`);
    }
  });

  it("accepts a valid nickname", () => {
    assert.equal(nicknameError("노드랩"), "");
    assert.equal(nicknameError("THRL"), "");
  });
});

describe("consentProfilePatch", () => {
  it("throws when userId is missing", () => {
    assert.throws(
      () => consentProfilePatch({ nickname: "노드", ageBand: "20–24세", marketing: false }),
      /userId/,
    );
  });

  it("builds a profile patch with consent metadata", () => {
    const patch = consentProfilePatch({
      userId: "11111111-1111-1111-1111-111111111111",
      nickname: "노드",
      ageBand: "20–24세",
      marketing: true,
    });
    assert.equal(patch.id, "11111111-1111-1111-1111-111111111111");
    assert.equal(patch.nickname, "노드");
    assert.equal(patch.age_band, "20–24세");
    assert.equal(patch.over14, true);
    assert.equal(patch.terms_version, "v0.1");
    assert.equal(patch.privacy_version, "v0.1");
    assert.equal(patch.marketing_opt_in, true);
    assert.match(patch.consented_at, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it("coerces marketing to boolean", () => {
    const patch = consentProfilePatch({
      userId: "u1",
      nickname: "ab",
      ageBand: "14–16세",
      marketing: 0,
    });
    assert.equal(patch.marketing_opt_in, false);
  });
});

describe("hasCompletedSignup", () => {
  it("is false for null, undefined, or empty row", () => {
    assert.equal(hasCompletedSignup(null), false);
    assert.equal(hasCompletedSignup(undefined), false);
    assert.equal(hasCompletedSignup({}), false);
  });

  it("is false when any required field is missing", () => {
    assert.equal(hasCompletedSignup({ terms_version: "v0.1", privacy_version: "v0.1" }), false);
    assert.equal(hasCompletedSignup({ terms_version: "v0.1", nickname: "ab" }), false);
    assert.equal(hasCompletedSignup({ privacy_version: "v0.1", nickname: "ab" }), false);
  });

  it("is true when terms_version, privacy_version, and nickname are set", () => {
    assert.equal(
      hasCompletedSignup({
        terms_version: "v0.1",
        privacy_version: "v0.1",
        nickname: "노드",
      }),
      true,
    );
  });
});

describe("signupStorageKey", () => {
  it("prefixes userId with nl_signup:", () => {
    assert.equal(signupStorageKey("user-abc"), "nl_signup:user-abc");
  });
});
