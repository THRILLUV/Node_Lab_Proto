export function formatOcrPreview({ lines = [] } = {}) {
  const rows = (lines || [])
    .map((ln) => `<div class="ocr-line">${ln.step}번째 줄 · ${String(ln.latex || "")}</div>`)
    .join("");
  return `<div class="ocr-preview"><b>방금 올리신 손풀이를 이렇게 읽었어요</b>${rows}</div>`;
}
