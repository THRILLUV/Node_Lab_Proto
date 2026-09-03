export function verifyVariant({ expr_original = "", expr_variant = "", answer = "", choices = [] } = {}) {
  const original = String(expr_original || "").trim();
  const variant = String(expr_variant || "").trim();
  const reasons = [];

  if (!variant) {
    return { pass: false, reasons: ["empty_variant"] };
  }
  if (!original) {
    return { pass: false, reasons: ["empty_original"] };
  }
  if (variant === original) {
    return { pass: false, reasons: ["not_transformed"] };
  }
  if (/CAT_[A-Z0-9_]+/.test(variant) || /CAT_[A-Z0-9_]+/.test(JSON.stringify(choices))) {
    return { pass: false, reasons: ["cat_leak"] };
  }
  if (/\/\s*0\b/.test(variant) || /\{0\}/.test(variant) && /frac/.test(variant) && /\{0\}\s*$/.test(variant)) {
    reasons.push("possible_div_zero");
  }
  if (Array.isArray(choices) && choices.length) {
    const uniq = new Set(choices.map(String));
    if (uniq.size !== choices.length) reasons.push("duplicate_choices");
    if (choices.length === 5 && answer && !choices.some((c) => String(c) === String(answer))) {
      reasons.push("answer_not_in_choices");
    }
  }
  if (reasons.includes("possible_div_zero") || reasons.includes("duplicate_choices") || reasons.includes("answer_not_in_choices")) {
    return { pass: false, reasons };
  }
  return { pass: true, reasons: reasons.length ? reasons : ["ok"] };
}
