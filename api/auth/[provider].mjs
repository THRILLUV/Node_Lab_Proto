import { handleSocialOAuth } from "../../lib/core/oauth.mjs";

export default function handler(req, res) {
  const raw = String(req.url || "/");
  const path = raw.startsWith("http") ? new URL(raw).pathname : raw.split("?")[0];
  const provider = path.replace(/\/+$/, "").split("/").pop();
  return handleSocialOAuth(req, res, provider);
}
