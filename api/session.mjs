import { cors, send } from "../lib/core/http.mjs";
import { issueSession } from "../lib/core/session.mjs";

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== "POST" && req.method !== "GET") {
    return send(res, 405, { error: "method_not_allowed" });
  }
  const issued = issueSession(req.headers.cookie || "");
  return send(res, 200, { session_id: issued.session_id }, { setCookie: issued.setCookie });
}
