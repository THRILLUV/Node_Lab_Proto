import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  extractChatText,
  hasTextKey,
  opencodeModels,
  opencodePath,
  zenFreeEnabled,
  zenRequestHeaders,
} from "../lib/core/llm.mjs";

describe("opencodeModels", () => {
  it("defaults to the live free DeepSeek then Muse Spark", () => {
    assert.deepEqual(opencodeModels({}), [
      "deepseek-v4-flash-free",
      "muse-spark-1.2-contributor-free",
    ]);
  });

  it("puts LLM_MODEL_GEN first without duplicates", () => {
    const models = opencodeModels({ LLM_MODEL_GEN: "muse-spark-1.2-contributor-free" });
    assert.equal(models[0], "muse-spark-1.2-contributor-free");
    assert.equal(new Set(models).size, models.length);
    assert.ok(models.includes("deepseek-v4-flash-free"));
  });
});

describe("opencodePath", () => {
  it("sends DeepSeek to chat completions and Muse Spark to responses", () => {
    assert.equal(opencodePath("deepseek-v4-flash-free"), "/chat/completions");
    assert.equal(opencodePath("muse-spark-1.2-contributor-free"), "/responses");
    assert.equal(opencodePath("muse-spark-1.2"), "/responses");
  });
});

describe("extractChatText", () => {
  it("reads chat completions and responses payloads", () => {
    assert.equal(extractChatText({ choices: [{ message: { content: "from-chat" } }] }), "from-chat");
    assert.equal(extractChatText({ output_text: "from-output-text" }), "from-output-text");
    assert.equal(
      extractChatText({ output: [{ content: [{ type: "output_text", text: "from-output" }] }] }),
      "from-output",
    );
    assert.equal(
      extractChatText({
        output: [
          { type: "reasoning", encrypted_content: "x" },
          { type: "message", content: [{ type: "output_text", text: "pong" }] },
        ],
      }),
      "pong",
    );
  });
});

describe("OpenCode free needs no API key", () => {
  it("enables Zen free without OPENCODE_API_KEY", () => {
    assert.equal(zenFreeEnabled({ NODE_TEST_CONTEXT: "", LLM_BASE_URL: "https://opencode.ai/zen/v1" }), true);
    assert.equal(hasTextKey({ NODE_TEST_CONTEXT: "", LLM_BASE_URL: "https://opencode.ai/zen/v1" }), true);
    assert.equal(zenFreeEnabled({ OPENCODE_FREE: "0" }), false);
  });

  it("does not send a Bearer header when no key is set", () => {
    const headers = zenRequestHeaders({});
    assert.equal(headers.authorization, undefined);
    assert.match(headers["user-agent"] || "", /Mozilla|NodeLab/);
    assert.equal(zenRequestHeaders({ OPENCODE_API_KEY: "sk-test" }).authorization, "Bearer sk-test");
  });
});

