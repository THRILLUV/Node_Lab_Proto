import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { cleanRetryState, shouldForceNewSession } from "../lib/core/mock.mjs";

describe("shouldForceNewSession", () => {
  it("is true only for mode 2", () => {
    assert.equal(shouldForceNewSession(2), true);
    assert.equal(shouldForceNewSession(1), false);
    assert.equal(shouldForceNewSession(3), false);
  });
});

describe("cleanRetryState", () => {
  it("drops previous hint, grade, and shuffled bank", () => {
    const prev = {
      examKey: "2026",
      hintMessage: "한 줄만 다시 보면 됩니다",
      phase: "handDone",
      pick: 3,
      mockItems: [{ n: 5, choices: ["x"] }],
      mockOrder: [5, 1, 2],
    };
    const next = cleanRetryState(prev);
    assert.equal(next.examKey, "2026");
    assert.equal(next.entry, "mock");
    assert.equal(next.mockMode, 2);
    assert.equal(next.mockItems, null);
    assert.equal(next.mockOrder, null);
    assert.equal(next.visibleTabs, 30);
    assert.equal(next.currentQ, 1);
    assert.equal(next.phase, "prompt");
    assert.equal(next.pick, null);
    assert.equal(next.hinted, false);
    assert.equal(next.ocrPreview, null);
    assert.equal(next.hintMessage, "");
    assert.notEqual(next.hintMessage, prev.hintMessage);
  });

  it("keeps the same exam_key for the new session row", () => {
    const next = cleanRetryState({ examKey: "dokhak" });
    assert.equal(next.examKey, "dokhak");
    assert.equal(next.entry, "mock");
  });
});
