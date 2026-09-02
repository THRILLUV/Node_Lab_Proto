import { cors, send } from "../lib/core/http.mjs";
import { authProviderFlags, fetchRemoteAuthFlags, mergeAuthFlags } from "../lib/core/social.mjs";
import { hasVisionKey, OPENCODE_GEN_DEFAULT, zenFreeEnabled } from "../lib/core/llm.mjs";
import { adminSummaryPayload } from "../lib/core/admin-summary.mjs";

const DEFAULT_SUPABASE_URL = "https://yrgajwztpuscjbmrbkqg.supabase.co";
const DEFAULT_SUPABASE_ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyZ2Fqd3p0cHVzY2pibXJia3FnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzMTM3MDMsImV4cCI6MjEwMzg4OTcwM30.iI7BY6xsw3hOb5TrSOoDU_SHmSanRB5jxJfKWLykgAs";

function requestUrl(req) {
  try {
    return new URL(req.url || "", "http://n.local");
  } catch {
    return new URL("http://n.local/");
  }
}

function isAdminSummary(req) {
  return requestUrl(req).searchParams.get("admin") === "summary";
}

function readAdminKey(req) {
  const header = req.headers?.["x-nl-admin-key"];
  if (header != null && header !== "") return String(header);
  const q = requestUrl(req).searchParams.get("k");
  return q == null ? "" : String(q);
}

function adminCors(req, res) {
  res.setHeader("access-control-allow-origin", req.headers?.origin || "*");
  res.setHeader("access-control-allow-credentials", "true");
  res.setHeader("access-control-allow-headers", "content-type, x-nl-admin-key");
  res.setHeader("access-control-allow-methods", "GET,OPTIONS");
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return true;
  }
  return false;
}

export default async function handler(req, res) {
  if (isAdminSummary(req)) {
    if (adminCors(req, res)) return;
    if (req.method !== "GET") return send(res, 405, { error: "method_not_allowed" });
    const out = await adminSummaryPayload({
      headerKey: readAdminKey(req),
      env: process.env,
      fetchFn: globalThis.fetch,
    });
    return send(res, out.status, out.body, { mock: Boolean(out.mock) });
  }
  if (cors(req, res)) return;
  const supabaseUrl = process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const supabaseAnon = process.env.SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON;
  const remoteAuth = await fetchRemoteAuthFlags({ supabaseUrl, supabaseAnon });
  return send(res, 200, {
    supabaseUrl,
    supabaseAnon,
    gemini: Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY),
    vision: hasVisionKey(),
    opencode: Boolean(process.env.OPENCODE_API_KEY) || zenFreeEnabled(),
    ga: process.env.GA_MEASUREMENT_ID || process.env.GA4_ID || "",
    llmBase: process.env.LLM_BASE_URL || "https://opencode.ai/zen/v1",
    llmModelGen: process.env.LLM_MODEL_GEN || OPENCODE_GEN_DEFAULT,
    llmModelCheck: process.env.LLM_MODEL_CHECK || "",
    auth: mergeAuthFlags(authProviderFlags(process.env), remoteAuth),
  });
}
