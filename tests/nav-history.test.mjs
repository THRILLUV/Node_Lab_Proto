import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  encodeNavState,
  decodeNavState,
  shouldPushNav,
  popNavAction,
} from "../lib/core/nav-history.mjs";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");

describe("encodeNavState / decodeNavState", () => {
  it("round-trips landing, login, and guest app", () => {
    assert.deepEqual(decodeNavState(encodeNavState({ shell: "public", view: "landing" })), {
      shell: "public",
      view: "landing",
    });
    assert.deepEqual(decodeNavState(encodeNavState({ shell: "public", view: "login" })), {
      shell: "public",
      view: "login",
    });
    assert.deepEqual(decodeNavState(encodeNavState({ shell: "app", guest: true })), {
      shell: "app",
      guest: true,
    });
  });

  it("treats missing or foreign history as landing, not leave-site", () => {
    assert.deepEqual(decodeNavState(null), { shell: "public", view: "landing" });
    assert.deepEqual(decodeNavState({}), { shell: "public", view: "landing" });
  });
});

describe("shouldPushNav", () => {
  it("pushes landing → guest app and landing → login, not same-screen repeats", () => {
    const landing = { shell: "public", view: "landing" };
    const login = { shell: "public", view: "login" };
    const app = { shell: "app", guest: true };
    assert.equal(shouldPushNav(landing, app), true);
    assert.equal(shouldPushNav(landing, login), true);
    assert.equal(shouldPushNav(app, app), false);
    assert.equal(shouldPushNav(landing, landing), false);
  });
});

describe("popNavAction", () => {
  it("restores landing when the previous entry is the public landing", () => {
    const out = popNavAction(encodeNavState({ shell: "public", view: "landing" }));
    assert.deepEqual(out, { action: "public", view: "landing" });
  });

  it("does not ask the browser to leave the site on a null pop from the app", () => {
    const out = popNavAction(null);
    assert.equal(out.action, "public");
    assert.equal(out.view, "landing");
    assert.equal(out.action === "leave", false);
  });
});

describe("index.html guest back stays on the previous landing", () => {
  it("pushes history when 바로 시작하기 enters as guest", () => {
    assert.match(html, /from "\.\/lib\/core\/nav-history\.mjs"/);
    const enter = html.slice(html.indexOf("window.NL.enterApp"), html.indexOf("window.NL.toast"));
    assert.match(enter, /commitNav\(from, \{ shell: "app", guest: true \}/);
    assert.match(html, /function commitNav/);
    assert.match(html, /history\.pushState/);
    assert.match(html, /shouldPushNav/);
  });

  it("applies popstate to showPublic landing instead of leaving", () => {
    assert.match(html, /addEventListener\("popstate"/);
    assert.match(html, /popNavAction/);
    assert.match(html, /showPublic\(next\.view \|\| "landing"/);
  });
});
