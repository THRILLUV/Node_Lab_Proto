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

describe("IA v0.12 intro — landing is logged-out only", () => {
  it("keeps login as the only member CTA and drops save/history/mypage branches", () => {
    assert.deepEqual(landingCtaAction("login"), { view: "login" });
    assert.deepEqual(landingCtaAction("save"), { view: "app", tier: "guest" });
    assert.deepEqual(landingCtaAction("history"), { view: "app", tier: "guest" });
    assert.deepEqual(landingCtaAction("mypage"), { view: "app", tier: "guest" });
  });

  it("does not expose data-landing-login save/history/mypage buttons", () => {
    assert.equal(html.includes("data-landing-login"), false);
    assert.equal(landing.includes(">저장<"), false);
    assert.equal(landing.includes(">지난기록<"), false);
    assert.equal(landing.includes(">마이페이지<"), false);
    assert.equal(html.includes("landingCtaAction(source)"), false);
    assert.match(landing, /id="btn-landing-login"/);
    assert.match(landing, />로그인</);
  });
});

describe("IA v0.12 intro — card 4 저장 약속 is not a guest promise", () => {
  it("does not promise saved records on the landing hero cards", () => {
    assert.equal(landing.includes("내 걸로 만들기"), false);
    assert.equal(landing.includes("기록과 오답을 다음 세션에 연결"), false);
    assert.equal(landing.includes("hero-num\">4"), false);
  });
});
