import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { verifyVariant } from "../lib/core/verify.mjs";

describe("verifyVariant", () => {
  it("rejects an unchanged or empty variant", () => {
    assert.equal(verifyVariant({ expr_original: "9^{1/4}", expr_variant: "9^{1/4}" }).pass, false);
    assert.equal(verifyVariant({ expr_original: "9^{1/4}", expr_variant: "" }).pass, false);
  });

  it("rejects CAT leaks and duplicate choices", () => {
    const leak = verifyVariant({
      expr_original: "a",
      expr_variant: "CAT_X b",
      choices: ["1", "2", "3", "4", "5"],
    });
    assert.equal(leak.pass, false);
    const dup = verifyVariant({
      expr_original: "a",
      expr_variant: "b",
      choices: ["1", "1", "2", "3", "4"],
    });
    assert.equal(dup.pass, false);
  });

  it("passes a distinct well-formed variant", () => {
    const r = verifyVariant({
      expr_original: "9^{1/4} \\times 3^{-1/2}",
      expr_variant: "27^{1/3} \\times 3^{-1/2}",
      choices: ["1", "√3", "3", "3√3", "9"],
      answer: "√3",
    });
    assert.equal(r.pass, true);
  });
});
