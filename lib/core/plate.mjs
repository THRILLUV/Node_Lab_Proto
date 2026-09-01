export function plateSrc(n) {
  const i = Number(n);
  if (!Number.isInteger(i) || i < 1 || i > 30) throw new Error("item_index");
  return `items/q${String(i).padStart(2, "0")}.png`;
}
