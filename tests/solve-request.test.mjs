import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildOcrBody } from "../lib/core/solve.mjs";

describe("buildOcrBody", () => {
  it("refuses to send the canned demo stem as if it were a photo", () => {
    assert.throws(
      () => buildOcrBody({ sessionId: "s", itemIndex: 1, stem: "9^{1/4} 의 값은?" }),
      /image_required/,
    );
  });

  it("includes the real photo and the live stem as context only", () => {
    const body = buildOcrBody({
      sessionId: "s",
      itemIndex: 2,
      imageB64: "data:image/jpeg;base64,ccc",
      stem: "편입 미적분 3번",
    });
    assert.equal(body.image_b64, "data:image/jpeg;base64,ccc");
    assert.equal(body.text, "편입 미적분 3번");
    assert.equal(body.item_index, 2);
  });
});
