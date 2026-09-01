import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { companionUrl } from "../lib/core/companion.mjs";

describe("companionUrl", () => {
  it("builds /m?s= with the session id", () => {
    assert.equal(
      companionUrl({ origin: "https://app.example", sessionId: "abc-1" }),
      "https://app.example/m?s=abc-1"
    );
  });
});
