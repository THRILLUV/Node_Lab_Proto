import { shouldEnterApp, shouldEnterFromAuthEvent } from "../lib/core/auth-validate.mjs";
import { persistLoginRecords } from "../lib/core/persist.mjs";
import { socialButtonState } from "../lib/core/social.mjs";
import { socialStartHref } from "../lib/core/oauth-shared.mjs";

const persistedUsers = new Set();

function humanAuthError(error) {
  const m = String(error?.message || "");
  if (/invalid login/i.test(m)) return "지금은 로그인을 못 했어요. 잠시 후 다시 시도해 주세요.";
  if (/already registered/i.test(m)) return "이미 가입된 계정이에요. 같은 소셜로 들어와 주세요.";
  if (/signups not allowed/i.test(m)) return "지금 가입이 꺼져 있어요.";
  return "지금은 로그인을 못 했어요. 잠시 후 다시 시도해 주세요.";
}

function showErr(msg) {
  const el = document.getElementById("login-error");
  if (!el) return;
  el.hidden = !msg;
  el.textContent = msg || "";
}

function enterIfSession(session) {
  if (!shouldEnterApp(session)) return false;
  window.NL?.enterApp?.(session);
  return true;
}

async function persistIfNeeded(sb, session) {
  const user = session?.user;
  if (!user?.id || persistedUsers.has(user.id)) return;
  persistedUsers.add(user.id);
  try {
    await persistLoginRecords(sb, user);
  } catch (err) {
    console.warn("nl persist", err);
  }
}

export async function initAuth() {
  const res = await fetch("/api/config");
  const cfg = await res.json();
  if (!window.supabase) {
    showErr("로그인 모듈을 불러오지 못했어요.");
    return;
  }
  const sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnon);
  window.NL = window.NL || {};
  window.NL.sb = sb;

  const { data } = await sb.auth.getSession();
  window.NL.storedSession = data.session || null;
  sb.auth.onAuthStateChange((event, session) => {
    window.NL.storedSession = session || null;
    if (!shouldEnterFromAuthEvent(event, { guestMode: Boolean(window.NL.guestMode) })) return;
    if (enterIfSession(session)) persistIfNeeded(sb, session);
  });

  const social = socialButtonState(cfg.auth || {});
  paintSocial("btn-google-login", social.google, "google", '<span class="google-g">G</span> ');
  paintSocial("btn-kakao-login", social.kakao, "kakao", "");
  paintSocial("btn-naver-login", social.naver, "naver", "");

  function paintSocial(id, spec, provider, prefix) {
    const btn = document.getElementById(id);
    if (!btn || !spec) return;
    btn.disabled = !spec.enabled;
    btn.innerHTML = `${prefix}${spec.label}`;
    btn.addEventListener("click", async () => {
      if (!spec.enabled) {
        showErr(`${spec.label}이에요. Google로 들어와 주세요.`);
        return;
      }
      const href = socialStartHref({ provider, origin: location.origin, auth: cfg.auth || {} });
      if (href) {
        location.href = href;
        return;
      }
      const { error } = await sb.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${location.origin}/` },
      });
      if (error) showErr(humanAuthError(error));
    });
  }
}

initAuth();
