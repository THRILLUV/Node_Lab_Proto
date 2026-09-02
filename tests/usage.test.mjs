import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  JOIN_COPY,
  chargeUsage,
  resetUsageForTests,
  shouldCharge,
  shouldPromptJoin,
  usageSnapshot,
} from "../lib/core/usage.mjs";

describe("shouldCharge", () => {
  it("does not charge before OCR confirm or on a rejected gate", () => {
    assert.equal(shouldCharge({ gateLabel: "math_problem", ocrConfirmed: false }), false);
    assert.equal(shouldCharge({ gateLabel: "not_math", ocrConfirmed: true }), false);
  });
});

describe("usageSnapshot", () => {
  beforeEach(() => resetUsageForTests());

  it("starts Free users at 0/10 and charges only after confirm", () => {
    assert.deepEqual(usageSnapshot("u1"), { tier: "free", used: 0, limit: 10 });
    chargeUsage("u1", { gateLabel: "not_math", ocrConfirmed: true });
    assert.equal(usageSnapshot("u1").used, 0);
    chargeUsage("u1", { gateLabel: "math_problem", ocrConfirmed: true });
    assert.equal(usageSnapshot("u1").used, 1);
  });

  it("caps guests at 3 items per session", () => {
    assert.deepEqual(usageSnapshot("guest"), { tier: "guest", used: 0, limit: 3 });
    for (let i = 0; i < 3; i++) {
      const snap = chargeUsage("guest", { gateLabel: "math_problem", ocrConfirmed: true, tier: "guest" });
      assert.equal(snap.used, i + 1);
      assert.equal(snap.blocked, undefined);
    }
    const fourth = chargeUsage("guest", { gateLabel: "math_problem", ocrConfirmed: true, tier: "guest" });
    assert.equal(fourth.used, 3);
    assert.equal(fourth.blocked, true);
    assert.equal(fourth.join, true);
    assert.equal(fourth.copy, JOIN_COPY);
    assert.equal(usageSnapshot("guest").used, 3);
  });
});

describe("shouldPromptJoin", () => {
  it("opens the join modal on the 4th guest item or 2nd variant", () => {
    assert.equal(shouldPromptJoin({ tier: "guest", used: 2, itemIndex: 3 }), false);
    assert.equal(shouldPromptJoin({ tier: "guest", used: 3 }), true);
    assert.equal(shouldPromptJoin({ tier: "guest", itemIndex: 4 }), true);
    assert.equal(shouldPromptJoin({ tier: "guest", variantCount: 1 }), false);
    assert.equal(shouldPromptJoin({ tier: "guest", variantCount: 2 }), true);
    assert.equal(shouldPromptJoin({ tier: "free", used: 3, itemIndex: 4, variantCount: 2 }), false);
  });

  it("uses the ADR-009 join copy", () => {
    assert.equal(JOIN_COPY, "여기서부터는 무료 가입하고 이어 풀 수 있어요.");
  });
});
