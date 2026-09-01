import { cors, send } from "../lib/core/http.mjs";
import { authProviderFlags } from "../lib/core/social.mjs";
import { hasVisionKey, OPENCODE_GEN_DEFAULT } from "../lib/core/llm.mjs";

const DEFAULT_SUPABASE_URL = "https://rccewveplhbgkhrxloui.supabase.co";
const DEFAULT_SUPABASE_ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjY2V3dmVwbGhiZ2tocnhsb3VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4MzAyMDksImV4cCI6MjEwMzQwNjIwOX0.jEklPPgBBiaMW5uMZhZlCzs3nKl2kroBiWIeiS-aUBg";

export default async function handler(req, res) {
  if (cors(req, res)) return;
  return send(res, 200, {
    supabaseUrl: process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL,
    supabaseAnon: process.env.SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON,
    gemini: Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY),
    vision: hasVisionKey(),
    opencode: Boolean(process.env.OPENCODE_API_KEY),
    ga: process.env.GA_MEASUREMENT_ID || process.env.GA4_ID || "",
    llmBase: process.env.LLM_BASE_URL || "https://opencode.ai/zen/v1",
    llmModelGen: process.env.LLM_MODEL_GEN || OPENCODE_GEN_DEFAULT,
    llmModelCheck: process.env.LLM_MODEL_CHECK || "",
    auth: authProviderFlags(process.env),
  });
}
