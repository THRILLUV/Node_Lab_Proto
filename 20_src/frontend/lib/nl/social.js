/* drop-in copy of lib/core/social.mjs — keep in sync via scripts/sync-nl-frontend-lib.mjs */
import { providerEnvReady } from "./oauth-shared.js";

export function socialButtonState({ google = false, kakao = false, naver = false } = {}) {
  return {
    google: {
      enabled: Boolean(google),
      label: google ? "Google로 계속하기" : "Google 준비 중",
    },
    kakao: {
      enabled: Boolean(kakao),
      label: kakao ? "카카오로 계속하기" : "Kakao 준비 중",
    },
    naver: {
      enabled: Boolean(naver),
      label: naver ? "네이버로 계속하기" : "Naver 준비 중",
    },
  };
}

export function authProviderFlags(env = process.env) {
  const ready = providerEnvReady(env);
  return {
    google: false,
    kakao: ready.kakao,
    naver: ready.naver,
  };
}

export function mergeAuthFlags(envFlags = {}, remote = {}) {
  return {
    google: Boolean(remote.google),
    kakao: Boolean(envFlags.kakao || remote.kakao),
    naver: Boolean(envFlags.naver || remote.naver),
    kakaoCustom: Boolean(envFlags.kakao) && !remote.kakao,
  };
}

export async function fetchRemoteAuthFlags({
  supabaseUrl,
  supabaseAnon,
  fetchImpl = fetch,
} = {}) {
  if (!supabaseUrl || !supabaseAnon) return {};
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 2500);
    const res = await fetchImpl(`${String(supabaseUrl).replace(/\/$/, "")}/auth/v1/settings`, {
      headers: { apikey: supabaseAnon, Authorization: `Bearer ${supabaseAnon}` },
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return {};
    const ext = (await res.json())?.external || {};
    return {
      google: ext.google === true,
      kakao: ext.kakao === true,
      naver: ext.naver === true,
    };
  } catch {
    return {};
  }
}
