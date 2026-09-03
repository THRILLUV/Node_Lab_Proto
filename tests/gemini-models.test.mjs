import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { geminiModels } from "../lib/core/gemini.mjs";

describe("geminiModels", () => {
  it("keeps 3.7 first per ADR, then current flash fallbacks", () => {
    assert.deepEqual(geminiModels({}), [
      "gemini-3.7-flash",
      "gemini-3.6-flash",
      "gemini-3.5-flash",
    ]);
  });

  it("puts GEMINI_MODEL first without duplicates", () => {
    const models = geminiModels({ GEMINI_MODEL: "gemini-3.6-flash" });
    assert.equal(models[0], "gemini-3.6-flash");
    assert.equal(new Set(models).size, models.length);
    assert.ok(models.includes("gemini-3.7-flash"));
    assert.ok(models.includes("gemini-3.5-flash"));
  });
});
