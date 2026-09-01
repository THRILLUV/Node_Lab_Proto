import { cors, readJson, send } from "../lib/core/http.mjs";
import { issueSession } from "../lib/core/session.mjs";

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== "POST" && req.method !== "GET") {
    return send(res, 405, { error: "method_not_allowed" });
  }
  let body = {};
  if (req.method === "POST") {
    try {
      body = await readJson(req);
    } catch {
      body = {};
    }
  }
  const issued = issueSession(req.headers.cookie || "", { renew: Boolean(body.renew) });
  return send(res, 200, { session_id: issued.session_id }, { setCookie: issued.setCookie });
}
