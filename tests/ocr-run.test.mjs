import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runOcr } from "../lib/core/ocr.mjs";

describe("runOcr", () => {
  it("rejects a request with no photo instead of returning canned mock lines", async () => {
    const r = await runOcr({ itemIndex: 1, text: "9^{1/4} 의 값은?" });
    assert.equal(r.ok, false);
    assert.equal(r.status, 400);
    assert.equal(r.error, "image_required");
    assert.equal(JSON.stringify(r).includes("9^{1/4} = 3^{1/2}"), false);
  });

  it("does not invent handwriting when no vision model is connected", async () => {
    const r = await runOcr({
      imageB64: "data:image/jpeg;base64,aaaa",
      itemIndex: 1,
    });
    assert.equal(r.ok, false);
    assert.equal(r.status, 503);
    assert.equal(r.error, "ocr_unavailable");
    assert.equal(r.mock, undefined);
  });

  it("returns the vision lines for the photo that was sent", async () => {
    const r = await runOcr({
      imageB64: "data:image/jpeg;base64,bbbb",
      text: "이 문항 줄기",
      itemIndex: 4,
      vision: async ({ imageB64, text }) => {
        assert.match(imageB64, /bbbb/);
        assert.match(text, /줄기/);
        return {
          lines: [{ step: 1, latex: "2x+3=7" }],
          confidence: 0.81,
          label: "math_problem",
        };
      },
    });
    assert.equal(r.ok, true);
    assert.equal(r.mock, false);
    assert.equal(r.lines[0].latex, "2x+3=7");
  });
});
