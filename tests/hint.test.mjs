import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildHint } from "../lib/core/hint.mjs";

describe("buildHint", () => {
  it("never leaks CAT codes to the student", () => {
    for (const choice of ["score", "concept", "hand", "variant", "ask"]) {
      const r = buildHint({
        choice,
        itemIndex: 1,
        lines: [
          { step: 1, latex: "9^{1/4}=3^{1/2}" },
          { step: 2, latex: "3^{1/2}\\times 3^{-1/2}=3" },
        ],
      });
      assert.equal(JSON.stringify(r).includes("CAT_"), false, choice);
      assert.equal(r.message.includes("CAT"), false, choice);
    }
  });

  it("hand feedback points at a human-readable line", () => {
    const r = buildHint({
      choice: "hand",
      itemIndex: 1,
      lines: [
        { step: 1, latex: "9^{1/4}=3^{1/2}" },
        { step: 2, latex: "3^{1/2}\\times 3^{-1/2}=3" },
      ],
    });
    assert.match(r.message, /줄/);
    assert.equal(r.error_step_index, 2);
  });
});
