import { cors, readJson, send } from "../lib/core/http.mjs";
import { buildHint } from "../lib/core/hint.mjs";

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== "POST") return send(res, 405, { error: "method_not_allowed" });
  try {
    const body = await readJson(req);
    const hint = buildHint({
      choice: body.choice,
      itemIndex: Number(body.item_index || 1),
      lines: body.ocr_confirmed_lines || body.lines || [],
    });
    return send(res, 200, hint, { mock: !process.env.OPENCODE_API_KEY && !process.env.GEMINI_API_KEY });
  } catch (err) {
    return send(res, 502, { error: err.message || "hint_unavailable" });
  }
}
