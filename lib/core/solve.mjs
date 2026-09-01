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

export function studentHintMessage(payload = {}) {
  const msg = String(payload.message || "");
  if (msg.includes("CAT_") || JSON.stringify(payload).includes("CAT_")) {
    throw new Error("CAT codes must not reach the student");
  }
  return msg;
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
