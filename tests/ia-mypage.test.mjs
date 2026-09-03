import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { emptyIntroState } from "../lib/core/identity.mjs";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const guest = await readFile(new URL("../js/guest.js", import.meta.url), "utf8");
const start = html.indexOf("function renderHub");
const next = html.indexOf("\n  function ", start + 10);
const hub = html.slice(start, next > 0 ? next : undefined);
const logoutFn = html.slice(html.indexOf("function logout()"), html.indexOf("function openModal"));

describe("emptyIntroState", () => {
  it("returns a cleared landing, not an in-app guest session", () => {
    const s = emptyIntroState();
    assert.equal(s.publicView, "landing");
    assert.equal(s.guestMode, false);
    assert.equal(s.authSession, null);
    assert.equal(s.authenticated, false);
    assert.equal(s.userTier, "guest");
    assert.equal(s.usageUsed, 0);
  });
});

describe("IA v0.12 mypage — name/email read-only", () => {
  it("renders name and email as readonly fields", () => {
    assert.match(hub, /view === "account"/);
    assert.match(hub, /readonly/);
    assert.match(hub, /<label>이름<\/label>/);
    assert.match(hub, /<label>이메일<\/label>/);
    assert.equal(hub.includes('data-modal="save-profile"'), false);
    assert.equal(hub.includes("data-hub-action=\"edit-profile\""), false);
  });
});

describe("IA v0.12 mypage — 설정 tab shell", () => {
  it("adds a settings hub view with no payment controls", () => {
    assert.match(hub, /view === "settings"/);
    assert.match(hub, /data-hub-view="settings"/);
    assert.match(hub, />설정</);
    const settingsStart = hub.indexOf('view === "settings"');
    const settings = hub.slice(settingsStart, settingsStart + 900);
    assert.equal(settings.includes("data-hub-action=\"pay\""), false);
    assert.equal(settings.includes("4242"), false);
    assert.equal(settings.includes("Pro 페이월"), false);
    assert.equal(settings.includes("크레딧"), false);
  });
});

describe("IA v0.12 mypage — hub card body typography", () => {
  it("keeps .hub-card p styling alongside .hub-tabs", () => {
    assert.match(html, /\.hub-card p\{font-size:13px;line-height:1\.5;color:var\(--text-secondary\)\}/);
    assert.match(html, /\.hub-tabs\{display:flex/);
  });
});

describe("S6 mypage — member nickname, age band, marketing", () => {
  it("renders a nickname input, readonly age band, and marketing toggle for members", () => {
    const accountStart = hub.indexOf('view === "account"');
    assert.ok(accountStart >= 0, "account view missing from renderHub");
    const settingsStart = hub.indexOf('view === "settings"');
    const account = hub.slice(accountStart, settingsStart > accountStart ? settingsStart : accountStart + 4000);
    assert.match(account, /id\.guest/);
    assert.match(account, /<label>별명<\/label>/);
    assert.match(account, /data-mypage-nickname/);
    assert.match(account, /<label>연령대<\/label>/);
    assert.match(account, /data-mypage-age/);
    assert.match(account, /readLocalSignup/);
    assert.match(account, /age_band/);
    assert.match(account, /data-mypage-marketing/);
    assert.match(account, /marketing_opt_in/);
    assert.match(account, /terms_version/);
    assert.match(account, /privacy_version/);
    assert.match(account, /약관 /);
    assert.match(account, /개인정보 /);
    assert.match(account, / 동의/);
    assert.match(account, /<label>이메일<\/label>/);
  });

  it("runs nickname save through nicknameError before writeLocalSignup", () => {
    const startIdx = html.indexOf('key === "save-nickname"');
    assert.ok(startIdx >= 0, "save-nickname handler missing");
    const region = html.slice(startIdx, startIdx + 1800);
    assert.match(region, /nicknameError/);
    assert.match(region, /writeLocalSignup/);
    assert.match(region, /saveSignupProfile/);
    assert.match(region, /\{ id: userId, nickname/);
    assert.match(html, /별명을 바꿨어요/);
    assert.match(html, /저장은 다음 로그인에 다시 시도할게요/);
  });

  it("wires the marketing toggle to the marketing_opt_in key", () => {
    assert.match(html, /data-mypage-marketing/);
    const startIdx = html.search(/data-mypage-marketing[\s\S]{0,400}marketing_opt_in|marketing_opt_in[\s\S]{0,400}data-mypage-marketing/);
    assert.ok(startIdx >= 0, "marketing toggle is not bound to marketing_opt_in");
    assert.match(html, /saveSignupProfile[\s\S]{0,180}marketing_opt_in|marketing_opt_in[\s\S]{0,180}saveSignupProfile/);
  });

  it("replaces the 회원정보 설정 name input with a nickname field", () => {
    const startIdx = html.indexOf('if (key === "edit-profile")');
    assert.ok(startIdx >= 0, "edit-profile handler missing");
    const endIdx = html.indexOf('if (key === "logout")', startIdx);
    const modal = html.slice(startIdx, endIdx > startIdx ? endIdx : startIdx + 2500);
    assert.match(modal, /회원정보 설정/);
    assert.match(modal, /비회원은 저장할 프로필이 없어요/);
    assert.match(modal, /<label>별명<\/label>/);
    assert.equal(modal.includes("<label>이름</label>"), false);
    assert.equal(modal.includes("id.name"), false);
  });
});

describe("IA v0.12 mypage — logout to empty intro", () => {
  it("clears guest/member state and returns to the landing", () => {
    assert.match(logoutFn, /emptyIntroState/);
    assert.match(logoutFn, /showPublic\("landing"\)/);
    assert.match(logoutFn, /guestMode = false/);
    assert.match(guest, /window\.NL\.emptyIntroState = emptyIntroState/);
  });

  it("clears storedSession so landing login cannot re-enter before SIGNED_OUT", () => {
    assert.match(logoutFn, /storedSession\s*=\s*null/);
    const signOutIdx = logoutFn.indexOf("signOut");
    const clearIdx = logoutFn.search(/storedSession\s*=\s*null/);
    assert.ok(clearIdx >= 0, "logout must clear storedSession");
    if (signOutIdx >= 0) assert.ok(clearIdx < signOutIdx, "clear storedSession before signOut");
  });
});
