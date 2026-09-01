const previews = new Map();

export function previewKey(sessionId, itemIndex) {
  return `${sessionId}:${itemIndex}`;
}

export function mockOcr({ item_index = 1 } = {}) {
  const bank = {
    1: [
      { step: 1, latex: "9^{1/4} = 3^{1/2}" },
      { step: 2, latex: "3^{1/2} \\times 3^{-1/2} = 3^{1}" },
      { step: 3, latex: "= 3" },
    ],
    2: [
      { step: 1, latex: "f'(x) = 9x^{2}+4" },
      { step: 2, latex: "f'(1) = 9+4 = 13" },
    ],
  };
  const lines = bank[item_index] || bank[1];
  return { lines, confidence: 0.74, mock: true };
}

export function savePreview(sessionId, itemIndex, ocr) {
  previews.set(previewKey(sessionId, itemIndex), ocr);
  return ocr;
}

export function getPreview(sessionId, itemIndex) {
  return previews.get(previewKey(sessionId, itemIndex)) || null;
}

export function confirmOcr({ sessionId, itemIndex, result, lines } = {}) {
  const stored = getPreview(sessionId, itemIndex);
  const used = Array.isArray(lines) && lines.length ? { lines } : stored;
  if (!used) {
    return { ok: false, status: 409, error: "preview_missing" };
  }
  if (result === "retake") {
    previews.delete(previewKey(sessionId, itemIndex));
    return { ok: true, retake: true };
  }
  if (result === "edit" && Array.isArray(lines)) {
    savePreview(sessionId, itemIndex, { ...used, lines, edited: true });
  }
  const diagnosis = {
    primary_category: "calculation",
    status: "confirmed",
    confidence: stored?.confidence ?? 0.7,
    error_step_index: 2,
    evidence_quote: used.lines?.[1]?.latex || used.lines?.[0]?.latex || "",
  };
  return { ok: true, diagnosis };
}

export function estimateImageBytes(imageB64 = "") {
  const raw = String(imageB64).replace(/^data:[^;]+;base64,/, "");
  if (!raw) return 0;
  return Math.floor((raw.length * 3) / 4);
}
