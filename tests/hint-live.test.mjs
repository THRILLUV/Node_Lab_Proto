import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildHint } from "../lib/core/hint.mjs";

describe("buildHint uses the live item", () => {
  it("talks about the submitted line, not a canned 수능 1번", () => {
    const r = buildHint({
      choice: "hand",
      itemIndex: 3,
      stem: "편입 \\int_0^1 2x dx 의 값은?",
      lines: [
        { step: 1, latex: "\\int_0^1 2x dx = [x^2]_0^1" },
        { step: 2, latex: "= 2" },
      ],
    });
    assert.match(r.message, /2번째 줄/);
    assert.match(r.message, /=\s*2|x\^2/);
    assert.equal(r.message.includes("9^{1/4}"), false);
    assert.equal(JSON.stringify(r).includes("CAT_"), false);
  });
});
