import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { shuffleMock } from "../lib/core/mock.mjs";

describe("shuffleMock", () => {
  it("keeps the same answers after shuffling choices", () => {
    const items = [
      { n: 1, choices: ["a", "b", "c", "d", "e"], answer: 3 },
      { n: 2, choices: ["p", "q", "r", "s", "t"], answer: 1 },
    ];
    const out = shuffleMock(items, 7);
    assert.equal(out.length, 2);
    out.forEach((it, i) => {
      const src = items.find((x) => x.n === it.n);
      assert.equal(it.choices[it.answer - 1], src.choices[src.answer - 1]);
    });
  });

  it("is deterministic for the same seed", () => {
    const items = [
      { n: 1, choices: ["a", "b", "c", "d", "e"], answer: 2 },
      { n: 2, choices: ["p", "q", "r", "s", "t"], answer: 5 },
      { n: 3, choices: ["u", "v", "w", "x", "y"], answer: 1 },
    ];
    assert.deepEqual(shuffleMock(items, 42), shuffleMock(items, 42));
  });
});
