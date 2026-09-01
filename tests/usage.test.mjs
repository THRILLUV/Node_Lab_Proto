import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { chargeUsage, resetUsageForTests, shouldCharge, usageSnapshot } from "../lib/core/usage.mjs";

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
});
