import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatOcrCropModal, ocrConfirmActions, shouldTrackOcrConfirm } from "../lib/core/solve.mjs";

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

describe("formatOcrCropModal", () => {
  it("shows the handwriting crop and 맞아요 before ocr_confirm", () => {
    const html = formatOcrCropModal({
      imageUrl: "data:image/png;base64,abc",
      lines: [{ step: 1, latex: "x=1" }],
    });
    assert.match(html, /data-ocr-crop/);
    assert.match(html, /손풀이 크롭/);
    assert.match(html, /data:image\/png;base64,abc/);
    assert.match(html, /맞아요/);
    assert.match(html, /손풀이가 정확하게 인식되었나요/);
    assert.equal(html.includes("CAT_"), false);
    assert.equal(shouldTrackOcrConfirm({ confirmed: false }), false);
  });

  it("does not render a crop modal without a photo", () => {
    assert.equal(formatOcrCropModal({ lines: [{ step: 1, latex: "x=1" }] }), "");
  });

  it("opens the crop modal from the capture preview path", async () => {
    const { readFile } = await import("node:fs/promises");
    const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
    assert.match(html, /formatOcrCropModal/);
    assert.match(html, /openModal\(cropHtml\)/);
    const solve = await readFile(new URL("../js/solve.js", import.meta.url), "utf8");
    assert.match(solve, /ocr\.imageUrl = imageB64/);
    assert.match(solve, /formatOcrCropModal/);
  });
});
