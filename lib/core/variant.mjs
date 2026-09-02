import { verifyVariant } from "./verify.mjs";

export function hasCat(value) {
  return /CAT_[A-Z0-9_]+/.test(typeof value === "string" ? value : JSON.stringify(value ?? ""));
}

export function stripCat(value) {
  return String(value ?? "").replace(/CAT_[A-Z0-9_]+/g, "").trim();
}

export const CIRCLED_CHOICES = ["①", "②", "③", "④", "⑤"];

export function studentChoiceRows(choices = []) {
  const list = Array.isArray(choices) ? choices : [];
  if (list.length !== 5) return [];
  return list.map((text, i) => ({
    mark: CIRCLED_CHOICES[i],
    text: stripCat(text),
  }));
}

export function choiceAnswerIndex(choices = [], answer) {
  const n = Number(answer);
  if (Number.isInteger(n) && n >= 1 && n <= choices.length && String(answer) === String(n)) {
    return n;
  }
  const i = choices.findIndex((c) => String(c) === String(answer));
  return i >= 0 ? i + 1 : 1;
}

export function publicVariantPayload(variant, itemIndex = 1) {
  if (!variant?.stem) return null;
  const choices = Array.isArray(variant.choices) ? variant.choices : [];
  if (hasCat(variant.stem) || choices.some((c) => hasCat(c))) return null;
  return {
    stem: String(variant.stem),
    choices: [...choices],
    answer_masked: true,
    request_id: `var-${itemIndex}-${variant.id || "static"}`,
  };
}

export function studentVisibleVariant(variant, originalStem = "", itemIndex = 1) {
  const pub = publicVariantPayload(variant, itemIndex);
  if (!pub) return null;
  const check = verifyVariant({
    expr_original: originalStem,
    expr_variant: pub.stem,
    choices: pub.choices,
  });
  if (!check.pass) return null;
  return pub;
}

export function staticVariantItem(item, variantIndex = 0) {
  const v = (item?.variants || [])[variantIndex];
  if (!v) {
    return {
      ...item,
      answer: choiceAnswerIndex(item?.choices || [], item?.answer),
    };
  }
  return {
    ...item,
    stem: String(v.stem),
    choices: [...(v.choices || [])],
    answer: choiceAnswerIndex(v.choices || [], v.answer),
  };
}

export function applyRemoteVariant(item, remote = {}) {
  const vis = studentVisibleVariant(
    { id: "remote", stem: remote.stem, choices: remote.choices },
    item?.stem || "",
    item?.n || 1,
  );
  if (!vis) return staticVariantItem(item);
  const backup = (item?.variants || [])[0];
  return {
    ...item,
    stem: vis.stem,
    choices: vis.choices,
    answer: choiceAnswerIndex(backup?.choices || vis.choices, backup?.answer || item?.answer),
  };
}

export function mockVariantPlan({ plan = "Free", hasGenKey = false } = {}) {
  const pro = String(plan).toLowerCase() === "pro";
  return {
    count: pro || hasGenKey ? 30 : 10,
    source: hasGenKey ? "variant" : "static",
  };
}

export function buildVariantSet(items = [], { count = 10 } = {}) {
  return items.slice(0, count).map((it) => staticVariantItem(it, 0));
}

export function plateKind(mockMode) {
  return Number(mockMode) === 3 ? "typeset" : "crop";
}

export function railHint({ mockMode, stem, fallback } = {}) {
  if (Number(mockMode) === 3 && stem) {
    return String(stem).replace(/\s+/g, " ").slice(0, 28);
  }
  return fallback || String(stem || "").slice(0, 22);
}
