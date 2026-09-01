import { splitExamText, toBankItems } from "../lib/core/pdf-split.mjs";

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

async function renderPage(page) {
  const viewport = page.getViewport({ scale: 1.35 });
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const ctx = canvas.getContext("2d");
  await page.render({ canvasContext: ctx, viewport }).promise;
  return canvas.toDataURL("image/jpeg", 0.8);
}

export async function extractPdfFile(file) {
  if (!file) return { text: "", pageCount: 0, items: [] };
  if (String(file.type || "").startsWith("image/")) {
    const plate = await fileToDataUrl(file);
    return {
      text: file.name || "",
      pageCount: 1,
      items: toBankItems([{ n: 1, stem: `${file.name} 문제 사진`, choices: [], plate }]),
    };
  }
  const pdfjs = await loadPdfjs();
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjs.getDocument({ data }).promise;
  let text = "";
  const plates = [];
  const maxPages = Math.min(pdf.numPages, 40);
  for (let i = 1; i <= maxPages; i += 1) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += `${content.items.map((it) => it.str).join(" ")}\n`;
    if (i <= 30) plates.push(await renderPage(page));
  }
  let items = toBankItems(splitExamText(text));
  if (!items.length && plates.length) {
    items = toBankItems(
      plates.map((plate, i) => ({
        n: i + 1,
        stem: `${i + 1}쪽 문제를 보고 풀어 주세요.`,
        choices: [],
        plate,
      })),
    );
  } else {
    items = items.map((it) => ({
      ...it,
      plate: it.plate || plates[Math.min(Math.max(it.n - 1, 0), plates.length - 1)] || "",
    }));
  }
  return { text, pageCount: pdf.numPages, items };
}

export function applySessionBank(items, meta = {}) {
  window.NL = window.NL || {};
  window.NL.sessionItems = items || [];
  window.NL.sessionSource = "pdf";
  window.NL.pdfPageCount = meta.pageCount || (items || []).length;
  window.NL.sessionPlates = Object.fromEntries(
    (items || []).filter((it) => it.plate).map((it) => [it.n, it.plate]),
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
      const plate = client.items.find((c) => c.n === it.n)?.plate;
      if (plate) it.plate = plate;
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
