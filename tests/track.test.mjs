import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createTrack } from "../lib/core/track.mjs";

describe("track", () => {
  it("pushes choice_select and ocr_confirm as different events", () => {
    const layer = [];
    const track = createTrack(layer);
    track("choice_select", { choice: "hand", item_index: 1 });
    track("ocr_confirm", { result: "ok", item_index: 1 });
    assert.equal(layer[0].event, "choice_select");
    assert.equal(layer[1].event, "ocr_confirm");
    assert.notEqual(layer[0].event, layer[1].event);
    assert.ok(layer[1].t >= layer[0].t);
  });

  it("records upload_submit as a different moment from choice_select and ocr_confirm", () => {
    const layer = [];
    const track = createTrack(layer);
    track("upload_submit", { file_kind: "pdf" });
    track("choice_select", { choice: "hand", item_index: 1 });
    track("ocr_confirm", { result: "ok", item_index: 1 });
    assert.deepEqual(layer.map((e) => e.event), ["upload_submit", "choice_select", "ocr_confirm"]);
    assert.equal(layer[0].file_kind, "pdf");
  });

  it("home PDF start fires upload_submit", async () => {
    const { readFile } = await import("node:fs/promises");
    const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
    assert.match(html, /track\?\.\("upload_submit"/);
    assert.match(html, /file_kind: "pdf"/);
    assert.match(html, /track\?\.\("choice_select"/);
    const solve = await readFile(new URL("../js/solve.js", import.meta.url), "utf8");
    assert.match(solve, /track\?\.\("ocr_confirm"/);
  });
});
