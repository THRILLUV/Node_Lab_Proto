import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { splitExamText, toBankItems } from "./pdf-split.mjs";

function toUint8(bytes) {
  if (Buffer.isBuffer(bytes)) return Uint8Array.from(bytes);
  if (bytes instanceof Uint8Array) return Uint8Array.from(bytes);
  return Uint8Array.from(bytes || []);
}

export async function extractPdfBytes(bytes) {
  const data = toUint8(bytes);
  if (!data.length) return { text: "", pageCount: 0, items: [] };
  const pdf = await getDocument({
    data,
    disableWorker: true,
    isEvalSupported: false,
    useSystemFonts: true,
  }).promise;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i += 1) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += `${content.items.map((it) => it.str).join(" ")}\n`;
  }
  const items = toBankItems(splitExamText(text));
  return { text, pageCount: pdf.numPages, items };
}

export function decodePdfB64(pdfB64 = "") {
  const raw = String(pdfB64 || "").replace(/^data:[^;]+;base64,/, "");
  if (!raw) return new Uint8Array();
  return new Uint8Array(Buffer.from(raw, "base64"));
}
