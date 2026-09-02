import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Readable } from "node:stream";
import config from "../api/config.mjs";

function invoke(handler, { method = "GET", headers = {} } = {}) {
  const req = Readable.from([]);
  req.method = method;
  req.headers = headers;
  let status = 0;
  let payload = "";
  const res = {
    setHeader() {},
    end(s) { payload = s || ""; },
    set statusCode(v) { status = v; },
    get statusCode() { return status; },
  };
  return handler(req, res).then(() => ({ status, json: payload ? JSON.parse(payload) : {} }));
}

describe("GET /api/config supabase project", () => {
  it("defaults to the Node_Lab project, not PM Grid", async () => {
    const prevUrl = process.env.SUPABASE_URL;
    const prevAnon = process.env.SUPABASE_ANON_KEY;
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_ANON_KEY;
    try {
      const r = await invoke(config);
      assert.equal(r.status, 200);
      assert.equal(r.json.supabaseUrl, "https://yrgajwztpuscjbmrbkqg.supabase.co");
      const payload = JSON.parse(Buffer.from(String(r.json.supabaseAnon).split(".")[1], "base64url").toString("utf8"));
      assert.equal(payload.ref, "yrgajwztpuscjbmrbkqg");
      assert.equal(payload.role, "anon");
      assert.equal(String(r.json.supabaseUrl).includes("rccewveplhbgkhrxloui"), false);
      assert.equal(String(r.json.supabaseUrl).includes("gnuswrvxilwcitleizdx"), false);
    } finally {
      if (prevUrl !== undefined) process.env.SUPABASE_URL = prevUrl;
      else delete process.env.SUPABASE_URL;
      if (prevAnon !== undefined) process.env.SUPABASE_ANON_KEY = prevAnon;
      else delete process.env.SUPABASE_ANON_KEY;
    }
  });
});
