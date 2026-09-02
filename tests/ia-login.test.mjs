import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { socialButtonState } from "../lib/core/social.mjs";
import { loginPersistPayload } from "../lib/core/persist.mjs";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const login = html.slice(
  html.indexOf('id="loginScreen"'),
  html.indexOf('id="appShell"'),
);
const authJs = await readFile(new URL("../js/auth.js", import.meta.url), "utf8");

describe("IA v0.12 login — Google · Kakao · Naver only", () => {
  it("shows the three social buttons and no email/password fields", () => {
    assert.match(login, /id="btn-google-login"/);
    assert.match(login, /id="btn-kakao-login"/);
    assert.match(login, /id="btn-naver-login"/);
    assert.equal(login.includes("id=\"login-email\""), false);
    assert.equal(login.includes("id=\"login-password\""), false);
    assert.equal(login.includes("id=\"btn-email-login\""), false);
    assert.equal(login.includes("id=\"btn-email-signup\""), false);
    assert.equal(login.includes("이미 가입한 계정이 있나요"), false);
  });

  it("does not wire email/password submit on the student login", () => {
    assert.equal(authJs.includes("btn-email-login"), false);
    assert.equal(authJs.includes("signInWithPassword"), false);
  });
});

describe("IA v0.12 login — keys off stay 준비 중", () => {
  it("starts Kakao and Naver disabled with 준비 중 in the HTML", () => {
    assert.match(login, /id="btn-kakao-login"[^>]*disabled/);
    assert.match(login, /id="btn-naver-login"[^>]*disabled/);
    assert.match(login, /Kakao 준비 중/);
    assert.match(login, /Naver 준비 중/);
  });

  it("keeps Kakao/Naver off in socialButtonState without keys", () => {
    const s = socialButtonState({});
    assert.equal(s.kakao.enabled, false);
    assert.equal(s.naver.enabled, false);
    assert.match(s.kakao.label, /준비 중/);
    assert.match(s.naver.label, /준비 중/);
  });

  it("does not tell a disabled social tap to use email", () => {
    assert.equal(authJs.includes("이메일로 들어와 주세요"), false);
  });
});

describe("IA v0.12 login — no fake timer, no guest carry-over", () => {
  it("never enters the app with setTimeout login", () => {
    assert.equal(/setTimeout\([^)]*enterApp/.test(html), false);
    assert.equal(/setTimeout\([^)]*enterApp/.test(authJs), false);
  });

  it("creates a fresh login session instead of migrating guest records", () => {
    const out = loginPersistPayload({
      id: "11111111-1111-1111-1111-111111111111",
      email: "a@b.co",
    });
    assert.equal(out.session.entry, "login");
    assert.equal(out.session.user_id, "11111111-1111-1111-1111-111111111111");
    assert.equal("guest_session_id" in out.session, false);
    assert.equal("migrate" in out, false);
    assert.equal(JSON.stringify(out).includes("guest"), false);
  });
});

describe("IA v0.12 login — first-visit copy", () => {
  it("uses first-join copy, not a returning-visitor greeting", () => {
    assert.equal(login.includes("다시 만나서 반가워요"), false);
    assert.match(login, /Google 계정 하나면 돼요/);
    assert.equal(login.includes("Pro 페이월"), false);
    assert.equal(login.includes("VIP"), false);
    assert.equal(login.includes("크레딧"), false);
  });
});
