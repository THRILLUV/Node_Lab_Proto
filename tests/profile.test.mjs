import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { nlProfileRow } from "../lib/core/profile.mjs";

describe("nlProfileRow", () => {
  it("throws when id is missing", () => {
    assert.throws(() => nlProfileRow({ display_name: "THRL" }), /id required/);
  });

  it("builds a free-tier row for nl_profiles", () => {
    const row = nlProfileRow({ id: "11111111-1111-1111-1111-111111111111" });
    assert.equal(row.tier, "free");
    assert.equal(row.display_name, "");
    assert.equal(row.exam_track, "");
    assert.equal(row.tutor_mode, "");
    assert.equal(row.id, "11111111-1111-1111-1111-111111111111");
  });
});
