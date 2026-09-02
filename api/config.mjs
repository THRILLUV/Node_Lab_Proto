import { cors, send } from "../lib/core/http.mjs";
import { authProviderFlags, fetchRemoteAuthFlags, mergeAuthFlags } from "../lib/core/social.mjs";
import { hasVisionKey, OPENCODE_GEN_DEFAULT, zenFreeEnabled } from "../lib/core/llm.mjs";

const DEFAULT_SUPABASE_URL = "https://gnuswrvxilwcitleizdx.supabase.co";
const DEFAULT_SUPABASE_ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdudXN3cnZ4aWx3Y2l0bGVpemR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyODUzNzMsImV4cCI6MjEwMzg2MTM3M30.lHZc5DtlSCRdbcQlo5PJ991Uzt0z8yUYYCwtWx5u8V8";

export default async function handler(req, res) {
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
