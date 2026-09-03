import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mimeFor } from "../scripts/dev.mjs";

describe("dev mime", () => {
  it("serves png as image/png", () => {
    assert.equal(mimeFor(".png"), "image/png");
  });

  it("serves jpeg as image/jpeg", () => {
    assert.equal(mimeFor(".jpg"), "image/jpeg");
    assert.equal(mimeFor(".jpeg"), "image/jpeg");
  });

  it("serves mjs as javascript", () => {
    assert.equal(mimeFor(".mjs"), "text/javascript; charset=utf-8");
  });
});
