export function companionUrl({ origin, sessionId } = {}) {
  const base = String(origin || "").replace(/\/$/, "");
  const id = String(sessionId || "").trim();
  return `${base}/m?s=${encodeURIComponent(id)}`;
}
