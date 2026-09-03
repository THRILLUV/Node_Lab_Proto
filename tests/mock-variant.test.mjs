import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  applyRemoteVariant,
  buildVariantSet,
  mockVariantPlan,
  plateKind,
  publicVariantPayload,
  railHint,
  studentChoiceRows,
  studentVisibleVariant,
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

describe("plateKind", () => {
  it("typesets mode 3 so the variant stem is visible", () => {
    assert.equal(plateKind(3), "typeset");
    assert.equal(plateKind(1), "crop");
    assert.equal(plateKind(2), "crop");
  });
});

describe("railHint", () => {
  it("prefers the live stem in mode 3 instead of the original TYPE_HINT", () => {
    assert.match(
      railHint({
        mockMode: 3,
        stem: "27^{1/3} × 3^{-1/2} 의 값은?",
        fallback: "9^{1/4}×3^{-1/2}",
      }),
      /27\^\{1\/3\}/,
    );
    assert.equal(
      railHint({ mockMode: 1, stem: "27^{1/3}", fallback: "9^{1/4}×3^{-1/2}" }),
      "9^{1/4}×3^{-1/2}",
    );
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

describe("studentChoiceRows", () => {
  it("labels five bank choices ①–⑤", () => {
    const rows = studentChoiceRows(["1", "√3", "3", "3√3", "9"]);
    assert.equal(rows.length, 5);
    assert.deepEqual(rows.map((r) => r.mark), ["①", "②", "③", "④", "⑤"]);
    assert.equal(rows[1].text, "√3");
  });

  it("hides CAT codes and skips a bank that is not five choices", () => {
    const leaked = studentChoiceRows(["1", "CAT_2", "3", "4", "5"]);
    assert.equal(leaked.length, 5);
    assert.equal(leaked[1].mark, "②");
    assert.equal(leaked[1].text.includes("CAT_"), false);
    assert.deepEqual(studentChoiceRows(["1", "2"]), []);
    assert.deepEqual(studentChoiceRows(["1", "2", "3", "4", "5", "6"]), []);
  });

  it("student plate and tutor grid expose circled ①–⑤ without CAT_", async () => {
    const { readFile } = await import("node:fs/promises");
    const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
    assert.match(html, /function choiceOptsHtml/);
    assert.match(html, /studentChoiceRows/);
    assert.match(html, /<span class="n">①<\/span>빠른 채점/);
    assert.equal(html.includes("CAT_"), false);
    const mock = await readFile(new URL("../js/mock.js", import.meta.url), "utf8");
    assert.match(mock, /window\.NL\.studentChoiceRows = studentChoiceRows/);
  });
});

describe("studentVisibleVariant", () => {
  it("returns null for failed or CAT-leaking variants", () => {
    assert.equal(studentVisibleVariant({ stem: "" }, "9^{1/4}", 1), null);
    assert.equal(studentVisibleVariant({ stem: "CAT_2 leak", choices: ["1", "2"] }, "9^{1/4}", 1), null);
    assert.equal(studentVisibleVariant({ stem: "9^{1/4}", choices: ["1", "2"] }, "9^{1/4}", 1), null);
  });

  it("returns a passing transformed variant for the student screen", () => {
    const vis = studentVisibleVariant(
      { id: "v1", stem: "27^{1/3} × 3^{-1/2} 의 값은?", choices: ["1", "√3", "3", "3√3", "9"] },
      "9^{1/4} × 3^{-1/2} 의 값은?",
      1,
    );
    assert.ok(vis);
    assert.match(vis.stem, /27\^\{1\/3\}/);
    assert.equal(JSON.stringify(vis).includes("CAT_"), false);
  });

  it("still shows a passing API variant when the crop item stem is empty", () => {
    const vis = studentVisibleVariant(
      { id: "remote", stem: "27^{1/3} × 3^{-1/2} 의 값은?", choices: ["1", "√3", "3", "3√3", "9"] },
      "",
      4,
    );
    assert.ok(vis);
    assert.match(vis.stem, /27\^\{1\/3\}/);
    assert.equal(JSON.stringify(vis).includes("CAT_"), false);
  });

  it("still hides CAT, empty, and untransformed payloads on empty originals", () => {
    assert.equal(studentVisibleVariant({ stem: "" }, "", 1), null);
    assert.equal(studentVisibleVariant({ stem: "CAT_2 leak", choices: ["1", "2"] }, "", 2), null);
    assert.equal(studentVisibleVariant({ stem: "문항 3", choices: ["1", "2"] }, "", 3), null);
  });

  it("applies a passing remote variant onto a crop item with empty stem", () => {
    const crop = { n: 4, stem: "", variants: [], choices: [] };
    const out = applyRemoteVariant(crop, {
      stem: "27^{1/3} × 3^{-1/2} 의 값은?",
      choices: ["1", "√3", "3", "3√3", "9"],
    });
    assert.match(out.stem, /27\^\{1\/3\}/);
    assert.equal(JSON.stringify(out).includes("CAT_"), false);
  });

  it("app gen refuses to paint a failed variant", async () => {
    const { readFile } = await import("node:fs/promises");
    const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
    assert.match(html, /function visibleAppVariant/);
    assert.match(html, /실패분은 화면에 내지 않아요/);
    const mock = await readFile(new URL("../js/mock.js", import.meta.url), "utf8");
    assert.match(mock, /window\.NL\.studentVisibleVariant = studentVisibleVariant/);
  });
});
