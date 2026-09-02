import { clampNormBox } from "./bbox-crop.mjs";

const ITEM_RE = /(?:^|\s)(?:문\s*)?(\d{1,2})\s*[\.．번]/;
const MIN_BOX_H = 0.08;

export function normalizePdfItems(rawItems = [], pageH = 0) {
  const h = Number(pageH) || 0;
  return (rawItems || [])
    .filter((it) => String(it?.str || "").length)
    .map((it) => {
      const t = it.transform || [];
      const x = Number(t[4]) || 0;
      const fontH = Math.abs(Number(t[3]) || Number(t[0]) || 0);
      const w = Number(it.width) || fontH * String(it.str || "").length * 0.6;
      const height = Number(it.height) || fontH || 12;
      const pdfY = Number(t[5]) || 0;
      const y = h ? h - pdfY - height : pdfY;
      return { str: String(it.str || ""), x, y, w, h: height };
    });
}

export function findItemMarkers(tokens = []) {
  const marks = [];
  for (const tok of tokens || []) {
    const str = String(tok?.str || "");
    if (!str.trim()) continue;
    const m = str.match(ITEM_RE);
    if (!m) continue;
    const n = Number(m[1]);
    if (!Number.isInteger(n) || n < 1 || n > 99) continue;
    marks.push({ n, y: Number(tok.y) || 0 });
  }
  marks.sort((a, b) => a.y - b.y || a.n - b.n);
  const seen = new Set();
  return marks.filter((m) => {
    if (seen.has(m.n)) return false;
    seen.add(m.n);
    return true;
  });
}

export function boxesFromMarkers(markers = [], pageW = 1, pageH = 1) {
  const w = Number(pageW) || 1;
  const h = Number(pageH) || 1;
  const sorted = [...(markers || [])].sort((a, b) => a.y - b.y || a.n - b.n);
  const boxes = [];
  for (let i = 0; i < sorted.length; i += 1) {
    const cur = sorted[i];
    const nextY = i + 1 < sorted.length ? sorted[i + 1].y : h;
    let yNorm = (Number(cur.y) || 0) / h;
    let hNorm = (nextY - Number(cur.y)) / h;
    if (hNorm < MIN_BOX_H) hNorm = MIN_BOX_H;
    if (yNorm + hNorm > 1) hNorm = 1 - yNorm;
    const bbox = clampNormBox({ x: 0, y: yNorm, w: w / w, h: hNorm });
    if (bbox) boxes.push({ n: cur.n, bbox });
  }
  return boxes;
}
