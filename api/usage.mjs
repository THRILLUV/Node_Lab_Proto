import { cors, send } from "../lib/core/http.mjs";
import { issueSession } from "../lib/core/session.mjs";
import { usageSnapshot } from "../lib/core/usage.mjs";

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== "GET") return send(res, 405, { error: "method_not_allowed" });
  const session = issueSession(req.headers.cookie || "");
  const snap = usageSnapshot(session.session_id);
  return send(res, 200, { ...snap, session_id: session.session_id }, { mock: true, setCookie: session.setCookie });
}
