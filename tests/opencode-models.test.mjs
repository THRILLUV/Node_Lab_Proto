import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  extractChatText,
  opencodeModels,
  opencodePath,
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
  });
});
