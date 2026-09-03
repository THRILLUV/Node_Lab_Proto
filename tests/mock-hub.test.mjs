import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mockModes } from "../lib/core/mock.mjs";

describe("mockModes", () => {
  it("returns ADR-010 three modes", () => {
    const ids = mockModes().map((m) => m.id);
    assert.deepEqual(ids, [1, 2, 3]);
    assert.match(mockModes()[0].title, /셔플/);
    assert.match(mockModes()[1].title, /원본/);
    assert.match(mockModes()[2].title, /변형/);
  });
});
