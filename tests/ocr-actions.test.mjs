import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ocrConfirmActions, shouldTrackOcrConfirm } from "../lib/core/solve.mjs";

describe("ocrConfirmActions", () => {
  it("exposes ok, edit, retake in copybook order", () => {
    const ids = ocrConfirmActions().map((a) => a.result);
    assert.deepEqual(ids, ["ok", "edit", "retake"]);
  });
});

describe("shouldTrackOcrConfirm", () => {
  it("does not fire on preview", () => {
    assert.equal(shouldTrackOcrConfirm({ confirmed: false }), false);
  });

  it("fires only after a real confirm", () => {
    assert.equal(shouldTrackOcrConfirm({ confirmed: true }), true);
  });
});
