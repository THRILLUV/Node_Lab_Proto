import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { studySessionRow } from "../lib/core/persist.mjs";

describe("studySessionRow", () => {
  it("builds an upload session with exam_key", () => {
    const row = studySessionRow({
      user_id: "u1",
      exam_key: "2026",
      session_id: "11111111-1111-1111-1111-111111111111",
    });
    assert.equal(row.user_id, "u1");
    assert.equal(row.exam_key, "2026");
    assert.equal(row.entry, "upload");
    assert.equal(row.id, "11111111-1111-1111-1111-111111111111");
  });

  it("allows a guest row with null user_id", () => {
    const row = studySessionRow({ exam_key: "dokhak" });
    assert.equal(row.user_id, null);
    assert.equal(row.entry, "upload");
    assert.equal(row.exam_key, "dokhak");
  });

  it("builds a mock retry row with the same exam_key", () => {
    const row = studySessionRow({
      user_id: "u1",
      exam_key: "2026",
      entry: "mock",
      session_id: "22222222-2222-2222-2222-222222222222",
    });
    assert.equal(row.entry, "mock");
    assert.equal(row.exam_key, "2026");
    assert.equal(row.user_id, "u1");
  });
});
