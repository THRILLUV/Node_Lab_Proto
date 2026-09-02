import { cors, readJson, send } from "../lib/core/http.mjs";
import { confirmOcr } from "../lib/core/ocr.mjs";
import { issueSession } from "../lib/core/session.mjs";
import { chargeUsage } from "../lib/core/usage.mjs";

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== "POST") return send(res, 405, { error: "method_not_allowed" });
  try {
    const body = await readJson(req);
    const session = issueSession(req.headers.cookie || "");
    const result = confirmOcr({
      sessionId: body.session_id || session.session_id,
      itemIndex: Number(body.item_index || 1),
      result: body.result || "ok",
      lines: body.lines,
    });
    if (result.status === 409) return send(res, 409, result);
    if (body.result !== "retake") {
      const charged = chargeUsage(body.session_id || session.session_id, {
        gateLabel: "math_problem",
        ocrConfirmed: true,
        tier: body.tier || "guest",
        itemIndex: Number(body.item_index || 1),
      });
      if (charged.join) {
        return send(res, 200, { ...result, join: true, copy: charged.copy, usage: charged }, { setCookie: session.setCookie });
      }
    }
    return send(res, 200, result, { setCookie: session.setCookie });
  } catch (err) {
    return send(res, err.status || 502, { error: err.message || "confirm_unavailable" });
  }
}
