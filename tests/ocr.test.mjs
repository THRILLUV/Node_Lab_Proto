import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mockOcr, confirmOcr, savePreview } from "../lib/core/ocr.mjs";

describe("mockOcr", () => {
  it("returns numbered latex lines for a math item", () => {
    const r = mockOcr({ item_index: 1 });
    assert.ok(r.lines.length >= 2);
    assert.equal(r.lines[0].step, 1);
    assert.match(r.lines[0].latex, /9\^\{1\/4\}|3\^/);
    assert.equal(r.mock, true);
  });
});

describe("confirmOcr", () => {
  it("returns 409 when no preview and no lines", () => {
    const r = confirmOcr({ sessionId: "s1", itemIndex: 1, result: "ok" });
    assert.equal(r.status, 409);
    assert.equal(r.ok, false);
  });

  it("accepts confirm when preview was saved", () => {
    savePreview("s2", 3, mockOcr({ item_index: 3 }));
    const r = confirmOcr({ sessionId: "s2", itemIndex: 3, result: "ok" });
    assert.equal(r.ok, true);
    assert.ok(r.diagnosis);
    assert.equal(typeof r.diagnosis.primary_category, "string");
  });

  it("accepts client-supplied lines without server preview", () => {
    const r = confirmOcr({
      sessionId: "s3",
      itemIndex: 1,
      result: "ok",
      lines: [{ step: 1, latex: "x=1" }],
    });
    assert.equal(r.ok, true);
  });

  it("retake clears and does not diagnose", () => {
    savePreview("s4", 1, mockOcr({ item_index: 1 }));
    const r = confirmOcr({ sessionId: "s4", itemIndex: 1, result: "retake" });
    assert.equal(r.ok, true);
    assert.equal(r.retake, true);
    assert.equal(r.diagnosis, undefined);
  });
});
