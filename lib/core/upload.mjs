export function canStartFromHome({ fileName = "" } = {}) {
  return Boolean(String(fileName || "").trim());
}
