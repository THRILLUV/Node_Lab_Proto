import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cors, send } from "./http.mjs";
import {
  allowedRedirect,
  authorizeUrl,
  oauthEmail,
  profileFromProvider,
  providerEnvReady,
  sessionHashRedirect,
  socialStartHref,
} from "./oauth-shared.mjs";

export {
  allowedRedirect,
  authorizeUrl,
  oauthEmail,
  profileFromProvider,
  providerEnvReady,
  sessionHashRedirect,
  socialStartHref,
};

const TOKEN_URLS = {
  naver: "https://nid.naver.com/oauth2.0/token",
  kakao: "https://kauth.kakao.com/oauth/token",
};

const PROFILE_URLS = {
  naver: "https://openapi.naver.com/v1/nid/me",
  kakao: "https://kapi.kakao.com/v2/user/me",
};

export function createOAuthState({
  redirect,
  secret,
  now = Date.now(),
  nonce = randomBytes(8).toString("hex"),
} = {}) {
  if (!secret) throw new Error("state secret required");
  if (!allowedRedirect(redirect)) throw new Error("redirect not allowed");
  const payload = Buffer.from(JSON.stringify({ r: redirect, n: nonce, t: now })).toString("base64url");
  const sig = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function parseOAuthState(state, secret, now = Date.now()) {
  if (!state || !secret || !String(state).includes(".")) return null;
  const [payload, sig] = String(state).split(".");
  const expected = createHmac("sha256", secret).update(payload).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!allowedRedirect(data.r)) return null;
    if (now - Number(data.t || 0) > 15 * 60 * 1000) return null;
    return { redirect: data.r };
  } catch {
    return null;
  }
}

function clientCreds(provider, env) {
  if (provider === "naver") {
    return { clientId: env.NAVER_CLIENT_ID, clientSecret: env.NAVER_CLIENT_SECRET };
  }
  return {
    clientId: env.KAKAO_REST_API_KEY,
    clientSecret: env.KAKAO_CLIENT_SECRET || env.KAKAO_CLIENT_SECRET_KEY,
  };
}

function requestOrigin(req) {
  const proto = String(req.headers["x-forwarded-proto"] || "http").split(",")[0].trim();
  const host = String(req.headers["x-forwarded-host"] || req.headers.host || "127.0.0.1:4173")
    .split(",")[0]
    .trim();
  return `${proto}://${host}`;
}

function requestUrl(req) {
  const raw = String(req.url || "/");
  if (raw.startsWith("http://") || raw.startsWith("https://")) return new URL(raw);
  return new URL(raw, `${requestOrigin(req)}/`);
}

export async function exchangeCode({
  provider,
  code,
  redirectUri,
  clientId,
  clientSecret,
  state,
  fetchImpl = fetch,
} = {}) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: redirectUri,
  });
  if (state) body.set("state", state);
  const res = await fetchImpl(TOKEN_URLS[provider], {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.access_token) {
    throw Object.assign(new Error("oauth token exchange failed"), { status: 401, detail: json });
  }
  return json;
}

export async function fetchProviderProfile({ provider, accessToken, fetchImpl = fetch } = {}) {
  const res = await fetchImpl(PROFILE_URLS[provider], {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error("oauth profile failed"), { status: 401, detail: json });
  return profileFromProvider(provider, json);
}

export async function prepareOAuthUser({
  supabaseUrl,
  supabaseAnon,
  secret,
  email,
  password,
  name,
  provider,
  subject,
  fetchImpl = fetch,
} = {}) {
  const res = await fetchImpl(`${String(supabaseUrl).replace(/\/$/, "")}/rest/v1/rpc/nl_oauth_prepare`, {
    method: "POST",
    headers: {
      apikey: supabaseAnon,
      Authorization: `Bearer ${supabaseAnon}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      p_secret: secret,
      p_email: email,
      p_password: password,
      p_name: name,
      p_provider: provider,
      p_subject: subject,
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.email) {
    throw Object.assign(new Error("oauth prepare failed"), { status: 500, detail: json });
  }
  return json;
}

export async function passwordGrant({
  supabaseUrl,
  supabaseAnon,
  email,
  password,
  fetchImpl = fetch,
} = {}) {
  const res = await fetchImpl(`${String(supabaseUrl).replace(/\/$/, "")}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: supabaseAnon,
      Authorization: `Bearer ${supabaseAnon}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.access_token) {
    throw Object.assign(new Error("oauth session failed"), { status: 401, detail: json });
  }
  return json;
}

function sendRedirect(res, location) {
  res.statusCode = 302;
  res.setHeader("location", location);
  res.setHeader("cache-control", "no-store");
  res.end();
}

export async function handleSocialOAuth(req, res, provider, env = process.env, fetchImpl = fetch) {
  if (cors(req, res)) return;
  const ready = providerEnvReady(env);
  if (!ready[provider]) {
    return send(res, 409, { error: "provider_not_configured", provider });
  }
  const url = requestUrl(req);
  const origin = requestOrigin(req);
  const redirectUri = `${origin}/api/auth/${provider}`;
  const creds = clientCreds(provider, env);
  const stateSecret = env.NL_OAUTH_DB_SECRET || env.SUPABASE_ANON_KEY;
  const supabaseUrl = env.SUPABASE_URL;
  const supabaseAnon = env.SUPABASE_ANON_KEY;
  const appRedirect = url.searchParams.get("redirect") || `${origin}/`;

  if (!url.searchParams.get("code")) {
    if (!allowedRedirect(appRedirect)) return send(res, 400, { error: "redirect_not_allowed" });
    const state = createOAuthState({ redirect: appRedirect, secret: stateSecret });
    return sendRedirect(res, authorizeUrl({
      provider,
      clientId: creds.clientId,
      redirectUri,
      state,
    }));
  }

  try {
    const parsed = parseOAuthState(url.searchParams.get("state"), stateSecret);
    if (!parsed) return send(res, 400, { error: "invalid_state" });
    const token = await exchangeCode({
      provider,
      code: url.searchParams.get("code"),
      redirectUri,
      clientId: creds.clientId,
      clientSecret: creds.clientSecret,
      state: url.searchParams.get("state"),
      fetchImpl,
    });
    const profile = await fetchProviderProfile({
      provider,
      accessToken: token.access_token,
      fetchImpl,
    });
    if (!profile.subject) throw Object.assign(new Error("oauth subject missing"), { status: 401 });
    const password = randomBytes(24).toString("hex");
    const prepared = await prepareOAuthUser({
      supabaseUrl,
      supabaseAnon,
      secret: env.NL_OAUTH_DB_SECRET,
      email: oauthEmail({ provider, ...profile }),
      password,
      name: profile.name,
      provider,
      subject: profile.subject,
      fetchImpl,
    });
    const session = await passwordGrant({
      supabaseUrl,
      supabaseAnon,
      email: prepared.email,
      password,
      fetchImpl,
    });
    return sendRedirect(res, sessionHashRedirect(parsed.redirect, session));
  } catch {
    const dest = allowedRedirect(appRedirect) ? appRedirect : `${origin}/`;
    return sendRedirect(res, `${dest.replace(/#.*$/, "")}#auth_error=1`);
  }
}
