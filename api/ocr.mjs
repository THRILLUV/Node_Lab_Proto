import { cors, readJson, send } from "../lib/core/http.mjs";
import { classifyGate } from "../lib/core/gate.mjs";
import { estimateImageBytes, mockOcr, savePreview } from "../lib/core/ocr.mjs";
import { issueSession } from "../lib/core/session.mjs";
import { geminiVision } from "../lib/core/gemini.mjs";

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== "POST") return send(res, 405, { error: "method_not_allowed" });
  try {
    const body = await readJson(req);
    const session = issueSession(req.headers.cookie || "");
    const sessionId = body.session_id || session.session_id;
    const itemIndex = Number(body.item_index || 1);
    const imageBytes = estimateImageBytes(body.image_b64 || "");
    const gate = classifyGate({ text: body.text || "", imageBytes });

    if (gate.label === "not_math" || gate.label === "unreadable") {
      return send(res, 200, { blocked: true, gate, lines: [], session_id: sessionId }, { mock: true, setCookie: session.setCookie });
    }

    let ocr = null;
    let mock = true;
    if (body.image_b64 && process.env.GEMINI_API_KEY) {
      const vision = await geminiVision({ imageB64: body.image_b64, text: body.text || "", purpose: "ocr" });
      if (vision?.label === "not_math" || vision?.label === "unreadable") {
        return send(res, 200, {
          blocked: true,
          gate: { label: vision.label, charge: false, message: gate.message },
          lines: [],
          session_id: sessionId,
        }, { setCookie: session.setCookie });
      }
      if (Array.isArray(vision?.lines) && vision.lines.length) {
        ocr = {
          lines: vision.lines,
          confidence: Number(vision.confidence || 0.7),
          mock: false,
        };
        mock = false;
      }
    }
    if (!ocr) ocr = mockOcr({ item_index: itemIndex });
    savePreview(sessionId, itemIndex, ocr);
    return send(
      res,
      200,
      {
        ...ocr,
        gate: gate.label === "maybe_math" ? gate : { label: "math_problem" },
        session_id: sessionId,
        item_index: itemIndex,
        upload_id: `${sessionId}:${itemIndex}:${Date.now()}`,
      },
      { mock, setCookie: session.setCookie },
    );
  } catch (err) {
    return send(res, err.status || 502, { error: err.message || "ocr_unavailable" });
  }
}
