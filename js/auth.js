import { shouldEnterApp, shouldEnterFromAuthEvent } from "../lib/core/auth-validate.mjs";
import { consentProfilePatch } from "../lib/core/consent.mjs";
import { persistLoginRecords } from "../lib/core/persist.mjs";
import { socialButtonState } from "../lib/core/social.mjs";
import { socialStartHref } from "../lib/core/oauth-shared.mjs";
import {
  fetchSignupRow,
  readLocalSignup,
  writeLocalSignup,
  resolveSignupStatus,
  saveSignupProfile,
  gateDecision,
} from "../lib/core/signup-gate.mjs";

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

async function enterIfSession(sb, session) {
  if (!shouldEnterApp(session)) return false;
  const userId = session.user.id;
  const row = await fetchSignupRow(sb, userId);
  const local = readLocalSignup(userId, window.localStorage);
  const status = resolveSignupStatus({ row, local });
  const decision = gateDecision({ session, status });
  if (decision === "enter") {
    window.NL?.enterApp?.(session);
    persistIfNeeded(sb, session);
    return true;
  }
  if (decision === "consent") {
    window.NL?.openSignupConsent?.(
      async ({ consentState, nickname, ageBand }) => {
        const patch = consentProfilePatch({
          userId,
          nickname,
          ageBand,
          marketing: consentState.marketing,
        });
        writeLocalSignup(userId, patch, window.localStorage);
        await saveSignupProfile(sb, patch);
        window.NL?.track?.("signup_consent", {
          terms_version: patch.terms_version,
          privacy_version: patch.privacy_version,
          marketing_opt_in: patch.marketing_opt_in,
        });
        window.NL?.enterApp?.(session);
        persistIfNeeded(sb, session);
      },
      () => {
        sb.auth.signOut();
        window.NL?.toast?.("동의하지 않으면 회원 기능을 쓸 수 없어요. 게스트로 둘러볼 수 있어요.");
      },
    );
  }
  return false;
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
    enterIfSession(sb, session);
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
