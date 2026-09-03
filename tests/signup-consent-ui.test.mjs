import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { shouldCloseOcrCropModal } from "../lib/core/solve.mjs";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const authJs = await readFile(new URL("../js/auth.js", import.meta.url), "utf8");
const solveJs = await readFile(new URL("../js/solve.js", import.meta.url), "utf8");

const CHECK_LINES = [
  "모두 동의합니다.",
  "(필수) 서비스 이용약관 동의",
  "(필수) 개인정보 수집 및 이용 동의",
  "(선택) 이벤트, 혜택 및 마케팅 알림 받기",
  "만 14세 이상입니다.",
];

function assertIncludes(haystack, needle, label) {
  assert.ok(haystack.includes(needle), label || `missing: ${needle}`);
}

function signupHtmlRegion() {
  const start = html.indexOf("openSignupConsent");
  assert.ok(start >= 0, "openSignupConsent missing from index.html");
  const end = html.indexOf("function resetItem", start);
  return end > start ? html.slice(start, end) : html.slice(start, start + 12000);
}

describe("signup consent modal — copy", () => {
  it("uses the exact title", () => {
    assertIncludes(html, "NodeLab 이용 약관 동의 수집 안내");
  });

  it("includes the collection notice intro", () => {
    assertIncludes(html, "노드랩(이하 ‘회사’)은 서비스 제공을 위해");
  });

  it("lists five check lines in order", () => {
    let pos = 0;
    for (const line of CHECK_LINES) {
      const i = html.indexOf(line, pos);
      assert.ok(i >= 0, `missing check line: ${line}`);
      pos = i + line.length;
    }
  });

  it("puts 전체보기 on the two required rows and the optional row, not on 만 14세", () => {
    const region = signupHtmlRegion();
    const fullCount = (region.match(/전체보기/g) || []).length;
    assert.equal(fullCount, 3);
    const over14At = region.indexOf("만 14세 이상입니다.");
    assert.ok(over14At >= 0);
    const over14Line = region.slice(over14At - 80, over14At + "만 14세 이상입니다.".length + 40);
    assert.equal(over14Line.includes("전체보기"), false);
    assert.match(region, /\(필수\) 서비스 이용약관 동의[\s\S]{0,180}?전체보기/);
    assert.match(region, /\(필수\) 개인정보 수집 및 이용 동의[\s\S]{0,180}?전체보기/);
    assert.match(region, /\(선택\) 이벤트, 혜택 및 마케팅 알림 받기[\s\S]{0,180}?전체보기/);
  });

  it("shows the required-terms footer notice", () => {
    assertIncludes(html, "필수 약관에 동의하지 않으면 서비스 이용이 제한됩니다.");
  });

  it("does not put 국외이전 on the check lines", () => {
    const region = signupHtmlRegion();
    const checksStart = region.indexOf("모두 동의합니다.");
    const checksEnd = region.indexOf("만 14세 이상입니다.");
    assert.ok(checksStart >= 0 && checksEnd > checksStart);
    const checks = region.slice(checksStart, checksEnd + "만 14세 이상입니다.".length);
    assert.equal(checks.includes("국외이전"), false);
  });
});

describe("signup consent modal — wiring", () => {
  it("exposes window.NL.openSignupConsent(onDone, onRefuse) in index.html", () => {
    assert.match(html, /function openSignupConsent\s*\(\s*onDone\s*,\s*onRefuse\s*\)/);
    assert.match(html, /window\.NL\.openSignupConsent\s*=\s*openSignupConsent/);
  });

  it("is not auto-opened from enterApp or auth.js", () => {
    const enter = html.slice(html.indexOf("window.NL.enterApp"), html.indexOf("window.NL.toast"));
    assert.equal(enter.includes("openSignupConsent"), false);
    assert.equal(authJs.includes("openSignupConsent"), false);
    assert.equal(authJs.includes("signup-consent"), false);
  });

  it("wires [다음] disabled from canSubmitConsent", () => {
    const region = signupHtmlRegion();
    assertIncludes(region, "canSubmitConsent");
    assertIncludes(region, "data-signup-next");
    assertIncludes(region, "disabled");
  });

  it("syncs 모두 동의 with consentToggle and allChecked", () => {
    const region = signupHtmlRegion();
    assertIncludes(region, "consentToggle");
    assertIncludes(region, "allChecked");
    assertIncludes(region, "data-consent-key");
  });

  it("marks modal content with data-signup-consent", () => {
    assertIncludes(html, "data-signup-consent");
  });

  it("offers 동의하지 않아요 that calls onRefuse", () => {
    const region = signupHtmlRegion();
    assertIncludes(region, "동의하지 않아요");
    assertIncludes(region, "onRefuse");
    assertIncludes(region, "data-signup-refuse");
  });
});

describe("signup consent modal — legal full texts", () => {
  it("inlines the three legal docs as JS constants with no fetch", async () => {
    const legalUrl = new URL("../lib/core/legal-texts.mjs", import.meta.url);
    const legalSrc = await readFile(legalUrl, "utf8");
    assert.equal(/fetch\s*\(/.test(legalSrc), false);
    const legal = await import(legalUrl.href);
    const termsDoc = await readFile(new URL("../docs/legal/signup/2. 필수_이용약관.md", import.meta.url), "utf8");
    const privacyDoc = await readFile(new URL("../docs/legal/signup/3. 필수_개인정보_수집이용_동의.md", import.meta.url), "utf8");
    const marketingDoc = await readFile(new URL("../docs/legal/signup/4. 선택_마케팅_수신_동의.md", import.meta.url), "utf8");
    assert.equal(legal.LEGAL_TERMS, termsDoc);
    assert.equal(legal.LEGAL_PRIVACY, privacyDoc);
    assert.equal(legal.LEGAL_MARKETING, marketingDoc);
    assert.match(legal.LEGAL_PRIVACY, /국외이전/);
  });

  it("opens 전체보기 from LEGAL_* constants and returns with 뒤로", () => {
    const region = signupHtmlRegion();
    assertIncludes(region, "data-signup-full");
    assertIncludes(region, "data-signup-back");
    assertIncludes(region, "LEGAL_TERMS");
    assertIncludes(region, "LEGAL_PRIVACY");
    assertIncludes(region, "LEGAL_MARKETING");
    assertIncludes(html, "js/consent.js");
  });
});

describe("signup consent modal — backdrop gate", () => {
  it("blocks backdrop close when data-signup-consent is present", () => {
    assertIncludes(html, 'querySelector("[data-signup-consent]")');
    assertIncludes(html, 'querySelector("[data-ocr-crop]")');
    assert.match(html, /shouldCloseOcrCropModal\(\{\s*source: "backdrop",\s*ocrCrop/);
    assert.equal(/if \(e\.target === els\.modal\) closeModal\(\);/.test(html), false);
    assert.equal(shouldCloseOcrCropModal({ source: "backdrop", ocrCrop: true }), false);
    assert.equal(shouldCloseOcrCropModal({ source: "backdrop", signupConsent: true }), false);
    assert.equal(shouldCloseOcrCropModal({ source: "backdrop", ocrCrop: false, signupConsent: false }), true);
    assert.equal(shouldCloseOcrCropModal({ source: "backdrop", ocrCrop: true, result: "ok" }), true);
    assertIncludes(solveJs, "window.NL.shouldCloseOcrCropModal = shouldCloseOcrCropModal");
  });
});
