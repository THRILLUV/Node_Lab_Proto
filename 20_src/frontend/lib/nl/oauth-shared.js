/* drop-in copy of lib/core/oauth-shared.mjs — keep in sync via scripts/sync-nl-frontend-lib.mjs */
const ALLOWED_REDIRECTS = [
  /^https:\/\/nodelab-swart\.vercel\.app\/?$/,
  /^https:\/\/nodelab-thrilluv-4695\.vercel\.app\/?$/,
  /^http:\/\/127\.0\.0\.1:4173\/?$/,
  /^http:\/\/localhost:4173\/?$/,
];

const AUTH_URLS = {
  naver: "https://nid.naver.com/oauth2.0/authorize",
  kakao: "https://kauth.kakao.com/oauth/authorize",
};

export function providerEnvReady(env = {}) {
  return {
    kakao: Boolean(env.KAKAO_REST_API_KEY && (env.KAKAO_CLIENT_SECRET || env.KAKAO_CLIENT_SECRET_KEY)),
    naver: Boolean(env.NAVER_CLIENT_ID && env.NAVER_CLIENT_SECRET),
  };
}

export function allowedRedirect(url, env = process.env) {
  try {
    const parsed = new URL(url);
    if (parsed.username || parsed.password || parsed.hash) return false;
    const normalized = `${parsed.origin}${parsed.pathname === "/" ? "/" : parsed.pathname}`;
    if (ALLOWED_REDIRECTS.some((re) => re.test(normalized))) return true;
    const extras = String(env?.FRONTEND_ORIGIN || "")
      .split(",")
      .map((s) => s.trim().replace(/\/$/, ""))
      .filter(Boolean);
    return extras.includes(parsed.origin);
  } catch {
    return false;
  }
}

export function authorizeUrl({ provider, clientId, redirectUri, state } = {}) {
  if (!AUTH_URLS[provider]) throw new Error("provider not supported");
  const q = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
  });
  if (provider === "kakao") q.set("scope", "profile_nickname profile_image");
  return `${AUTH_URLS[provider]}?${q}`;
}

export function sessionHashRedirect(origin, { access_token, refresh_token } = {}) {
  const base = String(origin || "").replace(/#.*$/, "").replace(/\/?$/, "/");
  const hash = new URLSearchParams({
    access_token,
    refresh_token,
    token_type: "bearer",
  });
  return `${base}#${hash}`;
}

export function oauthEmail({ provider, subject, email } = {}) {
  const trimmed = String(email || "").trim().toLowerCase();
  if (trimmed && trimmed.includes("@")) return trimmed;
  return `${provider}_${subject}@users.nodelab.invalid`;
}

export function socialStartHref({ provider, origin, auth = {} } = {}) {
  const redirect = `${String(origin || "").replace(/\/$/, "")}/`;
  if (provider === "naver" && auth.naver) {
    return `/api/auth/naver?redirect=${encodeURIComponent(redirect)}`;
  }
  if (provider === "kakao" && auth.kakaoCustom) {
    return `/api/auth/kakao?redirect=${encodeURIComponent(redirect)}`;
  }
  return null;
}

export function profileFromProvider(provider, userJson = {}) {
  if (provider === "naver") {
    const r = userJson.response || {};
    return {
      subject: String(r.id || ""),
      email: r.email || "",
      name: r.nickname || r.name || "",
    };
  }
  const account = userJson.kakao_account || {};
  const profile = account.profile || {};
  return {
    subject: String(userJson.id || ""),
    email: account.email || "",
    name: profile.nickname || "",
  };
}
