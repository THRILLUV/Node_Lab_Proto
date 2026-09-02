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
  return {
    google: Boolean(env.AUTH_GOOGLE === "1" || env.SUPABASE_AUTH_GOOGLE === "1"),
    kakao: Boolean(env.AUTH_KAKAO === "1" || env.SUPABASE_AUTH_KAKAO === "1"),
    naver: Boolean(env.NAVER_CLIENT_ID && env.NAVER_CLIENT_SECRET),
  };
}

export function mergeAuthFlags(envFlags = {}, remote = {}) {
  return {
    google: Boolean(envFlags.google || remote.google),
    kakao: Boolean(envFlags.kakao || remote.kakao),
    naver: Boolean(envFlags.naver || remote.naver),
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
