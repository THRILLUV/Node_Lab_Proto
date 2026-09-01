import { formatOcrPreview, shouldTrackOcrConfirm, studentHintMessage } from "../lib/core/solve.mjs";

export async function requestOcr({ sessionId, itemIndex, text }) {
  const res = await fetch("/api/ocr", {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      session_id: sessionId,
      item_index: itemIndex,
      text: text || "9^{1/4} \\times 3^{-1/2} 의 값은?",
    }),
  });
  const json = await res.json();
  return json;
}

export function initSolve() {
  window.NL = window.NL || {};
  window.NL.formatOcrPreview = formatOcrPreview;
  window.NL.requestOcr = requestOcr;
  window.NL.shouldTrackOcrConfirm = shouldTrackOcrConfirm;
  window.NL.confirmOcr = async (result) => {
    const preview = window.NL.ocrPreview;
    let lines = preview?.lines || [];
    if (result === "edit") {
      const raw = window.prompt("고칠 줄을 LaTeX로 적어 주세요.");
      if (!raw) return { cancelled: true };
      lines = lines.map((ln, i) => (i === 1 ? { ...ln, latex: raw } : ln));
    }
    const res = await fetch("/api/ocr-confirm", {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        session_id: window.NL.sessionId || "",
        item_index: window.NL.currentQ || 1,
        result,
        lines,
      }),
    });
    const json = await res.json();
    if (shouldTrackOcrConfirm({ confirmed: result !== "retake" && res.ok })) {
      window.NL.track?.("ocr_confirm", { result, item_index: window.NL.currentQ || 1 });
    }
    if (result !== "retake" && res.ok) {
      const hintRes = await fetch("/api/hint", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          choice: "hand",
          item_index: window.NL.currentQ || 1,
          ocr_confirmed_lines: lines,
        }),
      });
      const hint = await hintRes.json();
      json.hint = studentHintMessage(hint);
    }
    window.NL.onOcrConfirmed?.({ result, json, lines });
    return json;
  };
  window.NL.runCapture = async () => {
    const itemIndex = window.NL.currentQ || 1;
    const sessionId = window.NL.sessionId || "";
    const ocr = await requestOcr({ sessionId, itemIndex });
    window.NL.ocrPreview = ocr;
    window.NL.onOcrPreview?.(ocr);
  };
}

initSolve();
