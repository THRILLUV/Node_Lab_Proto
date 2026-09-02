import { itemType } from "./bbox-crop.mjs";

const ITEM_RE = /(?:^|\n|\s)(?:문\s*)?(\d{1,2})\s*[\.．번]\s+/g;
const CIRCLED = ["①", "②", "③", "④", "⑤"];

export function parseChoices(body) {
  const raw = String(body || "").trim();
  if (!raw) return { stem: "", choices: [] };
  if (CIRCLED.every((mk) => raw.includes(mk))) {
    const parts = raw.split(/[①②③④⑤]/).map((s) => s.trim()).filter(Boolean);
    return { stem: parts[0] || raw, choices: parts.slice(1, 6) };
  }
  const numbered = raw.split(/\n\s*[1-5]\)\s+/);
  if (numbered.length >= 6) {
    return { stem: numbered[0].trim(), choices: numbered.slice(1, 6).map((s) => s.trim()) };
  }
  return { stem: raw, choices: [] };
}

export function splitExamText(text) {
  const raw = String(text || "").replace(/\r/g, "");
  if (!raw.trim()) return [];
  const matches = [...raw.matchAll(new RegExp(ITEM_RE.source, ITEM_RE.flags))];
  if (!matches.length) return [];
  const items = [];
  for (let i = 0; i < matches.length; i += 1) {
    const m = matches[i];
    const n = Number(m[1]);
    if (!Number.isInteger(n) || n < 1 || n > 99) continue;
    const start = m.index + m[0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index : raw.length;
    const body = raw.slice(start, end).trim();
    const parsed = parseChoices(body);
    if (!parsed.stem || parsed.stem.length < 4) continue;
    items.push({ n, stem: parsed.stem, choices: parsed.choices });
  }
  return items;
}

export function mergeSplitBank(clientItems, apiItems) {
  const client = Array.isArray(clientItems) ? clientItems : [];
  if (!client.length) return [];
  const api = Array.isArray(apiItems) ? apiItems : [];
  const byN = new Map(api.map((it) => [Number(it?.n), it]));
  return client.map((row) => {
    const hit = byN.get(Number(row.n));
    if (!hit) return { ...row };
    const stem = String(hit.stem || "").trim();
    const choices = Array.isArray(hit.choices) ? hit.choices : [];
    const mergedChoices = choices.length ? choices : row.choices;
    return {
      ...row,
      stem: stem || row.stem,
      choices: mergedChoices,
      kind: (mergedChoices || []).length === 5 ? "5지선다" : "단답",
    };
  });
}

export function toBankItems(items = []) {
  return (items || []).map((it, i) => ({
    n: Number(it.n) || i + 1,
    type: it.type || itemType(Number(it.n) || i + 1),
    kind: (it.choices || []).length === 5 ? "5지선다" : "단답",
    points: Number(it.points) || 3,
    stem: String(it.stem || ""),
    choices: [...(it.choices || [])],
    answer: it.answer ?? null,
    source: "pdf",
    plate: it.plate || "",
    variants: Array.isArray(it.variants) ? it.variants : [],
  }));
}
