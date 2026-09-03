import { cors, readJson, send } from "../lib/core/http.mjs";
import { splitExamText, toBankItems } from "../lib/core/pdf-split.mjs";
import { decodePdfB64, extractPdfBytes } from "../lib/core/pdf-extract.mjs";
import { parseSplitVision } from "../lib/core/bbox-crop.mjs";
import { geminiVision, splitKeyForGuest } from "../lib/core/gemini.mjs";

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== "POST") return send(res, 405, { error: "method_not_allowed" });
  try {
    const body = await readJson(req);
    let text = body.text || "";
    let items = toBankItems(splitExamText(text));
    let pageCount = 0;
    if (body.pdf_b64) {
      const extracted = await extractPdfBytes(decodePdfB64(body.pdf_b64));
      text = extracted.text || text;
      pageCount = extracted.pageCount;
      if (extracted.items.length) items = extracted.items;
    }
    const pages = Array.isArray(body.pages) ? body.pages : [];
    if (pages.length && splitKeyForGuest(process.env)) {
      const merged = [];
      let truncated = false;
      for (const page of pages) {
        const vision = await geminiVision({ imageB64: page.image_b64, purpose: "split" });
        if (!vision || vision.error) continue;
        const parsed = parseSplitVision(vision);
        merged.push(...parsed.items.map((it) => ({ ...it, page: Number(page.n) || 0 })));
        truncated = truncated || parsed.truncated;
      }
      return send(res, 200, { items: merged, truncated, count: merged.length, text, pageCount, filename: body.filename || "" });
    }
    return send(res, 200, {
      items,
      count: items.length,
      text,
      pageCount,
      filename: body.filename || "",
    });
  } catch (err) {
    return send(res, 502, { error: err.message || "split_unavailable" });
  }
}
