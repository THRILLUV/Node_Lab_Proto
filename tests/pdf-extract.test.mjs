import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { extractPdfBytes } from "../lib/core/pdf-extract.mjs";

describe("extractPdfBytes", () => {
  it("reads the live fixture instead of a canned 2026 bank", async () => {
    const bytes = await readFile(new URL("./fixtures/exam-mini.pdf", import.meta.url));
    const out = await extractPdfBytes(bytes);
    assert.match(out.text, /2x\+5=17/);
    assert.ok(out.items.length >= 1);
    assert.match(out.items[0].stem, /2x\+5=17/);
    assert.equal(out.items[0].source, "pdf");
  });
});
