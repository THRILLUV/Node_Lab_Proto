import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadEnvFile } from "../lib/core/env.mjs";

describe("loadEnvFile", () => {
  it("loads KEY=value and does not overwrite existing env", async () => {
    const dir = await mkdtemp(join(tmpdir(), "nl-env-"));
    const file = join(dir, ".env.local");
    await writeFile(
      file,
      [
        "# comment",
        "",
        "GEMINI_API_KEY=test-key-from-file",
        "GEMINI_ACCOUNT=\"giftedonyou@gmail.com\"",
        "ALREADY_SET=from-file",
      ].join("\n"),
      "utf8",
    );
    const env = { ALREADY_SET: "keep-me" };
    const loaded = loadEnvFile(file, env);
    assert.equal(env.GEMINI_API_KEY, "test-key-from-file");
    assert.equal(env.GEMINI_ACCOUNT, "giftedonyou@gmail.com");
    assert.equal(env.ALREADY_SET, "keep-me");
    assert.deepEqual(loaded.sort(), ["GEMINI_ACCOUNT", "GEMINI_API_KEY"]);
  });

  it("returns empty when the file is missing", () => {
    const env = {};
    assert.deepEqual(loadEnvFile("/tmp/nl-env-missing-nope.env", env), []);
    assert.equal(Object.keys(env).length, 0);
  });
});
