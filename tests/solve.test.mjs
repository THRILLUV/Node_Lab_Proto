import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatOcrPreview } from "../lib/core/solve.mjs";

describe("formatOcrPreview", () => {
  it("renders numbered latex lines and no CAT codes", () => {
    const html = formatOcrPreview({
      lines: [
        { step: 1, latex: "9^{1/4}" },
        { step: 2, latex: "3^{1}" },
      ],
    });
    assert.match(html, /9\^\{1\/4\}/);
    assert.match(html, /1번째/);
    assert.equal(html.includes("CAT_"), false);
  });
});
