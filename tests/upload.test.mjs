import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { canStartFromHome } from "../lib/core/upload.mjs";

describe("canStartFromHome", () => {
  it("blocks start when no file is attached", () => {
    assert.equal(canStartFromHome({ fileName: "" }), false);
    assert.equal(canStartFromHome({}), false);
  });

  it("allows start after a file name is present", () => {
    assert.equal(canStartFromHome({ fileName: "2026.pdf" }), true);
  });
});
