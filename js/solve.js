import { formatOcrPreview } from "../lib/core/solve.mjs";

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
  window.NL.runCapture = async () => {
    const itemIndex = window.NL.currentQ || 1;
    const sessionId = window.NL.sessionId || "";
    const ocr = await requestOcr({ sessionId, itemIndex });
    window.NL.ocrPreview = ocr;
    window.NL.onOcrPreview?.(ocr);
  };
}

initSolve();
