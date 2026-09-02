import { splitExamText, toBankItems, mergeSplitBank } from "../lib/core/pdf-split.mjs";
import { normalizePdfItems, findItemMarkers, boxesFromMarkers } from "../lib/core/pdf-layout.mjs";
import { pixelBox, itemType } from "../lib/core/bbox-crop.mjs";

const PDFJS_SRC = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs";
const PDFJS_WORKER = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs";

let pdfjsPromise = null;

function loadPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import(PDFJS_SRC).then((mod) => {
      const pdfjs = mod.default || mod;
      if (pdfjs.GlobalWorkerOptions) pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
      return pdfjs;
    });
  }
  return pdfjsPromise;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("file_unreadable"));
    reader.readAsDataURL(file);
  });
}

async function renderPageCanvas(page) {
  const viewport = page.getViewport({ scale: 1.35 });
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const ctx = canvas.getContext("2d");
  await page.render({ canvasContext: ctx, viewport }).promise;
  return { canvas, viewport };
}

function pageUserSize(page, viewport) {
  const view = page.view || [0, 0, viewport.width, viewport.height];
  const w = Number(view[2]) - Number(view[0]);
  const h = Number(view[3]) - Number(view[1]);
  return {
    w: w > 0 ? w : viewport.width,
    h: h > 0 ? h : viewport.height,
  };
}

function cropPlate(canvas, bbox) {
  const px = pixelBox(bbox, canvas.width, canvas.height);
  if (!px) return "";
  const pad = 8;
  const sx = Math.max(0, px.sx - pad);
  const sy = Math.max(0, px.sy - pad);
  const sw = Math.min(canvas.width - sx, px.sw + pad * 2);
  const sh = Math.min(canvas.height - sy, px.sh + pad * 2);
  if (sw < 1 || sh < 1) return "";
  const crop = document.createElement("canvas");
  crop.width = sw;
  crop.height = sh;
  const ctx = crop.getContext("2d");
  ctx.drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);
  return crop.toDataURL("image/jpeg", 0.85);
}

function stemForBox(tokens, box, pageH) {
  const y0 = (box.bbox.y || 0) * pageH;
  const y1 = y0 + (box.bbox.h || 0) * pageH;
  return tokens
    .filter((t) => (Number(t.y) || 0) >= y0 - 2 && (Number(t.y) || 0) < y1)
    .map((t) => t.str)
    .join(" ")
    .trim();
}

function bankType(it, i) {
  const n = Number(it?.n) || i + 1;
  const type = String(it?.type || "");
  if (type && type !== "추출") return type;
  return itemType(n);
}

export async function extractPdfFile(file) {
  if (!file) return { text: "", pageCount: 0, items: [] };
  if (String(file.type || "").startsWith("image/")) {
    const plate = await fileToDataUrl(file);
    return {
      text: file.name || "",
      pageCount: 1,
      items: toBankItems([{ n: 1, stem: `${file.name} 문제 사진`, choices: [], plate, type: itemType(1) }]),
    };
  }
  const pdfjs = await loadPdfjs();
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjs.getDocument({ data }).promise;
  let text = "";
  const drafts = [];
  const maxPages = Math.min(pdf.numPages, 40);
  for (let i = 1; i <= maxPages; i += 1) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += `${content.items.map((it) => it.str).join(" ")}\n`;
    const { canvas, viewport } = await renderPageCanvas(page);
    const layout = pageUserSize(page, viewport);
    const tokens = normalizePdfItems(content.items, layout.h);
    const markers = findItemMarkers(tokens);
    if (!markers.length) continue;
    const boxes = boxesFromMarkers(markers, layout.w, layout.h);
    const parsed = splitExamText(content.items.map((it) => it.str).join(" "));
    for (const box of boxes) {
      if (!box?.bbox) continue;
      const plate = cropPlate(canvas, box.bbox);
      const hit = parsed.find((row) => row.n === box.n);
      drafts.push({
        n: box.n,
        stem: hit?.stem || stemForBox(tokens, box, layout.h),
        choices: hit?.choices || [],
        plate,
        type: itemType(box.n),
      });
    }
  }
  drafts.sort((a, b) => a.n - b.n);
  return { text, pageCount: pdf.numPages, items: toBankItems(drafts) };
}

export function applySessionBank(items, meta = {}) {
  window.NL = window.NL || {};
  const rows = (items || []).map((it, i) => {
    const n = Number(it.n) || i + 1;
    return { ...it, n, type: bankType(it, i) };
  });
  window.NL.sessionItems = rows;
  window.NL.sessionSource = "pdf";
  window.NL.pdfPageCount = meta.pageCount || rows.length;
  window.NL.sessionPlates = Object.fromEntries(
    rows.filter((it) => it.plate).map((it) => [it.n, it.plate]),
  );
}

function fileToDataUrlForApi(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("file_unreadable"));
    reader.readAsDataURL(file);
  });
}

export async function splitHomeFile(file) {
  if (!file) return { text: "", pageCount: 0, items: [] };
  let client = { text: "", items: [], pageCount: 0 };
  try {
    client = await extractPdfFile(file);
  } catch {
    client = { text: "", items: [], pageCount: 0 };
  }
  const pdf_b64 = await fileToDataUrlForApi(file);
  let json = {};
  try {
    const res = await fetch("/api/split", {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        text: client.text || "",
        filename: file.name || "",
        pdf_b64,
      }),
    });
    if (res.ok) json = await res.json();
  } catch {
    json = {};
  }
  const items = mergeSplitBank(client.items, json.items);
  return {
    text: json.text || client.text || "",
    items,
    pageCount: json.pageCount || client.pageCount || items.length,
  };
}

window.NL = window.NL || {};
window.NL.extractPdfFile = extractPdfFile;
window.NL.splitHomeFile = splitHomeFile;
window.NL.applySessionBank = applySessionBank;
window.NL.clearSessionBank = () => {
  window.NL.sessionItems = null;
  window.NL.sessionSource = "";
  window.NL.sessionPlates = null;
  window.NL.pdfPageCount = 0;
  window.NL.homeExtractedText = "";
};
