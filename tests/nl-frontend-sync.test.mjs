import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { NL_FRONTEND_FILES, pairFor, transformCoreModule } from "../scripts/sync-nl-frontend-lib.mjs";

describe("20_src/frontend/lib/nl drop-in copies", () => {
  it("stays in sync with lib/core", () => {
    for (const name of NL_FRONTEND_FILES) {
      const { src, dest } = pairFor(name);
      const expected = transformCoreModule(readFileSync(src, "utf8"), name);
      const actual = readFileSync(dest, "utf8");
      assert.equal(actual, expected, dest);
    }
  });
});
