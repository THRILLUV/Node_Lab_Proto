import { cors, readJson, send } from "../lib/core/http.mjs";
import { splitExamText, toBankItems } from "../lib/core/pdf-split.mjs";

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== "POST") return send(res, 405, { error: "method_not_allowed" });
  try {
    const body = await readJson(req);
    const items = toBankItems(splitExamText(body.text || ""));
    return send(res, 200, {
      items,
      count: items.length,
      filename: body.filename || "",
    });
  } catch (err) {
    return send(res, 502, { error: err.message || "split_unavailable" });
  }
}
