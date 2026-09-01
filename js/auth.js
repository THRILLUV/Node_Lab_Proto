import { shouldEnterApp, validateEmailPassword } from "../lib/core/auth-validate.mjs";

function humanAuthError(error) {
  const m = String(error?.message || "");
  if (/invalid login/i.test(m)) return "이메일 또는 비밀번호가 맞지 않아요.";
  if (/already registered/i.test(m)) return "이미 가입된 이메일이에요. 로그인해 주세요.";
  if (/signups not allowed/i.test(m)) return "지금 이메일 가입이 꺼져 있어요.";
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
  enterIfSession(data.session);
  sb.auth.onAuthStateChange((_event, session) => {
    enterIfSession(session);
  });

  async function submit(mode) {
    const email = document.getElementById("login-email")?.value || "";
    const password = document.getElementById("login-password")?.value || "";
    const v = validateEmailPassword({ email, password });
    if (!v.ok) return showErr(v.message);
    showErr("");
    const fn = mode === "signup" ? sb.auth.signUp.bind(sb.auth) : sb.auth.signInWithPassword.bind(sb.auth);
    const { data: out, error } = await fn({ email: v.email, password });
    if (error) return showErr(humanAuthError(error));
    if (!enterIfSession(out.session)) {
      showErr("메일 확인이 필요하면 받은편지함을 봐 주세요. 확인 후 같은 이메일로 들어와 주세요.");
    }
  }

  document.getElementById("btn-email-login")?.addEventListener("click", () => submit("in"));
  document.getElementById("btn-email-signup")?.addEventListener("click", () => submit("signup"));
}

initAuth();
