import { cors, readJson, send } from "../lib/core/http.mjs";
import { classifyGate } from "../lib/core/gate.mjs";
import { estimateImageBytes, runOcr, savePreview } from "../lib/core/ocr.mjs";
import { issueSession } from "../lib/core/session.mjs";
import { hasVisionKey, readHandwriting } from "../lib/core/llm.mjs";

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== "POST") return send(res, 405, { error: "method_not_allowed" });
  try {
    const body = await readJson(req);
    const session = issueSession(req.headers.cookie || "");
    const sessionId = body.session_id || session.session_id;
    const itemIndex = Number(body.item_index || 1);
    const imageB64 = body.image_b64 || "";
    const imageBytes = estimateImageBytes(imageB64);
    const gate = classifyGate({ text: body.text || "", imageBytes });

    if (!imageB64 && (gate.label === "not_math" || gate.label === "unreadable")) {
      return send(res, 200, { blocked: true, gate, lines: [], session_id: sessionId }, { setCookie: session.setCookie });
    }

    const ocr = await runOcr({
      imageB64,
      text: body.text || "",
      itemIndex,
      vision: hasVisionKey() ? (args) => readHandwriting(args) : undefined,
    });
    if (!ocr.ok) {
      return send(res, ocr.status || 502, { ...ocr, session_id: sessionId }, { setCookie: session.setCookie });
    }
    savePreview(sessionId, itemIndex, ocr);
    return send(
      res,
      200,
      {
        lines: ocr.lines,
        confidence: ocr.confidence,
        mock: false,
        gate: gate.label === "maybe_math" ? gate : { label: "math_problem" },
        session_id: sessionId,
        item_index: itemIndex,
        upload_id: `${sessionId}:${itemIndex}:${Date.now()}`,
      },
      { setCookie: session.setCookie },
    );
  } catch (err) {
    return send(res, err.status || 502, { error: err.message || "ocr_unavailable" });
  }
}
