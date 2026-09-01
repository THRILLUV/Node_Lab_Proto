import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { issueSession, readSessionCookie } from "../lib/core/session.mjs";

describe("issueSession", () => {
  it("reuses an existing cookie and does not mint a new id", () => {
    const first = issueSession("nl_session=abc-already");
    assert.equal(first.session_id, "abc-already");
    assert.equal(first.setCookie, undefined);
  });

  it("mints a uuid when no cookie", () => {
    const r = issueSession("");
    assert.match(r.session_id, /^[0-9a-f-]{36}$/);
    assert.match(r.setCookie, /nl_session=/);
  });

  it("renew mints a new id even when a cookie exists", () => {
    const r = issueSession("nl_session=abc-already", { renew: true });
    assert.notEqual(r.session_id, "abc-already");
    assert.match(r.session_id, /^[0-9a-f-]{36}$/);
    assert.match(r.setCookie, /nl_session=/);
  });
});

describe("readSessionCookie", () => {
  it("reads nl_session from a cookie header", () => {
    assert.equal(readSessionCookie("a=1; nl_session=deadbeef; b=2"), "deadbeef");
  });
});
