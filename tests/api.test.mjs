import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Readable } from "node:stream";
import gate from "../api/gate.mjs";
import hint from "../api/hint.mjs";
import session from "../api/session.mjs";
import ocrConfirm from "../api/ocr-confirm.mjs";
import variant from "../api/variant.mjs";

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

describe("api handlers", () => {
  it("POST /api/session mints a uuid", async () => {
    const r = await invoke(session, { method: "POST", body: {} });
    assert.equal(r.status, 200);
    assert.match(r.json.session_id, /^[0-9a-f-]{36}$/);
    assert.match(String(r.headers["set-cookie"] || ""), /nl_session=/);
  });

  it("POST /api/session without renew reuses the cookie", async () => {
    const r = await invoke(session, {
      method: "POST",
      body: {},
      headers: { cookie: "nl_session=keep-me" },
    });
    assert.equal(r.status, 200);
    assert.equal(r.json.session_id, "keep-me");
  });

  it("POST /api/session renew ignores the existing cookie", async () => {
    const r = await invoke(session, {
      method: "POST",
      body: { renew: true },
      headers: { cookie: "nl_session=keep-me" },
    });
    assert.equal(r.status, 200);
    assert.notEqual(r.json.session_id, "keep-me");
    assert.match(r.json.session_id, /^[0-9a-f-]{36}$/);
    assert.match(String(r.headers["set-cookie"] || ""), /nl_session=/);
  });

  it("POST /api/gate blocks weather chat", async () => {
    const r = await invoke(gate, { body: { text: "오늘 날씨 알려줘" } });
    assert.equal(r.status, 200);
    assert.equal(r.json.label, "not_math");
    assert.equal(r.json.charge, false);
  });

  it("POST /api/hint never returns CAT codes", async () => {
    const r = await invoke(hint, { body: { choice: "hand", item_index: 1, lines: [{ step: 2, latex: "3" }] } });
    assert.equal(r.status, 200);
    assert.equal(JSON.stringify(r.json).includes("CAT_"), false);
    assert.match(r.json.message, /줄/);
  });

  it("POST /api/ocr-confirm without preview is 409", async () => {
    const r = await invoke(ocrConfirm, { body: { session_id: "missing", item_index: 9, result: "ok" } });
    assert.equal(r.status, 409);
  });

  it("POST /api/variant returns a masked static variant without CAT_", async () => {
    const r = await invoke(variant, { body: { item_index: 1 } });
    assert.equal(r.status, 200);
    assert.ok(r.json.stem);
    assert.equal(r.json.answer_masked, true);
    assert.equal(r.json.answer, undefined);
    assert.equal(JSON.stringify(r.json).includes("CAT_"), false);
  });
});
