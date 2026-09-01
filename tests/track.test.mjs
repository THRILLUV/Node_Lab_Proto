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
});
