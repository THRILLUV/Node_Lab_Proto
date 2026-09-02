export function ocrConfirmActions() {
  return [
    { result: "ok", label: "맞아요" },
    { result: "edit", label: "줄만 고치기" },
    { result: "retake", label: "다시촬영" },
  ];
}

export function shouldTrackOcrConfirm({ confirmed } = {}) {
  return Boolean(confirmed);
}

export function shouldCloseOcrCropModal({ source, result, ocrCrop } = {}) {
  if (result === "ok" || result === "edit" || result === "retake") return true;
  if (source === "backdrop" && ocrCrop) return false;
  return true;
}

export function studentHintMessage(payload = {}) {
  const msg = String(payload.message || "");
  if (msg.includes("CAT_") || JSON.stringify(payload).includes("CAT_")) {
    throw new Error("CAT codes must not reach the student");
  }
  return msg;
}

export function buildOcrBody({ sessionId, itemIndex, imageB64, stem } = {}) {
  if (!imageB64) throw new Error("image_required");
  return {
    session_id: sessionId || "",
    item_index: Number(itemIndex || 1),
    image_b64: imageB64,
    text: stem || "",
  };
}

export function formatOcrPreview({ lines = [] } = {}) {
  const rows = (lines || [])
    .map((ln) => `<div class="ocr-line">${ln.step}번째 줄 · ${String(ln.latex || "")}</div>`)
    .join("");
  const actions = ocrConfirmActions()
    .map((a) => `<button class="ghost solid" type="button" data-ocr-confirm="${a.result}">${a.label}</button>`)
    .join("");
  return `<div class="ocr-preview"><b>방금 올리신 손풀이를 이렇게 읽었어요</b>${rows}<div class="actions">${actions}</div></div>`;
}

export function formatOcrCropModal({ imageUrl = "", lines = [] } = {}) {
  const src = String(imageUrl || "").trim();
  if (!src) return "";
  return (
    `<div class="ocr-crop-modal" data-ocr-crop="1">` +
    `<h2>손풀이가 정확하게 인식되었나요?</h2>` +
    `<div class="ocr-crop-frame"><img src="${src}" alt="손풀이 크롭"/></div>` +
    formatOcrPreview({ lines }) +
    `</div>`
  );
}
