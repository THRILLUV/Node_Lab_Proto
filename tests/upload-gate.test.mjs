import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { shouldCreateSession } from "../lib/core/upload.mjs";

describe("shouldCreateSession", () => {
  it("blocks not_math and unreadable", () => {
    assert.equal(shouldCreateSession("not_math"), false);
    assert.equal(shouldCreateSession("unreadable"), false);
    assert.equal(shouldCreateSession("answer_key"), false);
  });

  it("allows math_problem and maybe_math", () => {
    assert.equal(shouldCreateSession("math_problem"), true);
    assert.equal(shouldCreateSession("maybe_math"), true);
  });
});
