import { cors, readJson, send } from "../lib/core/http.mjs";
import { publicVariantPayload } from "../lib/core/variant.mjs";
import { verifyVariant } from "../lib/core/verify.mjs";
import { composeVariantPrompt, geminiText, hasTextKey, openAiChat } from "../lib/core/llm.mjs";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

async function generatedVariant(body, itemIndex) {
  if (!hasTextKey() || !body.stem) return null;
  const prompt = composeVariantPrompt({ stem: body.stem, choices: body.choices || [] });
  const model = (await openAiChat({ prompt })) || (await geminiText({ prompt }));
  if (!model?.stem || !Array.isArray(model.choices)) return null;
  const payload = publicVariantPayload({ id: "gen", stem: model.stem, choices: model.choices }, itemIndex);
  if (!payload) return null;
  const check = verifyVariant({
    expr_original: body.stem,
    expr_variant: payload.stem,
    choices: payload.choices,
  });
  return check.pass ? payload : null;
}

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== "POST") return send(res, 405, { error: "method_not_allowed" });
  try {
    const body = await readJson(req);
    const itemIndex = Number(body.item_index || 1);
    const live = await generatedVariant(body, itemIndex);
    if (live) return send(res, 200, live);
    const raw = await readFile(join(root, "questions.json"), "utf8");
    const bank = JSON.parse(raw);
    const item = (bank.items || []).find((it) => it.n === itemIndex) || bank.items?.[0];
    const payload = publicVariantPayload(item?.variants?.[0], itemIndex);
    if (!payload) return send(res, 502, { error: "variant_unavailable" });
    const check = verifyVariant({
      expr_original: item?.stem || "",
      expr_variant: payload.stem,
      choices: payload.choices,
    });
    if (!check.pass) return send(res, 502, { error: "variant_unavailable", reasons: check.reasons });
    return send(res, 200, payload);
  } catch (err) {
    return send(res, 502, { error: err.message || "variant_unavailable" });
  }
}
