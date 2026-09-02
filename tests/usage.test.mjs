import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  JOIN_COPY,
  chargeUsage,
  consumeVisit,
  resetUsageForTests,
  shouldCharge,
  shouldPromptJoin,
  studentPlanName,
  usageBarView,
  usageSnapshot,
  visitSnapshot,
} from "../lib/core/usage.mjs";

describe("shouldCharge", () => {
  it("does not charge before OCR confirm or on a rejected gate", () => {
    assert.equal(shouldCharge({ gateLabel: "math_problem", ocrConfirmed: false }), false);
    assert.equal(shouldCharge({ gateLabel: "not_math", ocrConfirmed: true }), false);
  });
});

describe("usageSnapshot", () => {
  beforeEach(() => resetUsageForTests());

  it("starts Free users at 0/10 and charges only after confirm", () => {
    assert.deepEqual(usageSnapshot("u1"), { tier: "free", used: 0, limit: 10 });
    chargeUsage("u1", { gateLabel: "not_math", ocrConfirmed: true });
    assert.equal(usageSnapshot("u1").used, 0);
    chargeUsage("u1", { gateLabel: "math_problem", ocrConfirmed: true });
    assert.equal(usageSnapshot("u1").used, 1);
  });

  it("caps guests at 3 items per session", () => {
    assert.deepEqual(usageSnapshot("guest"), { tier: "guest", used: 0, limit: 3 });
    for (let i = 0; i < 3; i++) {
      const snap = chargeUsage("guest", { gateLabel: "math_problem", ocrConfirmed: true, tier: "guest" });
      assert.equal(snap.used, i + 1);
      assert.equal(snap.blocked, undefined);
    }
    const fourth = chargeUsage("guest", { gateLabel: "math_problem", ocrConfirmed: true, tier: "guest" });
    assert.equal(fourth.used, 3);
    assert.equal(fourth.blocked, true);
    assert.equal(fourth.join, true);
    assert.equal(fourth.copy, JOIN_COPY);
    assert.equal(usageSnapshot("guest").used, 3);
  });
});

describe("shouldPromptJoin", () => {
  it("opens the join modal on the 4th guest item or 2nd variant", () => {
    assert.equal(shouldPromptJoin({ tier: "guest", used: 2, itemIndex: 3 }), false);
    assert.equal(shouldPromptJoin({ tier: "guest", used: 3 }), true);
    assert.equal(shouldPromptJoin({ tier: "guest", itemIndex: 4 }), true);
    assert.equal(shouldPromptJoin({ tier: "guest", variantCount: 1 }), false);
    assert.equal(shouldPromptJoin({ tier: "guest", variantCount: 2 }), true);
    assert.equal(shouldPromptJoin({ tier: "free", used: 3, itemIndex: 4, variantCount: 2 }), false);
  });

  it("uses the ADR-009 join copy", () => {
    assert.equal(JOIN_COPY, "여기서부터는 무료 가입하고 이어 풀 수 있어요.");
  });

  it("opens the join modal on the 4th guest upload this visit", () => {
    assert.equal(shouldPromptJoin({ tier: "guest", uploadCount: 2, action: "upload" }), false);
    assert.equal(shouldPromptJoin({ tier: "guest", uploadCount: 3, action: "upload" }), true);
    assert.equal(shouldPromptJoin({ tier: "free", uploadCount: 3, action: "upload" }), false);
  });

  it("opens the join modal on the 2nd guest handwriting this visit", () => {
    assert.equal(shouldPromptJoin({ tier: "guest", handwritingCount: 0, action: "handwriting" }), false);
    assert.equal(shouldPromptJoin({ tier: "guest", handwritingCount: 1, action: "handwriting" }), true);
    assert.equal(shouldPromptJoin({ tier: "free", handwritingCount: 1, action: "handwriting" }), false);
  });
});

describe("guest visit caps (ADR-025)", () => {
  beforeEach(() => resetUsageForTests());

  it("allows 3 math uploads then blocks the 4th with join copy", () => {
    for (let i = 0; i < 3; i++) {
      const snap = consumeVisit("guest", { kind: "upload", gateLabel: "math_problem", tier: "guest" });
      assert.equal(snap.uploads, i + 1);
      assert.equal(snap.blocked, undefined);
    }
    const fourth = consumeVisit("guest", { kind: "upload", gateLabel: "math_problem", tier: "guest" });
    assert.equal(fourth.uploads, 3);
    assert.equal(fourth.blocked, true);
    assert.equal(fourth.join, true);
    assert.equal(fourth.copy, JOIN_COPY);
    assert.equal(visitSnapshot("guest").uploads, 3);
  });

  it("does not count a not_math gate as an upload", () => {
    const rejected = consumeVisit("guest", { kind: "upload", gateLabel: "not_math", tier: "guest" });
    assert.equal(rejected.uploads, 0);
    assert.equal(rejected.charged, false);
    assert.equal(visitSnapshot("guest").uploads, 0);
  });

  it("allows 1 handwriting then blocks the 2nd with join copy", () => {
    const first = consumeVisit("guest", { kind: "handwriting", tier: "guest" });
    assert.equal(first.handwriting, 1);
    assert.equal(first.blocked, undefined);
    const second = consumeVisit("guest", { kind: "handwriting", tier: "guest" });
    assert.equal(second.handwriting, 1);
    assert.equal(second.blocked, true);
    assert.equal(second.join, true);
    assert.equal(second.copy, JOIN_COPY);
    assert.equal(visitSnapshot("guest").handwriting, 1);
  });
});

describe("guest visit cap wiring", () => {
  it("home start and handwriting capture consult the visit caps", async () => {
    const { readFile } = await import("node:fs/promises");
    const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
    assert.match(html, /consumeVisit\("guest", \{\s*kind: "upload"/);
    assert.match(html, /action: "handwriting"/);
    assert.match(html, /kind: "handwriting"/);
    const guest = await readFile(new URL("../js/guest.js", import.meta.url), "utf8");
    assert.match(guest, /window\.NL\.consumeVisit = consumeVisit/);
  });
});

describe("usageBarView", () => {
  it("starts at 100% with 손풀이 n/한도 and never says 크레딧", () => {
    const bar = usageBarView({ used: 0, limit: 1 });
    assert.equal(bar.percent, 100);
    assert.equal(bar.copy, "손풀이 0/1");
    assert.equal(JSON.stringify(bar).includes("크레딧"), false);
    const after = usageBarView({ used: 1, limit: 1 });
    assert.equal(after.percent, 0);
    assert.equal(after.copy, "손풀이 1/1");
    const light = usageBarView({ used: 12, limit: 20 });
    assert.equal(light.copy, "손풀이 12/20");
    assert.equal(light.percent, 40);
  });

  it("hub usage surfaces use the 100% bar and 손풀이 copy", async () => {
    const { readFile } = await import("node:fs/promises");
    const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
    assert.match(html, /function usageBarState/);
    assert.match(html, /id="usageBar"/);
    assert.match(html, /bar\.copy/);
    assert.equal(html.includes("크레딧"), false);
    const guest = await readFile(new URL("../js/guest.js", import.meta.url), "utf8");
    assert.match(guest, /window\.NL\.usageBarView = usageBarView/);
  });
});

describe("studentPlanName (ADR-025)", () => {
  it("maps Free/Pro/Guest to 라이트/베이직/비회원 and never says 크레딧", () => {
    assert.equal(studentPlanName("Free"), "라이트");
    assert.equal(studentPlanName("Pro"), "베이직");
    assert.equal(studentPlanName("Guest"), "비회원");
    assert.equal(studentPlanName("free"), "라이트");
    assert.equal(studentPlanName("guest"), "비회원");
    assert.equal(studentPlanName("헤비"), "헤비");
    assert.equal(JSON.stringify(["라이트", "베이직", "헤비", "비회원"]).includes("크레딧"), false);
  });

  it("hub account/plans copy uses ADR-025 names instead of Free/Pro/VIP", async () => {
    const { readFile } = await import("node:fs/promises");
    const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
    const start = html.indexOf("function renderHub");
    const next = html.indexOf("\n  function ", start + 10);
    const hub = html.slice(start, next > 0 ? next : undefined);
    const leftovers = [
      "Free와 Pro",
      "Pro로 전환",
      "Pro 시작하기",
      "Pro 혜택",
      "NodeLab Pro",
      "Free 플랜",
      "Pro가 활성화",
      "Pro에서 상세",
      "Pro 권한",
      "<h3>Free</h3>",
      "<h3>Pro</h3>",
    ];
    for (const leftover of leftovers) {
      assert.equal(hub.includes(leftover), false, leftover);
    }
    assert.equal(hub.includes("크레딧"), false);
    assert.equal(hub.includes("VIP"), false);
    assert.match(hub, /라이트/);
    assert.match(hub, /베이직/);
    assert.match(html, /studentPlanName\(state\.plan\)/);
    assert.equal(html.includes("Pro에서 열기"), false);
    assert.equal(html.includes("Pro 기능을 계속"), false);
    const guest = await readFile(new URL("../js/guest.js", import.meta.url), "utf8");
    assert.match(guest, /window\.NL\.studentPlanName = studentPlanName/);
  });
});
