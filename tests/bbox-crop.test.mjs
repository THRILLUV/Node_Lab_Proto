import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { clampNormBox, pixelBox, itemType, parseSplitVision } from "../lib/core/bbox-crop.mjs";

describe("clampNormBox", () => {
  it("clips to 0-1 and drops non-positive size", () => {
    assert.deepEqual(clampNormBox({ x: -0.2, y: 0.1, w: 2, h: 0.3 }), { x: 0, y: 0.1, w: 1, h: 0.3 });
    assert.equal(clampNormBox({ x: 0.2, y: 0.2, w: 0, h: 0.1 }), null);
  });
});

describe("pixelBox", () => {
  it("maps a half-page box on a 1000x2000 page", () => {
    const p = pixelBox({ x: 0.1, y: 0.2, w: 0.8, h: 0.25 }, 1000, 2000);
    assert.deepEqual(p, { sx: 100, sy: 400, sw: 800, sh: 500 });
  });
});

describe("itemType", () => {
  it("never returns 추출", () => {
    assert.equal(itemType(7), "문항 7");
    assert.notEqual(itemType(1), "추출");
  });
});

describe("parseSplitVision", () => {
  it("keeps numbered boxes and marks not_math skips", () => {
    const out = parseSplitVision({
      items: [
        { n: 1, bbox: { x: 0.1, y: 0.1, w: 0.8, h: 0.3 } },
        { n: 2, skip: "not_math" },
      ],
    });
    assert.equal(out.items.length, 2);
    assert.equal(out.items[1].skip, "not_math");
  });
});
