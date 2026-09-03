import { cors, readJson, send } from "../lib/core/http.mjs";
import { buildHint } from "../lib/core/hint.mjs";
import { completeHint, hasTextKey } from "../lib/core/llm.mjs";
import { studentHintMessage } from "../lib/core/solve.mjs";

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== "POST") return send(res, 405, { error: "method_not_allowed" });
  try {
    const body = await readJson(req);
    const lines = body.ocr_confirmed_lines || body.lines || [];
    const hint = buildHint({
      choice: body.choice,
      itemIndex: Number(body.item_index || 1),
      lines,
      stem: body.stem || "",
    });
    if (hasTextKey()) {
      const model = await completeHint({
        stem: body.stem || "",
        lines,
        choice: body.choice || "hand",
      });
      if (model?.message) {
        hint.message = studentHintMessage(model);
        if (Number.isInteger(model.error_step_index)) hint.error_step_index = model.error_step_index;
      }
    }
    return send(res, 200, hint);
  } catch (err) {
    return send(res, 502, { error: err.message || "hint_unavailable" });
  }
}
