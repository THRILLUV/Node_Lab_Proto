import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { identityFromSession } from "../lib/core/identity.mjs";
import { shouldEnterFromAuthEvent } from "../lib/core/auth-validate.mjs";

describe("identityFromSession", () => {
  it("is a nameless guest when there is no session", () => {
    const id = identityFromSession(null);
    assert.equal(id.guest, true);
    assert.equal(id.name, "게스트");
    assert.equal(id.email, "");
    assert.equal(id.initials, "게");
    assert.equal(id.provider, "");
    assert.doesNotMatch(id.name, /THRILL/i);
    assert.doesNotMatch(String(id.email), /th930531/);
  });

  it("stays guest even if a leftover supabase user is present", () => {
    const id = identityFromSession({
      user: { email: "th930531@gmail.com", user_metadata: { full_name: "THRILL UV" } },
    }, { guest: true });
    assert.equal(id.guest, true);
    assert.equal(id.name, "게스트");
    assert.equal(id.email, "");
  });

  it("uses the signed-in user email and name only after login", () => {
    const id = identityFromSession({
      user: {
        email: "student@example.com",
        user_metadata: { full_name: "김수능" },
        app_metadata: { provider: "google" },
      },
    });
    assert.equal(id.guest, false);
    assert.equal(id.name, "김수능");
    assert.equal(id.email, "student@example.com");
    assert.equal(id.initials, "김");
    assert.equal(id.provider, "google");
  });
});

describe("shouldEnterFromAuthEvent", () => {
  it("does not auto-enter from a stored session on page load", () => {
    assert.equal(shouldEnterFromAuthEvent("INITIAL_SESSION", { guestMode: false }), false);
    assert.equal(shouldEnterFromAuthEvent("TOKEN_REFRESHED", { guestMode: false }), false);
  });

  it("enters only after an explicit sign-in, never while guest mode is on", () => {
    assert.equal(shouldEnterFromAuthEvent("SIGNED_IN", { guestMode: false }), true);
    assert.equal(shouldEnterFromAuthEvent("SIGNED_IN", { guestMode: true }), false);
  });
});
