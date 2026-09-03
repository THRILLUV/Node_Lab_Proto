export function clampNormBox(box = {}) {
  const x = Math.min(1, Math.max(0, Number(box.x) || 0));
  const y = Math.min(1, Math.max(0, Number(box.y) || 0));
  const w = Math.min(1 - x, Math.max(0, Number(box.w) || 0));
  const h = Math.min(1 - y, Math.max(0, Number(box.h) || 0));
  if (w < 0.02 || h < 0.02) return null;
  return { x, y, w, h };
}

export function pixelBox(box, width, height) {
  const b = clampNormBox(box);
  if (!b) return null;
  return {
    sx: Math.round(b.x * width),
    sy: Math.round(b.y * height),
    sw: Math.max(1, Math.round(b.w * width)),
    sh: Math.max(1, Math.round(b.h * height)),
  };
}

export function itemType(n) {
  return `문항 ${Number(n) || 1}`;
}

export function parseSplitVision(json = {}) {
  const items = (json.items || []).map((it, i) => ({
    n: Number(it.n) || i + 1,
    bbox: clampNormBox(it.bbox || it.box || {}),
    skip: it.skip || "",
  }));
  return { items, truncated: Boolean(json.truncated) };
}
