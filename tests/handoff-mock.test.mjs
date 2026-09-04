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
    assert.match(html, /국외이전/);
    assert.match(html, /data-signup-consent/);
    assert.match(html, /Google로 계속하기/);
    assert.equal(html.includes("eyJ"), false);
    assert.equal(html.includes("GEMINI_API_KEY"), false);
    assert.equal(html.includes("service_role"), false);
  });
});
