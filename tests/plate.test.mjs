import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { plateSrc } from "../lib/core/plate.mjs";

describe("plateSrc", () => {
  it("maps 1 and 30 to the cropped originals", () => {
    assert.equal(plateSrc(1), "items/q01.png");
    assert.equal(plateSrc(30), "items/q30.png");
  });

  it("has all 30 plate files on disk", () => {
    for (let n = 1; n <= 30; n += 1) {
      assert.equal(existsSync(plateSrc(n)), true, plateSrc(n));
    }
  });
});
