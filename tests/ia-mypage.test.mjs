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
