import { cors, readJson, send } from "../lib/core/http.mjs";
import { verifyVariant } from "../lib/core/verify.mjs";

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== "POST") return send(res, 405, { error: "method_not_allowed" });
  try {
    const body = await readJson(req);
    const result = verifyVariant(body);
    if (!result.pass) return send(res, 400, result, { mock: true });
    return send(res, 200, result, { mock: !process.env.OPENCODE_API_KEY });
  } catch (err) {
    return send(res, 400, { pass: false, reasons: [err.message || "invalid"] });
  }
}
