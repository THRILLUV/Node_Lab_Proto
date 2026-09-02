import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { authProviderFlags, fetchRemoteAuthFlags, mergeAuthFlags, socialButtonState } from "../lib/core/social.mjs";

describe("socialButtonState", () => {
  it("disables all providers when no keys are configured", () => {
    const s = socialButtonState({});
    assert.equal(s.google.enabled, false);
    assert.equal(s.kakao.enabled, false);
    assert.equal(s.naver.enabled, false);
    assert.match(s.google.label, /준비 중/);
  });

  it("enables Google only when the flag is on", () => {
    const s = socialButtonState({ google: true });
    assert.equal(s.google.enabled, true);
    assert.equal(s.google.label, "Google로 계속하기");
    assert.equal(s.kakao.enabled, false);
    assert.equal(s.naver.enabled, false);
  });
});

describe("authProviderFlags", () => {
  it("keeps every provider off without env keys", () => {
    const flags = authProviderFlags({});
    assert.deepEqual(flags, { google: false, kakao: false, naver: false });
  });
});

describe("mergeAuthFlags", () => {
  it("turns Google on from live GoTrue settings even without AUTH_GOOGLE", () => {
    const flags = mergeAuthFlags({ google: false, kakao: false, naver: false }, { google: true });
    assert.deepEqual(flags, { google: true, kakao: false, naver: false });
  });

  it("keeps Kakao/Naver off when the remote provider is off", () => {
    const flags = mergeAuthFlags({ google: true, kakao: false, naver: false }, { google: true, kakao: false, naver: false });
    assert.equal(flags.kakao, false);
    assert.equal(flags.naver, false);
  });
});

describe("fetchRemoteAuthFlags", () => {
  it("reads google from /auth/v1/settings", async () => {
    const flags = await fetchRemoteAuthFlags({
      supabaseUrl: "https://example.supabase.co",
      supabaseAnon: "anon",
      fetchImpl: async (url, init) => {
        assert.match(String(url), /\/auth\/v1\/settings$/);
        assert.equal(init.headers.apikey, "anon");
        return {
          ok: true,
          json: async () => ({ external: { google: true, kakao: false } }),
        };
      },
    });
    assert.deepEqual(flags, { google: true, kakao: false, naver: false });
  });

  it("returns empty flags when settings fetch fails", async () => {
    const flags = await fetchRemoteAuthFlags({
      supabaseUrl: "https://example.supabase.co",
      supabaseAnon: "anon",
      fetchImpl: async () => {
        throw new Error("offline");
      },
    });
    assert.deepEqual(flags, {});
  });
});
