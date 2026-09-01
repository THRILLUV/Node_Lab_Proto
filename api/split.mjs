import { cors, readJson, send } from "../lib/core/http.mjs";
import { splitExamText, toBankItems } from "../lib/core/pdf-split.mjs";
import { decodePdfB64, extractPdfBytes } from "../lib/core/pdf-extract.mjs";

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
