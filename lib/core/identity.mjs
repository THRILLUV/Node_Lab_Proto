function firstGlyph(s) {
  const ch = String(s || "").trim().charAt(0);
  return ch || "게";
}

export function identityFromSession(session, { guest = false } = {}) {
  if (guest || !session?.user) {
    return {
      guest: true,
      name: "게스트",
      email: "",
      initials: "게",
      provider: "",
    };
  }
  const user = session.user;
  const meta = user.user_metadata || {};
  const name = String(meta.full_name || meta.name || user.email || "회원").trim();
  const email = String(user.email || "").trim();
  const provider = String(user.app_metadata?.provider || meta.provider || "").trim();
  return {
    guest: false,
    name,
    email,
    initials: firstGlyph(name),
    provider,
  };
}
