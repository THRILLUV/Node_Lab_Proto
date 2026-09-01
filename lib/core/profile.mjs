export function nlProfileRow({
  id,
  display_name = "",
  exam_track = "",
  tutor_mode = "",
  tier = "free",
} = {}) {
  if (!id) throw new Error("id required");
  return { id, display_name, exam_track, tutor_mode, tier };
}
