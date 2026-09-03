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

export function pageTruncated(numPages, max = 40) {
  return Number(numPages) > max;
}

export function splitRequestBody({ text = "", filename = "", pdf_b64 = "", pages = [] } = {}) {
  const body = { text: text || "", filename: filename || "" };
  const scan = Array.isArray(pages) ? pages : [];
  if (scan.length) {
    body.pages = scan.map((p) => ({ n: Number(p.n) || 0, image_b64: p.image_b64 || "" }));
    return body;
  }
  if (pdf_b64) body.pdf_b64 = pdf_b64;
  return body;
}

function uniqueSkipN(pageN, occupiedNs = []) {
  const occupied = new Set((occupiedNs || []).map(Number));
  let n = 1000 + Number(pageN || 1);
  while (occupied.has(n)) n += 1;
  return n;
}

export function skipCardForPage(page, skip = "scan", occupiedNs = []) {
  const pageN = Number(page) || 1;
  const n = uniqueSkipN(pageN, occupiedNs);
  return {
    n,
    page: pageN,
    skip: String(skip || "scan"),
    stem: "",
    choices: [],
    plate: "",
    type: itemType(n),
  };
}

export function solvableBankItems(items = []) {
  return (items || []).filter((it) => !String(it?.skip || "").trim());
}

export function visionDraftsForScanPages(scanPages = [], apiItems = [], cropFn, occupiedNs = []) {
  const pages = Array.isArray(scanPages) ? scanPages : [];
  const items = Array.isArray(apiItems) ? apiItems : [];
  if (!pages.length) return [];
  const occupied = [...(occupiedNs || [])].map(Number).filter((n) => n > 0);
  const covered = new Set();
  const drafts = [];
  for (const it of items) {
    const skip = String(it.skip || "").trim();
    if (!skip && !it?.bbox) continue;
    const pageN = Number(it.page) || (pages.length === 1 ? Number(pages[0].n) : 0);
    const scan = pages.find((p) => Number(p.n) === pageN) || (pages.length === 1 ? pages[0] : null);
    if (skip) {
      const card = skipCardForPage(pageN || Number(scan?.n) || 1, skip, occupied);
      drafts.push(card);
      occupied.push(card.n);
      if (scan) covered.add(Number(scan.n));
      continue;
    }
    if (!it.bbox || !scan) continue;
    const plate = typeof cropFn === "function" ? cropFn(scan, it.bbox) : "";
    if (!plate) continue;
    const n = Number(it.n) || pageN;
    drafts.push({
      n,
      page: Number(scan.n),
      stem: "",
      choices: [],
      plate,
      type: itemType(n),
    });
    occupied.push(n);
    covered.add(Number(scan.n));
  }
  for (const p of pages) {
    if (covered.has(Number(p.n))) continue;
    const card = skipCardForPage(p.n, "scan", occupied);
    drafts.push(card);
    occupied.push(card.n);
  }
  return drafts;
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
    skip: String(it.skip || ""),
    page: Number(it.page) || 0,
    variants: Array.isArray(it.variants) ? it.variants : [],
  }));
}
