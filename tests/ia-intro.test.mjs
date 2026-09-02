import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { landingCtaAction } from "../lib/core/auth-validate.mjs";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const landing = html.slice(
  html.indexOf('id="landingScreen"'),
  html.indexOf('id="loginScreen"'),
);

describe("IA v0.12 intro — guest starts from the center", () => {
  it("sends nav and hero CTAs into the app as guest", () => {
    assert.deepEqual(landingCtaAction("nav"), { view: "app", tier: "guest" });
    assert.deepEqual(landingCtaAction("hero"), { view: "app", tier: "guest" });
  });

  it("keeps the hero start button on the landing, not behind login", () => {
    assert.match(landing, /id="btn-start-hero"/);
    assert.match(html, /landingCtaAction\("hero"\)/);
    assert.match(html, /enterApp\(null, \{ guest: true \}\)/);
  });
});

describe("IA v0.12 intro — 저장/지난기록/마이페이지 go to login", () => {
  it("routes save, history, and mypage affordances to the login view", () => {
    assert.deepEqual(landingCtaAction("save"), { view: "login" });
    assert.deepEqual(landingCtaAction("history"), { view: "login" });
    assert.deepEqual(landingCtaAction("mypage"), { view: "login" });
    assert.deepEqual(landingCtaAction("login"), { view: "login" });
  });

  it("exposes those affordances on the landing and wires them to login", () => {
    assert.match(landing, /data-landing-login="save"/);
    assert.match(landing, /data-landing-login="history"/);
    assert.match(landing, /data-landing-login="mypage"/);
    assert.match(landing, />저장</);
    assert.match(landing, />지난기록</);
    assert.match(landing, />마이페이지</);
    assert.match(html, /data-landing-login/);
    assert.match(html, /landingCtaAction\(source\)/);
  });
});

describe("IA v0.12 intro — card 4 저장 약속 is not a guest promise", () => {
  it("does not promise saved records on the landing hero cards", () => {
    assert.equal(landing.includes("내 걸로 만들기"), false);
    assert.equal(landing.includes("기록과 오답을 다음 세션에 연결"), false);
    assert.equal(landing.includes("hero-num\">4"), false);
  });
});
