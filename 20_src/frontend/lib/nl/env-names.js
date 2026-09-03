/* drop-in copy of lib/core/env-names.mjs — keep in sync via scripts/sync-nl-frontend-lib.mjs */
function envFirst(env, keys) {
  for (const key of keys) {
    const value = env?.[key];
    if (value != null && String(value).trim() !== "") return String(value).trim();
  }
  return "";
}

/** Live test app first (`SUPABASE_URL`), official Next name as alias. */
export function supabaseUrl(env = process.env) {
  return envFirst(env, ["SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL"]);
}

/** Live test app first (`SUPABASE_ANON_KEY`), official Next name as alias. */
export function supabaseAnonKey(env = process.env) {
  return envFirst(env, ["SUPABASE_ANON_KEY", "NEXT_PUBLIC_SUPABASE_ANON_KEY"]);
}

/** Live test app first (`SUPABASE_SERVICE_ROLE`), official FastAPI name as alias. */
export function supabaseServiceRole(env = process.env) {
  return envFirst(env, ["SUPABASE_SERVICE_ROLE", "SUPABASE_SERVICE_ROLE_KEY"]);
}

export function backendUrl(env = process.env) {
  return envFirst(env, ["BACKEND_URL"]);
}

/** Official backend uses comma-separated `FRONTEND_ORIGIN`. */
export function frontendOrigins(env = process.env) {
  return envFirst(env, ["FRONTEND_ORIGIN"])
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
