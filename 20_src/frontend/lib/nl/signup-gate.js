/* drop-in copy of lib/core/signup-gate.mjs — keep in sync via scripts/sync-nl-frontend-lib.mjs */
import { hasCompletedSignup, signupStorageKey } from "./consent.js";
import { shouldEnterApp } from "./auth-validate.js";

export async function fetchSignupRow(sb, userId) {
  try {
    const res = await sb
      .from("nl_profiles")
      .select("nickname,terms_version,privacy_version")
      .eq("id", userId)
      .maybeSingle();
    if (res?.error) return { error: true };
    return res?.data ?? null;
  } catch {
    return { error: true };
  }
}

export function readLocalSignup(userId, storage) {
  try {
    const raw = storage?.getItem?.(signupStorageKey(userId));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function writeLocalSignup(userId, patch, storage) {
  storage.setItem(signupStorageKey(userId), JSON.stringify(patch));
}

export function resolveSignupStatus({ row, local } = {}) {
  const rowForCheck = row && row.error ? null : row;
  if (hasCompletedSignup(rowForCheck) || hasCompletedSignup(local)) return "complete";
  return "needs_consent";
}

export async function saveSignupProfile(sb, patch) {
  try {
    const res = await sb.from("nl_profiles").upsert(patch);
    if (res?.error) return { error: res.error };
    return { error: null };
  } catch (error) {
    return { error };
  }
}

export function gateDecision({ session, status } = {}) {
  if (!shouldEnterApp(session)) return "ignore";
  if (status === "complete") return "enter";
  return "consent";
}
