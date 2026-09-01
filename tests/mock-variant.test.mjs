import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  applyRemoteVariant,
  buildVariantSet,
  mockVariantPlan,
  publicVariantPayload,
} from "../lib/core/variant.mjs";

const item1 = {
  n: 1,
  kind: "5지선다",
  type: "지수",
  stem: "9^{1/4} × 3^{-1/2} 의 값은?",
  choices: ["1", "√3", "3", "3√3", "9"],
  answer: "1",
  variants: [
    {
      id: "v1",
      stem: "27^{1/3} × 3^{-1/2} 의 값은?",
      choices: ["1", "√3", "3", "3√3", "9"],
      answer: "√3",
    },
  ],
};

describe("mockVariantPlan", () => {
  it("defaults Free without a gen key to a 10-question static mini", () => {
    assert.deepEqual(mockVariantPlan({ plan: "Free", hasGenKey: false }), {
      count: 10,
      source: "static",
    });
  });

  it("opens 30 slots when Pro or a gen key is present", () => {
    assert.equal(mockVariantPlan({ plan: "Pro", hasGenKey: false }).count, 30);
    assert.equal(mockVariantPlan({ plan: "Free", hasGenKey: true }).count, 30);
    assert.equal(mockVariantPlan({ plan: "Pro", hasGenKey: true }).source, "variant");
    assert.equal(mockVariantPlan({ plan: "Pro", hasGenKey: false }).source, "static");
  });
});

describe("buildVariantSet", () => {
  it("uses the first static variant and a numeric answer index", () => {
    const out = buildVariantSet([item1, { ...item1, n: 2 }], { count: 10 });
    assert.equal(out.length, 2);
    assert.match(out[0].stem, /27\^\{1\/3\}/);
    assert.equal(typeof out[0].answer, "number");
    assert.equal(out[0].choices[out[0].answer - 1], "√3");
    assert.equal(JSON.stringify(out).includes("CAT_"), false);
  });
});

describe("applyRemoteVariant", () => {
  it("falls back to the static variant when the remote payload is empty or leaks CAT_", () => {
    const empty = applyRemoteVariant(item1, {});
    assert.match(empty.stem, /27\^\{1\/3\}/);
    const leak = applyRemoteVariant(item1, { stem: "CAT_LEAK 식", choices: ["1", "2"] });
    assert.match(leak.stem, /27\^\{1\/3\}/);
    assert.equal(JSON.stringify(leak).includes("CAT_"), false);
  });
});

describe("publicVariantPayload", () => {
  it("masks the answer and never includes CAT_", () => {
    const p = publicVariantPayload(
      { id: "v1", stem: "ok", choices: ["1", "2"], answer: "1", note: "CAT_X" },
      1,
    );
    assert.equal(p.answer, undefined);
    assert.equal(p.answer_masked, true);
    assert.equal(p.stem, "ok");
    assert.equal(JSON.stringify(p).includes("CAT_"), false);
  });
});
