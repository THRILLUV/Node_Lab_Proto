import { cors, readJson, send } from "../lib/core/http.mjs";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== "POST") return send(res, 405, { error: "method_not_allowed" });
  try {
    const body = await readJson(req);
    const itemIndex = Number(body.item_index || 1);
    const raw = await readFile(join(root, "questions.json"), "utf8");
    const bank = JSON.parse(raw);
    const item = (bank.items || []).find((it) => it.n === itemIndex) || bank.items?.[0];
    const variant = item?.variants?.[0];
    if (!variant) return send(res, 502, { error: "variant_unavailable" });
    return send(
      res,
      200,
      {
        stem: variant.stem,
        choices: variant.choices,
        answer_masked: true,
        request_id: `var-${itemIndex}-${variant.id}`,
      },
      { mock: true },
    );
  } catch (err) {
    return send(res, 502, { error: err.message || "variant_unavailable" });
  }
}
