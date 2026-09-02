export function validateEmailPassword({ email = "", password = "" } = {}) {
  const trimmed = String(email).trim();
  if (!trimmed) {
    return { ok: false, message: "이메일을 입력해 주세요." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { ok: false, message: "이메일 형식을 확인해 주세요." };
  }
  if (String(password).length < 6) {
    return { ok: false, message: "비밀번호는 6자 이상이어야 해요." };
  }
  return { ok: true, email: trimmed };
}

export function shouldEnterApp(session) {
  return Boolean(session && session.user && session.access_token);
}

export function landingCtaAction(source = "nav") {
  if (source === "login") return { view: "login" };
  return { view: "app", tier: "guest" };
}

export function shouldEnterFromAuthEvent(event, { guestMode = false } = {}) {
  if (guestMode) return false;
  return event === "SIGNED_IN";
}
