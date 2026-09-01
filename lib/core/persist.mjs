import { nlProfileRow } from "./profile.mjs";

export function loginPersistPayload(user = {}) {
  if (!user.id) throw new Error("user id required");
  const display_name = user.user_metadata?.display_name || user.email || "";
  return {
    profile: nlProfileRow({ id: user.id, display_name }),
    session: { user_id: user.id, entry: "login" },
  };
}

export async function persistLoginRecords(sb, user) {
  const payload = loginPersistPayload(user);
  const profileRes = await sb.from("nl_profiles").upsert(payload.profile);
  if (profileRes?.error) throw profileRes.error;
  const sessionRes = await sb.from("nl_sessions").insert(payload.session);
  if (sessionRes?.error) throw sessionRes.error;
  return payload;
}
