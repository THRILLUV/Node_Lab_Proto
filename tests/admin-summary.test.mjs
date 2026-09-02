import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Readable } from "node:stream";
import {
  ADMIN_MOCK_SUMMARY,
  loadAdminSummary,
  adminSummaryPayload,
  readNlCounts,
  NL_ADMIN_TABLES,
} from "../lib/core/admin-summary.mjs";
import handler from "../api/config.mjs";

const LIVE_SHAPE = {
  source: "live",
  members: { total: 3, sessions: 11 },
  billing: { total: 1 },
  usage: { events: 40 },
  voc: { total: 0 },
};

const EMPTY_LIVE = {
  source: "live",
  members: { total: 0, sessions: 0 },
  billing: { total: 0 },
  usage: { events: 0 },
  voc: { total: 0 },
};

function jsonRes(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    headers: { get() { return null; } },
  };
}

function invoke(h, { method = "GET", headers = {}, url = "/api/config?admin=summary" } = {}) {
  const req = Readable.from([]);
  req.method = method;
  req.headers = headers;
  req.url = url;
  let status = 0;
  let payload = "";
  const headersOut = {};
  const res = {
    setHeader(k, v) { headersOut[String(k).toLowerCase()] = v; },
    end(s) { payload = s || ""; },
    set statusCode(v) { status = v; },
    get statusCode() { return status; },
  };
  return h(req, res).then(() => ({ status, json: payload ? JSON.parse(payload) : {}, headers: headersOut }));
}

const ENV_KEYS = ["NL_ADMIN_KEY", "SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE"];
const savedEnv = {};

function stashEnv() {
  for (const k of ENV_KEYS) savedEnv[k] = process.env[k];
}

function restoreEnv() {
  for (const k of ENV_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
}

describe("ADMIN_MOCK_SUMMARY numbers come from the HTML mock", () => {
  it("keeps the eight sample members and dashboard totals", () => {
    assert.equal(ADMIN_MOCK_SUMMARY.source, "mock");
    assert.equal(ADMIN_MOCK_SUMMARY.members.list.length, 8);
    assert.equal(ADMIN_MOCK_SUMMARY.members.list[0].email, "th930531@gmail.com");
    assert.equal(ADMIN_MOCK_SUMMARY.members.weekJoin, 2);
    assert.equal(ADMIN_MOCK_SUMMARY.members.active, 6);
    assert.equal(ADMIN_MOCK_SUMMARY.members.stopped, 1);
    assert.equal(ADMIN_MOCK_SUMMARY.members.withdrawn, 1);
    assert.equal(ADMIN_MOCK_SUMMARY.members.total, 8);
    assert.equal(ADMIN_MOCK_SUMMARY.billing.payWait, 2);
    assert.equal(ADMIN_MOCK_SUMMARY.usage.tokens, 91270);
    assert.equal(ADMIN_MOCK_SUMMARY.voc.exceptions.length, 5);
    assert.equal(ADMIN_MOCK_SUMMARY.voc.logs.length, 3);
  });
});

describe("loadAdminSummary", () => {
  it("returns HTML mock numbers on 401", async () => {
    const out = await loadAdminSummary({
      key: "wrong",
      fetchFn: async () => jsonRes(401, { error: "unauthorized" }),
    });
    assert.equal(out.source, "mock");
    assert.equal(out.members.total, 8);
    assert.equal(out.members.weekJoin, 2);
    assert.equal(out.billing.payWait, 2);
    assert.equal(out.usage.tokens, 91270);
    assert.equal(out.voc.exceptions.length, 5);
  });

  it("returns HTML mock numbers when live tables are empty", async () => {
    const out = await loadAdminSummary({
      key: "ok",
      fetchFn: async () => jsonRes(200, EMPTY_LIVE),
    });
    assert.equal(out.source, "mock");
    assert.equal(out.members.list.length, 8);
    assert.equal(out.usage.tokens, 91270);
  });

  it("passes through a live-shaped payload", async () => {
    let sent;
    const out = await loadAdminSummary({
      key: "ok",
      fetchFn: async (url, opts) => {
        sent = { url, opts };
        return jsonRes(200, LIVE_SHAPE);
      },
    });
    assert.equal(sent.url, "/api/admin/summary");
    assert.equal(sent.opts.headers["x-nl-admin-key"], "ok");
    assert.equal(out.source, "live");
    assert.deepEqual(out.members, LIVE_SHAPE.members);
    assert.deepEqual(out.billing, LIVE_SHAPE.billing);
    assert.deepEqual(out.usage, LIVE_SHAPE.usage);
    assert.deepEqual(out.voc, LIVE_SHAPE.voc);
  });
});

describe("adminSummaryPayload 401 vs mock vs live", () => {
  beforeEach(stashEnv);
  afterEach(restoreEnv);

  it("is 401 when NL_ADMIN_KEY is missing", async () => {
    delete process.env.NL_ADMIN_KEY;
    const out = await adminSummaryPayload({ headerKey: "any", env: process.env });
    assert.equal(out.status, 401);
    assert.equal(out.body.error, "unauthorized");
  });

  it("is 401 on key mismatch", async () => {
    process.env.NL_ADMIN_KEY = "expected-key";
    const out = await adminSummaryPayload({ headerKey: "other-key", env: process.env });
    assert.equal(out.status, 401);
  });

  it("returns mock numbers when supabase counts fail", async () => {
    process.env.NL_ADMIN_KEY = "expected-key";
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_ANON_KEY = "anon-not-a-secret";
    const out = await adminSummaryPayload({
      headerKey: "expected-key",
      env: process.env,
      fetchFn: async () => { throw new Error("network"); },
    });
    assert.equal(out.status, 200);
    assert.equal(out.body.source, "mock");
    assert.equal(out.body.members.total, 8);
    assert.equal(out.body.usage.tokens, 91270);
  });

  it("returns live-shaped counts when nl_* tables respond", async () => {
    process.env.NL_ADMIN_KEY = "expected-key";
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_ANON_KEY = "anon-not-a-secret";
    const urls = [];
    const out = await adminSummaryPayload({
      headerKey: "expected-key",
      env: process.env,
      fetchFn: async (url) => {
        urls.push(String(url));
        const n =
          String(url).includes("nl_profiles") ? 3 :
          String(url).includes("nl_sessions") ? 11 :
          String(url).includes("nl_events") ? 40 :
          String(url).includes("nl_subscriptions") ? 1 : -1;
        return {
          ok: true,
          status: 200,
          headers: { get(name) { return String(name).toLowerCase() === "content-range" ? `0-0/${n}` : null; } },
        };
      },
    });
    assert.equal(out.status, 200);
    assert.equal(out.body.source, "live");
    assert.deepEqual(out.body.members, { total: 3, sessions: 11 });
    assert.deepEqual(out.body.billing, { total: 1 });
    assert.deepEqual(out.body.usage, { events: 40 });
    assert.equal(out.body.voc.total, 0);
    assert.equal(urls.some((u) => /\/rest\/v1\/profiles(\?|$)/.test(u)), false);
    assert.equal(urls.some((u) => u.includes("nl_profiles")), true);
    assert.equal(urls.some((u) => u.includes("nl_sessions")), true);
    assert.equal(urls.some((u) => u.includes("nl_events")), true);
    assert.equal(urls.some((u) => u.includes("nl_subscriptions")), true);
  });
});

describe("readNlCounts", () => {
  it("only reads nl_* tables, never public.profiles", async () => {
    const urls = [];
    await readNlCounts({
      supabaseUrl: "https://example.supabase.co",
      supabaseKey: "anon-not-a-secret",
      fetchFn: async (url) => {
        urls.push(String(url));
        return {
          ok: true,
          status: 200,
          headers: { get() { return "*/0"; } },
        };
      },
    });
    assert.deepEqual(Object.values(NL_ADMIN_TABLES).sort(), [
      "nl_events",
      "nl_profiles",
      "nl_sessions",
      "nl_subscriptions",
    ]);
    for (const url of urls) {
      assert.match(url, /\/rest\/v1\/nl_/);
      assert.doesNotMatch(url, /\/rest\/v1\/profiles(\?|$)/);
    }
  });
});

describe("GET /api/config?admin=summary (folded from /api/admin/summary)", () => {
  beforeEach(stashEnv);
  afterEach(restoreEnv);

  it("returns 401 without the admin key", async () => {
    process.env.NL_ADMIN_KEY = "expected-key";
    const r = await invoke(handler, { headers: {} });
    assert.equal(r.status, 401);
    assert.equal(r.json.error, "unauthorized");
  });

  it("returns 200 mock-shaped JSON when the key matches and counts fail", async () => {
    process.env.NL_ADMIN_KEY = "expected-key";
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_ANON_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE;
    const r = await invoke(handler, { headers: { "x-nl-admin-key": "expected-key" } });
    assert.equal(r.status, 200);
    assert.equal(r.json.source, "mock");
    assert.equal(r.json.members.total, 8);
    assert.equal(r.json.billing.payWait, 2);
    assert.equal(r.json.usage.tokens, 91270);
    assert.ok(r.json.members && r.json.billing && r.json.usage && r.json.voc);
    assert.equal(r.headers["x-nl-mock"], "1");
  });

  it("accepts ?k= as the admin key", async () => {
    process.env.NL_ADMIN_KEY = "expected-key";
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_ANON_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE;
    const r = await invoke(handler, { url: "/api/config?admin=summary&k=expected-key" });
    assert.equal(r.status, 200);
    assert.equal(r.json.source, "mock");
    assert.equal(r.json.members.total, 8);
  });

  it("OPTIONS preserves admin CORS headers", async () => {
    const r = await invoke(handler, {
      method: "OPTIONS",
      headers: { origin: "https://example.test" },
    });
    assert.equal(r.status, 204);
    assert.equal(r.headers["access-control-allow-origin"], "https://example.test");
    assert.match(String(r.headers["access-control-allow-headers"] || ""), /x-nl-admin-key/i);
    assert.match(String(r.headers["access-control-allow-methods"] || ""), /GET/);
    assert.match(String(r.headers["access-control-allow-methods"] || ""), /OPTIONS/);
  });

  it("keeps GET /api/config identical when admin= is absent", async () => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_ANON_KEY;
    const r = await invoke(handler, { url: "/api/config" });
    assert.equal(r.status, 200);
    assert.equal(r.json.supabaseUrl, "https://yrgajwztpuscjbmrbkqg.supabase.co");
    assert.equal(r.json.error, undefined);
    assert.equal(r.json.source, undefined);
    assert.equal(typeof r.json.supabaseAnon, "string");
  });

  it("returns 200 mock when yrgaj URL is set but counts cannot run without a key", async () => {
    process.env.NL_ADMIN_KEY = "expected-key";
    process.env.SUPABASE_URL = "https://yrgajwztpuscjbmrbkqg.supabase.co";
    delete process.env.SUPABASE_ANON_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE;
    const r = await invoke(handler, { headers: { "x-nl-admin-key": "expected-key" } });
    assert.equal(r.status, 200);
    assert.equal(r.json.source, "mock");
    assert.equal(r.json.members.total, 8);
  });
});

describe("Hobby fold: no 13th function, rewrite keeps /api/admin/summary", () => {
  it("deletes api/admin/summary.mjs", () => {
    const path = fileURLToPath(new URL("../api/admin/summary.mjs", import.meta.url));
    assert.equal(existsSync(path), false);
  });

  it("rewrites /api/admin/summary to /api/config?admin=summary", () => {
    const vercel = JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf8"));
    const hit = (vercel.rewrites || []).find((r) => r.source === "/api/admin/summary");
    assert.ok(hit);
    assert.equal(hit.destination, "/api/config?admin=summary");
  });
});

describe("readNlCounts fallback when supabase env is incomplete", () => {
  it("throws supabase_env without a key so adminSummaryPayload can mock", async () => {
    await assert.rejects(
      () => readNlCounts({
        supabaseUrl: "https://yrgajwztpuscjbmrbkqg.supabase.co",
        supabaseKey: "",
        fetchFn: async () => {
          throw new Error("must_not_fetch");
        },
      }),
      /supabase_env/,
    );
  });
});
