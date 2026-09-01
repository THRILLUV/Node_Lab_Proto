import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { loginPersistPayload, persistLoginRecords } from "../lib/core/persist.mjs";

describe("loginPersistPayload", () => {
  it("throws without a user id", () => {
    assert.throws(() => loginPersistPayload({}), /user id required/);
  });

  it("builds nl_profiles upsert and nl_sessions insert", () => {
    const out = loginPersistPayload({
      id: "11111111-1111-1111-1111-111111111111",
      email: "thrl@example.com",
    });
    assert.equal(out.profile.id, "11111111-1111-1111-1111-111111111111");
    assert.equal(out.profile.tier, "free");
    assert.equal(out.profile.display_name, "thrl@example.com");
    assert.equal(out.session.user_id, "11111111-1111-1111-1111-111111111111");
    assert.equal(out.session.entry, "login");
  });
});

describe("persistLoginRecords", () => {
  it("upserts nl_profiles then inserts nl_sessions", async () => {
    const calls = [];
    const sb = {
      from(table) {
        return {
          upsert(row) {
            calls.push(["upsert", table, row]);
            return Promise.resolve({ error: null });
          },
          insert(row) {
            calls.push(["insert", table, row]);
            return Promise.resolve({ error: null });
          },
        };
      },
    };
    await persistLoginRecords(sb, { id: "u1", email: "a@b.co" });
    assert.equal(calls[0][0], "upsert");
    assert.equal(calls[0][1], "nl_profiles");
    assert.equal(calls[1][0], "insert");
    assert.equal(calls[1][1], "nl_sessions");
    assert.equal(calls[1][2].entry, "login");
  });
});
