import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  normalizePdfItems,
  findItemMarkers,
  boxesFromMarkers,
} from "../lib/core/pdf-layout.mjs";

const tokens = [
  { str: "수학", x: 40, y: 20, w: 40, h: 12 },
  { str: "1.", x: 50, y: 80, w: 16, h: 14 },
  { str: "2x+5=17", x: 70, y: 80, w: 80, h: 14 },
  { str: "2.", x: 50, y: 240, w: 16, h: 14 },
  { str: "f(x)=x^2", x: 70, y: 240, w: 80, h: 14 },
];

describe("findItemMarkers", () => {
  it("uses 1. / 2. starts and ignores leftover words", () => {
    const marks = findItemMarkers(tokens);
    assert.deepEqual(marks.map((m) => m.n), [1, 2]);
    assert.equal(marks[0].y, 80);
  });

  it("does not treat 1) choice labels as item markers", () => {
    const choiceTokens = [
      { str: "1.", x: 50, y: 80, w: 16, h: 14 },
      { str: "1)", x: 70, y: 120, w: 16, h: 14 },
      { str: "2)", x: 90, y: 120, w: 16, h: 14 },
      { str: "2.", x: 50, y: 240, w: 16, h: 14 },
    ];
    const marks = findItemMarkers(choiceTokens);
    assert.deepEqual(marks.map((m) => m.n), [1, 2]);
  });
});

describe("boxesFromMarkers", () => {
  it("crops from marker y to the next marker y", () => {
    const boxes = boxesFromMarkers(findItemMarkers(tokens), 400, 600);
    assert.equal(boxes.length, 2);
    assert.ok(boxes[0].bbox.h > 0.2);
    assert.ok(boxes[0].bbox.y < boxes[1].bbox.y);
  });

  it("enforces minimum normalized box height of 0.08", () => {
    const tight = [
      { n: 1, y: 100 },
      { n: 2, y: 110 },
    ];
    const boxes = boxesFromMarkers(tight, 400, 600);
    assert.ok(boxes.every((b) => b.bbox.h >= 0.08));
  });
});

describe("normalizePdfItems", () => {
  it("flips pdf.js bottom-origin y to page-top=0", () => {
    const pageH = 600;
    const raw = [
      { str: "1.", transform: [12, 0, 0, 12, 50, 520], width: 16, height: 14 },
    ];
    const out = normalizePdfItems(raw, pageH);
    assert.equal(out.length, 1);
    assert.equal(out[0].str, "1.");
    assert.equal(out[0].x, 50);
    assert.equal(out[0].y, pageH - 520 - 14);
    assert.equal(out[0].w, 16);
    assert.equal(out[0].h, 14);
  });
});
