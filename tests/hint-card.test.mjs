import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { studentHintMessage } from "../lib/core/solve.mjs";

describe("studentHintMessage", () => {
  it("returns the human message", () => {
    assert.equal(studentHintMessage({ message: "2번째 줄에서 다시 봐요." }), "2번째 줄에서 다시 봐요.");
  });

  it("refuses CAT codes", () => {
    assert.throws(() => studentHintMessage({ message: "CAT_INDEX" }), /CAT/);
  });
});
