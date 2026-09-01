import { nlProfileRow } from "./profile.mjs";

export function loginPersistPayload(user = {}) {
  if (!user.id) throw new Error("user id required");
  const display_name = user.user_metadata?.display_name || user.email || "";
  return {
    profile: nlProfileRow({ id: user.id, display_name }),
    session: { user_id: user.id, entry: "login" },
  };
}

export function studySessionRow({
  user_id = null,
  exam_key = "2026",
  entry = "upload",
  session_id,
} = {}) {
  const row = { user_id: user_id || null, exam_key, entry };
  if (session_id) row.id = session_id;
  return row;
}

export async function persistStudySession(sb, row) {
  const payload = studySessionRow(row);
  const res = await sb.from("nl_sessions").insert(payload);
  if (res?.error) throw res.error;
  return payload;
}

export async function persistLoginRecords(sb, user) {
  const payload = loginPersistPayload(user);
  const profileRes = await sb.from("nl_profiles").upsert(payload.profile);
  if (profileRes?.error) throw profileRes.error;
  const sessionRes = await sb.from("nl_sessions").insert(payload.session);
  if (sessionRes?.error) throw sessionRes.error;
  return payload;
}
