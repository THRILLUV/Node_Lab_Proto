import { send } from "../../lib/core/http.mjs";
import { adminSummaryPayload } from "../../lib/core/admin-summary.mjs";

function readAdminKey(req) {
  const header = req.headers?.["x-nl-admin-key"];
  if (header != null && header !== "") return String(header);
  try {
    const q = new URL(req.url || "", "http://n.local").searchParams.get("k");
    return q == null ? "" : String(q);
  } catch {
    return "";
  }
}

export default async function handler(req, res) {
  res.setHeader("access-control-allow-origin", req.headers?.origin || "*");
  res.setHeader("access-control-allow-credentials", "true");
  res.setHeader("access-control-allow-headers", "content-type, x-nl-admin-key");
  res.setHeader("access-control-allow-methods", "GET,OPTIONS");
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }
  if (req.method !== "GET") return send(res, 405, { error: "method_not_allowed" });
  const out = await adminSummaryPayload({
    headerKey: readAdminKey(req),
    env: process.env,
    fetchFn: globalThis.fetch,
  });
  return send(res, out.status, out.body, { mock: Boolean(out.mock) });
}
