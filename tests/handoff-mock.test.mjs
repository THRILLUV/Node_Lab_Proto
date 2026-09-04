import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const html = readFileSync(join(ROOT, "handoff/nodelab-deploy-mock.html"), "utf8");

describe("deploy HTML mock", () => {
  it("is a single file with the live signup copy and no secrets", () => {
    assert.match(html, /새벽에 문제집 풀다 막힐 때/);
    assert.match(html, /Google 계정 하나면 돼요/);
    assert.match(html, /NodeLab 이용 약관 동의 수집 안내/);
    assert.match(html, /별명을 정해 주세요/);
    assert.match(html, /딱 30초면 맞춤 설정이 끝나요/);
    assert.equal(
      html.includes("국외이전") || html.includes("\\uAD6D\\uC678\\uC774\\uC804"),
      true,
    );
    assert.match(html, /data-signup-consent/);
    assert.match(html, /auth:.*google:!0|google:\s*true/);
    assert.equal(/eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\./.test(html), false);
    assert.equal(html.includes("GEMINI_API_KEY"), false);
    assert.equal(html.includes("service_role"), false);
  });

  it("contains the full deployed shell, dummy APIs, data, and embedded question images", () => {
    assert.match(html, /data-hub-view="library"/);
    assert.match(html, /data-hub-view="wrong"/);
    assert.match(html, /상세 Audit 리포트/);
    assert.match(html, /요금제 선택/);
    assert.match(html, /\/api\/ocr/);
    assert.match(html, /mock-session-001/);
    assert.match(html, /demo@nodelab\.mock/);
    assert.match(html, /data:image\/png;base64,/);
    assert.match(html, /data-mock-action="member"/);
    assert.equal(html.includes('<script type="module" src="/js/'), false);
  });
});
