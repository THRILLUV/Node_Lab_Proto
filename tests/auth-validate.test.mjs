import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { landingCtaAction, validateEmailPassword, shouldEnterApp } from "../lib/core/auth-validate.mjs";

describe("validateEmailPassword", () => {
  it("rejects empty email", () => {
    const r = validateEmailPassword({ email: "", password: "secret12" });
    assert.equal(r.ok, false);
    assert.match(r.message, /이메일/);
  });

  it("rejects short password", () => {
    const r = validateEmailPassword({ email: "a@b.co", password: "12" });
    assert.equal(r.ok, false);
    assert.match(r.message, /비밀번호/);
  });

  it("accepts a normal email and password", () => {
    const r = validateEmailPassword({ email: "thrl@example.com", password: "secret12" });
    assert.equal(r.ok, true);
    assert.equal(r.email, "thrl@example.com");
  });
});

describe("shouldEnterApp", () => {
  it("is false without a supabase session", () => {
    assert.equal(shouldEnterApp(null), false);
    assert.equal(shouldEnterApp({}), false);
  });

  it("is true only with user and access_token", () => {
    assert.equal(shouldEnterApp({ user: { id: "u1" }, access_token: "tok" }), true);
  });
});

describe("landingCtaAction", () => {
  it("starts guests in the app without a login wall", () => {
    assert.deepEqual(landingCtaAction("nav"), { view: "app", tier: "guest" });
    assert.deepEqual(landingCtaAction("hero"), { view: "app", tier: "guest" });
  });

  it("keeps the login button for continuing a record", () => {
    assert.deepEqual(landingCtaAction("login"), { view: "login" });
  });

  it("sends save, history, and mypage to login", () => {
    assert.deepEqual(landingCtaAction("save"), { view: "login" });
    assert.deepEqual(landingCtaAction("history"), { view: "login" });
    assert.deepEqual(landingCtaAction("mypage"), { view: "login" });
  });
});
