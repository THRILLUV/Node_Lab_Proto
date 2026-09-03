import { cors, readJson, send } from "../lib/core/http.mjs";
import { classifyGate } from "../lib/core/gate.mjs";
import { estimateImageBytes } from "../lib/core/ocr.mjs";
import { geminiVision } from "../lib/core/gemini.mjs";

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== "POST") return send(res, 405, { error: "method_not_allowed" });
  try {
    const body = await readJson(req);
    const imageBytes = estimateImageBytes(body.image_b64 || "");
    const local = classifyGate({ text: body.text || "", imageBytes });
    if (body.image_b64 && process.env.GEMINI_API_KEY) {
      const vision = await geminiVision({ imageB64: body.image_b64, text: body.text || "", purpose: "ocr" });
      if (vision?.label) {
        return send(res, 200, {
          label: vision.label,
          message: local.message,
          session_id: body.session_id,
        });
      }
    }
    return send(res, 200, { ...local, session_id: body.session_id }, { mock: !process.env.GEMINI_API_KEY });
  } catch (err) {
    return send(res, err.status || 502, { error: err.message || "gate_unavailable" });
  }
}
