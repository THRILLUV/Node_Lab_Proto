import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Readable } from "node:stream";
import { parseSplitVision } from "../lib/core/bbox-crop.mjs";
import { splitKeyForGuest, splitPrompt } from "../lib/core/gemini.mjs";
import split from "../api/split.mjs";

function invoke(handler, { method = "POST", body = {}, headers = {} } = {}) {
  const req = Readable.from([JSON.stringify(body)]);
  req.method = method;
  req.body = body;
  req.headers = { "content-type": "application/json", ...headers };
  let status = 0;
  let payload = "";
  const headersOut = {};
  const res = {
    setHeader(k, v) { headersOut[k.toLowerCase()] = v; },
    end(s) { payload = s || ""; },
    set statusCode(v) { status = v; },
    get statusCode() { return status; },
  };
  return handler(req, res).then(() => ({ status, json: payload ? JSON.parse(payload) : {}, headers: headersOut }));
}

it("drops garbage boxes from a model-shaped payload", () => {
  const out = parseSplitVision({ items: [{ n: 3, bbox: { x: 0.05, y: 0.4, w: 0.9, h: 0.2 } }] });
  assert.equal(out.items[0].n, 3);
  assert.ok(out.items[0].bbox);
});

describe("splitPrompt", () => {
  it("asks for page-relative bbox JSON and forbids CAT codes", () => {
    const prompt = splitPrompt();
    assert.match(prompt, /bbox/);
    assert.match(prompt, /"items"/);
    assert.match(prompt, /skip="not_math"/);
    assert.match(prompt, /CAT 코드 금지/);
    assert.match(prompt, /truncated/);
  });
});

describe("splitKeyForGuest", () => {
  it("uses only GOOGLE_FREE_TIER_KEY, never GEMINI_API_KEY", () => {
    assert.equal(
      splitKeyForGuest({ GOOGLE_FREE_TIER_KEY: "free-tier", GEMINI_API_KEY: "paid", GOOGLE_API_KEY: "also-paid" }),
      "free-tier",
    );
    assert.equal(splitKeyForGuest({ GEMINI_API_KEY: "paid", GOOGLE_API_KEY: "also-paid" }), "");
    assert.equal(splitKeyForGuest({}), "");
  });
});

describe("POST /api/split vision pages", () => {
  it("skips vision and returns text-split items when the guest has no free-tier key", async () => {
    const prevFree = process.env.GOOGLE_FREE_TIER_KEY;
    const prevGemini = process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_FREE_TIER_KEY;
    process.env.GEMINI_API_KEY = "must-not-use";
    let fetchCalls = 0;
    const origFetch = globalThis.fetch;
    globalThis.fetch = async () => {
      fetchCalls += 1;
      throw new Error("no live gemini");
    };
    try {
      const r = await invoke(split, {
        body: {
          text: "1. 2x=4 의 값은?\n① 1 ② 2 ③ 3 ④ 4 ⑤ 5\n",
          pages: [{ n: 1, image_b64: "aaaa" }],
        },
      });
      assert.equal(r.status, 200);
      assert.equal(fetchCalls, 0);
      assert.equal(r.json.items[0].source, "pdf");
      assert.match(r.json.items[0].stem, /2x=4/);
    } finally {
      globalThis.fetch = origFetch;
      if (prevFree === undefined) delete process.env.GOOGLE_FREE_TIER_KEY;
      else process.env.GOOGLE_FREE_TIER_KEY = prevFree;
      if (prevGemini === undefined) delete process.env.GEMINI_API_KEY;
      else process.env.GEMINI_API_KEY = prevGemini;
    }
  });

  it("returns parseSplitVision items from mocked free-tier vision, never the paid key", async () => {
    const prevFree = process.env.GOOGLE_FREE_TIER_KEY;
    const prevGemini = process.env.GEMINI_API_KEY;
    process.env.GOOGLE_FREE_TIER_KEY = "free-tier-key";
    process.env.GEMINI_API_KEY = "paid-must-not-appear";
    const urls = [];
    const origFetch = globalThis.fetch;
    globalThis.fetch = async (url) => {
      urls.push(String(url));
      return {
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: '{"items":[{"n":3,"bbox":{"x":0.05,"y":0.4,"w":0.9,"h":0.2}}],"truncated":false}' }],
            },
          }],
        }),
      };
    };
    try {
      const r = await invoke(split, {
        body: { pages: [{ n: 1, image_b64: "aaaa" }] },
      });
      assert.equal(r.status, 200);
      assert.equal(r.json.items[0].n, 3);
      assert.ok(r.json.items[0].bbox);
      assert.equal(r.json.truncated, false);
      assert.equal(urls.length, 1);
      assert.match(urls[0], /free-tier-key/);
      assert.equal(urls[0].includes("paid-must-not-appear"), false);
    } finally {
      globalThis.fetch = origFetch;
      if (prevFree === undefined) delete process.env.GOOGLE_FREE_TIER_KEY;
      else process.env.GOOGLE_FREE_TIER_KEY = prevFree;
      if (prevGemini === undefined) delete process.env.GEMINI_API_KEY;
      else process.env.GEMINI_API_KEY = prevGemini;
    }
  });
});
