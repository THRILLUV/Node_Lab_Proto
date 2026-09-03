import { hasCompletedSignup, signupStorageKey } from "./consent.mjs";
import { shouldEnterApp } from "./auth-validate.mjs";

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
