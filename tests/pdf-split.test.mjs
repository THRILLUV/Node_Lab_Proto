import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { splitExamText, toBankItems } from "../lib/core/pdf-split.mjs";

const FIXTURE = `2026학년도 수능 수학영역
1. $9^{1/4} \\times 3^{-1/2}$ 의 값은?
① $1$  ② $\\sqrt{3}$  ③ $3$  ④ $3\\sqrt{3}$  ⑤ $9$
2. 함수 $f(x)=3x^{3}+4x$ 에 대하여 $f'(1)$의 값은?
① $7$  ② $10$  ③ $13$  ④ $16$  ⑤ $19$
3. 다음 중 옳은 것은?
① 1  ② 2  ③ 3  ④ 4  ⑤ 5
`;

describe("splitExamText", () => {
  it("returns no items for empty text instead of a canned 2026 bank", () => {
    assert.deepEqual(splitExamText(""), []);
    assert.deepEqual(splitExamText("   "), []);
  });

  it("splits numbered exam items and their five choices", () => {
    const items = splitExamText(FIXTURE);
    assert.equal(items.length, 3);
    assert.equal(items[0].n, 1);
    assert.match(items[0].stem, /9\^\{1\/4\}/);
    assert.equal(items[0].choices.length, 5);
    assert.match(items[0].choices[1], /sqrt\{3\}|√3|\\sqrt/);
    assert.equal(items[1].n, 2);
    assert.match(items[1].stem, /f'\(1\)/);
    assert.equal(items[2].n, 3);
  });

  it("does not treat inline 1) choices as new item numbers", () => {
    const items = splitExamText(`1. 2x+5=17 의 값은?
1) 4    2) 5    3) 6    4) 7    5) 8
2. f(x)=x^2 에서 f'(3)의 값은?
`);
    assert.equal(items.length, 2);
    assert.equal(items[0].n, 1);
    assert.match(items[0].stem, /2x\+5=17/);
    assert.equal(items[1].n, 2);
  });

  it("does not treat header-only pages as an item", () => {
    const items = splitExamText("수학 영역\n홀수형\n제2교시");
    assert.equal(items.length, 0);
  });
});

describe("toBankItems", () => {
  it("marks extracted items as source=pdf and does not invent an official answer", () => {
    const bank = toBankItems(splitExamText(FIXTURE));
    assert.equal(bank[0].source, "pdf");
    assert.equal(bank[0].answer, null);
    assert.equal(bank[0].kind, "5지선다");
    assert.equal(bank.length, 3);
  });
});
