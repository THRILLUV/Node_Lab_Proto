export function encodeNavState({ shell = "public", view = "landing", guest = false } = {}) {
  if (shell === "app") return { nl: 1, shell: "app", guest: Boolean(guest) };
  return { nl: 1, shell: "public", view: view === "login" ? "login" : "landing" };
}

export function decodeNavState(raw) {
  if (!raw || raw.nl !== 1) return { shell: "public", view: "landing" };
  if (raw.shell === "app") return { shell: "app", guest: Boolean(raw.guest) };
  return { shell: "public", view: raw.view === "login" ? "login" : "landing" };
}

export function shouldPushNav(from = {}, to = {}) {
  const a = decodeNavState(encodeNavState(from));
  const b = decodeNavState(encodeNavState(to));
  if (a.shell !== b.shell) return true;
  if (a.shell === "public" && a.view !== b.view) return true;
  return false;
}

export function popNavAction(raw) {
  const next = decodeNavState(raw);
  if (next.shell === "app") return { action: "app", guest: next.guest };
  return { action: "public", view: next.view };
}
