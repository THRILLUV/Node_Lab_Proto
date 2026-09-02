import { handleSocialOAuth } from "../../lib/core/oauth.mjs";

export default function handler(req, res) {
  return handleSocialOAuth(req, res, "naver");
}
