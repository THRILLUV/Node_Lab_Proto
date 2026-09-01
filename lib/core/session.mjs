import { randomUUID } from "node:crypto";

export function readSessionCookie(cookieHeader = "") {
  const m = String(cookieHeader || "").match(/(?:^|;\s*)nl_session=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : "";
}

export function issueSession(cookieHeader = "", opts = {}) {
  if (!opts.renew) {
    const existing = readSessionCookie(cookieHeader);
    if (existing) {
      return { session_id: existing };
    }
  }
  const session_id = randomUUID();
  return {
    session_id,
    setCookie: `nl_session=${session_id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`,
  };
}
