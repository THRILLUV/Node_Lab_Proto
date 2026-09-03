import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { consentProfilePatch } from "../lib/core/consent.mjs";
import {
  fetchSignupRow,
  readLocalSignup,
  writeLocalSignup,
  resolveSignupStatus,
  saveSignupProfile,
  gateDecision,
} from "../lib/core/signup-gate.mjs";

const COMPLETE = {
  nickname: "노드",
  terms_version: "v0.1",
  privacy_version: "v0.1",
};

const SESSION = { user: { id: "user-abc" }, access_token: "tok" };

function memoryStorage(initial = {}) {
  const map = { ...initial };
  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(map, key) ? map[key] : null;
    },
    setItem(key, value) {
      map[key] = String(value);
    },
    removeItem(key) {
      delete map[key];
    },
  };
}

function mockSb({
  data = null,
  error = null,
  upsertError = null,
  upsertReject = null,
  throwOnSelect = false,
} = {}) {
  const calls = [];
  const sb = {
    calls,
    from(table) {
      calls.push(["from", table]);
      const chain = {
        select(cols) {
          calls.push(["select", cols]);
          return chain;
        },
        eq(col, val) {
          calls.push(["eq", col, val]);
          return chain;
        },
        maybeSingle() {
          calls.push(["maybeSingle"]);
          if (throwOnSelect) return Promise.reject(new Error("column missing"));
          return Promise.resolve({ data, error });
        },
        upsert(patch) {
          calls.push(["upsert", patch]);
          if (upsertReject) return Promise.reject(upsertReject);
          return Promise.resolve({ error: upsertError });
        },
      };
      return chain;
    },
  };
  return sb;
}

describe("resolveSignupStatus", () => {
  it("is complete when the profile row has finished signup", () => {
    assert.equal(resolveSignupStatus({ row: COMPLETE, local: null }), "complete");
  });

  it("is complete when the row is missing but local storage is complete", () => {
    assert.equal(resolveSignupStatus({ row: null, local: COMPLETE }), "complete");
  });

  it("needs consent when both row and local are missing or incomplete", () => {
    assert.equal(resolveSignupStatus({ row: null, local: null }), "needs_consent");
    assert.equal(resolveSignupStatus({ row: { nickname: "노드" }, local: null }), "needs_consent");
    assert.equal(resolveSignupStatus({ row: {}, local: {} }), "needs_consent");
  });

  it("falls back to complete when the row query errored but local is complete", () => {
    assert.equal(resolveSignupStatus({ row: { error: true }, local: COMPLETE }), "complete");
  });
});

describe("readLocalSignup / writeLocalSignup", () => {
  it("round-trips a signup patch through injected storage", () => {
    const storage = memoryStorage();
    const patch = { nickname: "노드", terms_version: "v0.1", privacy_version: "v0.1" };
    writeLocalSignup("user-abc", patch, storage);
    assert.equal(storage.getItem("nl_signup:user-abc"), JSON.stringify(patch));
    assert.deepEqual(readLocalSignup("user-abc", storage), patch);
  });

  it("returns null when nothing is stored", () => {
    assert.equal(readLocalSignup("user-abc", memoryStorage()), null);
  });
});

describe("fetchSignupRow", () => {
  it("selects nickname and consent versions from nl_profiles", async () => {
    const sb = mockSb({ data: COMPLETE });
    const row = await fetchSignupRow(sb, "user-abc");
    assert.deepEqual(row, COMPLETE);
    assert.deepEqual(sb.calls[0], ["from", "nl_profiles"]);
    assert.deepEqual(sb.calls[1], ["select", "nickname,terms_version,privacy_version"]);
    assert.deepEqual(sb.calls[2], ["eq", "id", "user-abc"]);
    assert.deepEqual(sb.calls[3], ["maybeSingle"]);
  });

  it("returns null when no profile row exists", async () => {
    const sb = mockSb({ data: null, error: null });
    assert.equal(await fetchSignupRow(sb, "user-abc"), null);
  });

  it("returns { error: true } on query errors without throwing", async () => {
    const sb = mockSb({ data: null, error: { message: "column does not exist" } });
    assert.deepEqual(await fetchSignupRow(sb, "user-abc"), { error: true });
    const throwing = mockSb({ throwOnSelect: true });
    assert.deepEqual(await fetchSignupRow(throwing, "user-abc"), { error: true });
  });
});

describe("saveSignupProfile", () => {
  it("upserts the patch onto nl_profiles", async () => {
    const sb = mockSb();
    const patch = consentProfilePatch({
      userId: "user-abc",
      nickname: "노드",
      ageBand: "20–24세",
      marketing: false,
    });
    const out = await saveSignupProfile(sb, patch);
    assert.equal(out.error, null);
    assert.deepEqual(sb.calls[0], ["from", "nl_profiles"]);
    assert.deepEqual(sb.calls[1], ["upsert", patch]);
  });

  it("returns { error } when upsert rejects instead of throwing", async () => {
    const boom = new Error("network");
    const sb = mockSb({ upsertReject: boom });
    const out = await saveSignupProfile(sb, { id: "user-abc" });
    assert.equal(out.error, boom);
  });

  it("returns { error } when supabase reports an error object", async () => {
    const err = { message: "rls" };
    const sb = mockSb({ upsertError: err });
    const out = await saveSignupProfile(sb, { id: "user-abc" });
    assert.equal(out.error, err);
  });
});

describe("gateDecision", () => {
  it("ignores sessions that should not enter the app", () => {
    assert.equal(gateDecision({ session: null, status: "complete" }), "ignore");
    assert.equal(gateDecision({ session: {}, status: "needs_consent" }), "ignore");
  });

  it("enters directly and does not open consent when signup is complete", () => {
    assert.equal(gateDecision({ session: SESSION, status: "complete" }), "enter");
  });

  it("opens consent for a new member who has not finished signup", () => {
    assert.equal(gateDecision({ session: SESSION, status: "needs_consent" }), "consent");
  });
});

describe("signup gate wiring", () => {
  it("routes SIGNED_IN through resolveSignupStatus and openSignupConsent", async () => {
    const authJs = await readFile(new URL("../js/auth.js", import.meta.url), "utf8");
    assert.match(authJs, /resolveSignupStatus/);
    assert.match(authJs, /openSignupConsent/);
    assert.match(authJs, /gateDecision/);
    assert.equal(
      authJs.includes("shouldEnterApp(session)) return false;\n  window.NL?.enterApp"),
      false,
    );
  });

  it("signs the refuser out and keeps them on the landing", async () => {
    const authJs = await readFile(new URL("../js/auth.js", import.meta.url), "utf8");
    assert.match(authJs, /signOut/);
    assert.match(authJs, /동의하지 않으면 회원 기능을 쓸 수 없어요\. 게스트로 둘러볼 수 있어요\./);
    assert.match(authJs, /writeLocalSignup/);
    assert.match(authJs, /saveSignupProfile/);
    assert.match(authJs, /signup_consent/);
    assert.match(authJs, /consentProfilePatch/);
  });

  it("does not open the consent modal from the guest enterApp path", async () => {
    const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
    const enter = html.slice(html.indexOf("window.NL.enterApp"), html.indexOf("window.NL.toast"));
    assert.equal(enter.includes("openSignupConsent"), false);
    assert.match(html, /enterApp\(null, \{ guest: true \}\)/);
  });
});
