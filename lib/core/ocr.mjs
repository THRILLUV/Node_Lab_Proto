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

export async function runOcr({ imageB64 = "", text = "", itemIndex = 1, vision } = {}) {
  if (!imageB64) {
    return {
      ok: false,
      status: 400,
      error: "image_required",
      message: "손풀이 사진을 올려 주세요.",
    };
  }
  if (typeof vision !== "function") {
    return {
      ok: false,
      status: 503,
      error: "ocr_unavailable",
      message: "손풀이 읽기 모델이 아직 연결되지 않았어요.",
    };
  }
  const visionResult = await vision({ imageB64, text, purpose: "ocr", itemIndex });
  const lines = Array.isArray(visionResult?.lines) ? visionResult.lines : [];
  if (!lines.length || visionResult?.error) {
    return {
      ok: false,
      status: 502,
      error: "ocr_unavailable",
      message: "손풀이를 읽지 못했어요. 다시 찍어 주세요.",
    };
  }
  return {
    ok: true,
    mock: false,
    lines,
    confidence: Number(visionResult.confidence || 0.7),
    label: visionResult.label || "math_problem",
  };
}
