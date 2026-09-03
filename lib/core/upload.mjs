export function canStartFromHome({ fileName = "" } = {}) {
  return Boolean(String(fileName || "").trim());
}

export function shouldCreateSession(label) {
  return label === "math_problem" || label === "maybe_math";
}

export function homeGateText({ text = "", fileName = "" } = {}) {
  return [String(text || "").trim(), String(fileName || "").trim()].filter(Boolean).join("\n");
}
