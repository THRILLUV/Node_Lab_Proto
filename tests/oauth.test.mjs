import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  allowedRedirect,
  authorizeUrl,
  createOAuthState,
  oauthEmail,
  parseOAuthState,
  providerEnvReady,
  sessionHashRedirect,
  socialStartHref,
} from "../lib/core/oauth.mjs";

describe("providerEnvReady", () => {
  it("keeps Kakao and Naver off without client keys", () => {
    assert.deepEqual(providerEnvReady({}), { kakao: false, naver: false });
  });

  it("turns Kakao on only with REST key and secret", () => {
    assert.equal(providerEnvReady({ KAKAO_REST_API_KEY: "rest", KAKAO_CLIENT_SECRET: "sec" }).kakao, true);
    assert.equal(providerEnvReady({ AUTH_KAKAO: "1" }).kakao, false);
  });

  it("turns Naver on only with client id and secret", () => {
    assert.equal(providerEnvReady({ NAVER_CLIENT_ID: "id", NAVER_CLIENT_SECRET: "sec" }).naver, true);
    assert.equal(providerEnvReady({ AUTH_NAVER: "1" }).naver, false);
  });
});

describe("authorizeUrl", () => {
  it("builds the Naver authorize URL", () => {
    const url = authorizeUrl({
      provider: "naver",
      clientId: "nid",
      redirectUri: "https://app.example/api/auth/naver",
      state: "st",
    });
    assert.match(url, /^https:\/\/nid\.naver\.com\/oauth2\.0\/authorize\?/);
    assert.match(url, /client_id=nid/);
    assert.match(url, /response_type=code/);
    assert.match(url, /state=st/);
  });

  it("builds the Kakao authorize URL", () => {
    const url = authorizeUrl({
      provider: "kakao",
      clientId: "rest",
      redirectUri: "https://app.example/api/auth/kakao",
      state: "st",
    });
    assert.match(url, /^https:\/\/kauth\.kakao\.com\/oauth\/authorize\?/);
    assert.match(url, /client_id=rest/);
    assert.match(url, /response_type=code/);
  });
});

describe("oauth state", () => {
  it("round-trips a signed redirect", () => {
    const state = createOAuthState({ redirect: "https://nodelab-swart.vercel.app/", secret: "s3cret" });
    const parsed = parseOAuthState(state, "s3cret");
    assert.equal(parsed.redirect, "https://nodelab-swart.vercel.app/");
  });

  it("rejects a tampered state", () => {
    const state = createOAuthState({ redirect: "https://nodelab-swart.vercel.app/", secret: "s3cret" });
    assert.equal(parseOAuthState(`${state}x`, "s3cret"), null);
  });
});

describe("allowedRedirect", () => {
  it("allows the live app and local dev only", () => {
    assert.equal(allowedRedirect("https://nodelab-swart.vercel.app/"), true);
    assert.equal(allowedRedirect("http://127.0.0.1:4173/"), true);
    assert.equal(allowedRedirect("https://evil.example/"), false);
  });
});

describe("sessionHashRedirect", () => {
  it("puts tokens on the app origin hash", () => {
    const href = sessionHashRedirect("https://nodelab-swart.vercel.app/", {
      access_token: "at",
      refresh_token: "rt",
    });
    assert.equal(href.startsWith("https://nodelab-swart.vercel.app/#"), true);
    assert.match(href, /access_token=at/);
    assert.match(href, /refresh_token=rt/);
    assert.match(href, /token_type=bearer/);
  });
});

describe("oauthEmail", () => {
  it("prefers the provider email and otherwise uses a stable placeholder", () => {
    assert.equal(oauthEmail({ provider: "naver", subject: "9", email: "a@n.com" }), "a@n.com");
    assert.equal(oauthEmail({ provider: "kakao", subject: "12" }), "kakao_12@users.nodelab.invalid");
  });
});

describe("socialStartHref", () => {
  it("sends Naver and custom Kakao through /api/auth", () => {
    assert.equal(
      socialStartHref({ provider: "naver", origin: "https://nodelab-swart.vercel.app", auth: { naver: true } }),
      "/api/auth/naver?redirect=https%3A%2F%2Fnodelab-swart.vercel.app%2F",
    );
    assert.equal(
      socialStartHref({
        provider: "kakao",
        origin: "https://nodelab-swart.vercel.app",
        auth: { kakao: true, kakaoCustom: true },
      }),
      "/api/auth/kakao?redirect=https%3A%2F%2Fnodelab-swart.vercel.app%2F",
    );
    assert.equal(
      socialStartHref({ provider: "google", origin: "https://nodelab-swart.vercel.app", auth: { google: true } }),
      null,
    );
  });
});
