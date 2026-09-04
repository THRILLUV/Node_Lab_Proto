import questions from "../questions.json";

const mockUser = {
  id: "handoff-user",
  email: "demo@nodelab.mock",
  user_metadata: {
    name: "명희 인수인계",
    full_name: "명희 인수인계",
    avatar_url: "",
    provider: "google",
  },
  app_metadata: { provider: "google" },
};

let session = null;
let profileRow = null;
const authListeners = new Set();

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function apiBody(path, init = {}) {
  let request = {};
  try {
    request = JSON.parse(init.body || "{}");
  } catch {}

  if (path === "/api/config") {
    return {
      supabaseUrl: "https://mock.supabase.invalid",
      supabaseAnon: "mock-anon",
      gemini: false,
      vision: false,
      opencode: false,
      ga: "",
      auth: { google: true, kakao: false, naver: false },
    };
  }
  if (path === "/api/session") return { session_id: "mock-session-001" };
  if (path === "/api/gate") {
    return { label: "math", message: "수학 문제로 확인했어요.", session_id: "mock-session-001" };
  }
  if (path === "/api/ocr") {
    return {
      ok: true,
      session_id: "mock-session-001",
      item_index: request.item_index || 1,
      lines: [
        { raw: "x² + 3x + 2 = 0", latex: "x^2+3x+2=0", confidence: 0.98 },
        { raw: "(x+1)(x+2)=0", latex: "(x+1)(x+2)=0", confidence: 0.96 },
      ],
      mock: true,
    };
  }
  if (path === "/api/ocr-confirm") return { ok: true, result: request.result || "confirm" };
  if (path === "/api/hint") {
    return {
      message: "인수분해되는 두 수의 합과 곱을 먼저 확인해 보세요.",
      choices: ["개념 한 줄", "다음 힌트", "손풀이 다시 보기"],
      mock: true,
    };
  }
  if (path === "/api/variant") {
    return {
      ok: true,
      item: {
        n: request.item_index || 1,
        stem: "같은 구조의 더미 응용문제입니다.",
        choices: ["① 1", "② 2", "③ 3", "④ 4", "⑤ 5"],
      },
      mock: true,
    };
  }
  if (path === "/api/usage") return { tier: "free", used: 3, limit: 10, remaining: 7 };
  return { ok: true, mock: true };
}

const nativeFetch = window.fetch.bind(window);
window.fetch = async function mockFetch(input, init = {}) {
  const raw = typeof input === "string" ? input : input?.url || "";
  const url = new URL(raw, "https://mock.nodelab.local");
  if (url.pathname === "/questions.json") return json(questions);
  if (url.pathname.startsWith("/api/")) return json(apiBody(url.pathname, init));
  return nativeFetch(input, init);
};

function makeQuery(table) {
  const query = {
    select() { return query; },
    eq() { return query; },
    single() { return Promise.resolve({ data: profileRow, error: null }); },
    maybeSingle() { return Promise.resolve({ data: profileRow, error: null }); },
    insert(payload) {
      return Promise.resolve({ data: Array.isArray(payload) ? payload : [payload], error: null });
    },
    upsert(payload) {
      const row = Array.isArray(payload) ? payload[0] : payload;
      if (table === "nl_profiles" && row) profileRow = { ...(profileRow || {}), ...row };
      return Promise.resolve({ data: row, error: null });
    },
    update(payload) {
      if (table === "nl_profiles" && payload) profileRow = { ...(profileRow || {}), ...payload };
      return query;
    },
    then(resolve, reject) {
      return Promise.resolve({ data: profileRow, error: null }).then(resolve, reject);
    },
  };
  return query;
}

const sb = {
  auth: {
    async getSession() { return { data: { session }, error: null }; },
    async getUser() { return { data: { user: session?.user || null }, error: null }; },
    onAuthStateChange(callback) {
      authListeners.add(callback);
      return { data: { subscription: { unsubscribe() { authListeners.delete(callback); } } } };
    },
    async signInWithOAuth() {
      session = { access_token: "mock-access", refresh_token: "mock-refresh", user: mockUser };
      queueMicrotask(() => authListeners.forEach((fn) => fn("SIGNED_IN", session)));
      return { data: { provider: "google" }, error: null };
    },
    async signOut() {
      session = null;
      authListeners.forEach((fn) => fn("SIGNED_OUT", null));
      return { error: null };
    },
  },
  from(table) { return makeQuery(table); },
};

window.supabase = { createClient() { return sb; } };
window.QRCode = {
  toCanvas(_canvas, _text, _opts, callback) {
    if (typeof callback === "function") callback(null);
  },
};

window.localStorage.removeItem("nl_signup:handoff-user");
window.localStorage.removeItem("nl_onboarded:handoff-user");

(async function startFullMock() {
  const nav = await import("../lib/core/nav-history.mjs");
  window.NL = window.NL || {};
  window.NL.encodeNavState = nav.encodeNavState;
  window.NL.decodeNavState = nav.decodeNavState;
  window.NL.shouldPushNav = nav.shouldPushNav;
  window.NL.popNavAction = nav.popNavAction;
  await import("../js/track.js");
  await import("../js/guest.js");
  await import("../js/consent.js");
  await import("../js/auth.js");
  await import("../js/upload.js");
  await import("../js/solve.js");
  await import("../js/pair.js");
  await import("../js/mock.js");

  const assetMap = window.NL_MOCK_ASSETS || {};
  window.NL.plateSrc = (n) => assetMap[`q${String(n).padStart(2, "0")}`] || "";

function click(selector) {
  document.querySelector(selector)?.click();
}

window.NL_HANDOFF = {
  landing() {
    location.reload();
  },
  login() {
    click("#btn-landing-login");
  },
  signup() {
    click("#btn-landing-login");
    setTimeout(() => click("#btn-google-login"), 20);
  },
  guest() {
    click("#btn-start-hero");
  },
  member() {
    profileRow = {
      id: mockUser.id,
      nickname: "명희 인수인계",
      age_band: "20–24세",
      over14: true,
      terms_version: "v0.1",
      privacy_version: "v0.1",
      marketing_opt_in: false,
    };
    localStorage.setItem("nl_signup:handoff-user", JSON.stringify(profileRow));
    localStorage.setItem("nl_onboarded:handoff-user", "1");
    click("#btn-landing-login");
    setTimeout(() => click("#btn-google-login"), 20);
  },
};

  document.querySelectorAll("[data-mock-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const fn = window.NL_HANDOFF[button.dataset.mockAction];
      if (fn) fn();
    });
  });
})();
