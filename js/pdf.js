import { splitExamText, toBankItems } from "../lib/core/pdf-split.mjs";
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

function cropPlate(canvas, bbox) {
  const px = pixelBox(bbox, canvas.width, canvas.height);
  if (!px) return "";
  const crop = document.createElement("canvas");
  crop.width = px.sw;
  crop.height = px.sh;
  const ctx = crop.getContext("2d");
  ctx.drawImage(canvas, px.sx, px.sy, px.sw, px.sh, 0, 0, px.sw, px.sh);
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
    const tokens = normalizePdfItems(content.items, viewport.height);
    const markers = findItemMarkers(tokens);
    if (!markers.length) continue;
    const boxes = boxesFromMarkers(markers, viewport.width, viewport.height);
    const parsed = splitExamText(content.items.map((it) => it.str).join(" "));
    for (const box of boxes) {
      const plate = cropPlate(canvas, box.bbox);
      const hit = parsed.find((row) => row.n === box.n);
      drafts.push({
        n: box.n,
        stem: hit?.stem || stemForBox(tokens, box, viewport.height),
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
  const json = await res.json();
  const items = (json.items && json.items.length ? json.items : client.items) || [];
  if (client.items?.length) {
    for (const it of items) {
      const c = client.items.find((row) => row.n === it.n);
      if (c?.plate) it.plate = c.plate;
      if (c?.type) it.type = bankType(c, 0);
    }
  }
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
