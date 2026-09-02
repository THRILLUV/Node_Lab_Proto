import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createCanvas } from "@napi-rs/canvas";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import {
  normalizePdfItems,
  findItemMarkers,
  boxesFromMarkers,
} from "../lib/core/pdf-layout.mjs";
import { itemType, pixelBox } from "../lib/core/bbox-crop.mjs";
import { toBankItems, mergeSplitBank } from "../lib/core/pdf-split.mjs";

function fnSource(src, name) {
  const start = src.indexOf("function " + name);
  assert.ok(start >= 0, "missing function " + name);
  const next = src.indexOf("\n  function ", start + 10);
  return src.slice(start, next > 0 ? next : undefined);
}

async function pageTokens(path) {
  const data = new Uint8Array(await readFile(path));
  const pdf = await getDocument({
    data,
    disableWorker: true,
    isEvalSupported: false,
    useSystemFonts: true,
  }).promise;
  const pages = [];
  for (let i = 1; i <= pdf.numPages; i += 1) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1.35 });
    const content = await page.getTextContent();
    const view = page.view || [0, 0, viewport.width, viewport.height];
    pages.push({
      raw: content.items,
      w: Number(view[2]) - Number(view[0]) || viewport.width,
      h: Number(view[3]) - Number(view[1]) || viewport.height,
      canvasW: viewport.width,
      canvasH: viewport.height,
      page,
      viewport,
    });
  }
  return pages;
}

function draftsFromPages(pages) {
  const drafts = [];
  for (const page of pages) {
    const tokens = normalizePdfItems(page.raw, page.h);
    const markers = findItemMarkers(tokens);
    if (!markers.length) continue;
    const boxes = boxesFromMarkers(markers, page.w, page.h);
    for (const box of boxes) {
      if (!box?.bbox) continue;
      const px = pixelBox(box.bbox, page.canvasW || page.w, page.canvasH || page.h);
      drafts.push({ n: box.n, bbox: box.bbox, px, type: itemType(box.n) });
    }
  }
  return drafts;
}

function cropPlateNode(canvas, bbox) {
  const px = pixelBox(bbox, canvas.width, canvas.height);
  if (!px) return { plate: "", px: null, ink: 0 };
  const pad = 8;
  const sx = Math.max(0, px.sx - pad);
  const sy = Math.max(0, px.sy - pad);
  const sw = Math.min(canvas.width - sx, px.sw + pad * 2);
  const sh = Math.min(canvas.height - sy, px.sh + pad * 2);
  if (sw < 1 || sh < 1) return { plate: "", px, ink: 0 };
  const crop = createCanvas(sw, sh);
  crop.getContext("2d").drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);
  const plate = crop.toDataURL("image/jpeg", 0.85);
  const img = crop.getContext("2d").getImageData(0, 0, sw, sh);
  let ink = 0;
  for (let i = 0; i < img.data.length; i += 4) {
    if (img.data[i] < 250 || img.data[i + 1] < 250 || img.data[i + 2] < 250) ink += 1;
  }
  return { plate, px: { ...px, sw, sh }, ink };
}

async function cropBankFromPdf(path) {
  const pages = await pageTokens(path);
  const drafts = [];
  for (const page of pages) {
    const canvas = createCanvas(Math.ceil(page.canvasW), Math.ceil(page.canvasH));
    await page.page.render({ canvasContext: canvas.getContext("2d"), viewport: page.viewport }).promise;
    const tokens = normalizePdfItems(page.raw, page.h);
    const markers = findItemMarkers(tokens);
    if (!markers.length) continue;
    const boxes = boxesFromMarkers(markers, page.w, page.h);
    for (const box of boxes) {
      if (!box?.bbox) continue;
      const cropped = cropPlateNode(canvas, box.bbox);
      drafts.push({
        n: box.n,
        stem: tokens.map((t) => t.str).join(" "),
        plate: cropped.plate,
        type: itemType(box.n),
        px: cropped.px,
        ink: cropped.ink,
        pageH: canvas.height,
      });
    }
  }
  return { drafts, bank: toBankItems(drafts) };
}

describe("mergeSplitBank prefers client crop drafts", () => {
  const clientPlates = [
    { n: 1, stem: "client 1", choices: [], plate: "data:image/jpeg;base64,AAA", type: "문항 1" },
    { n: 2, stem: "client 2", choices: ["가"], plate: "data:image/jpeg;base64,BBB", type: "문항 2" },
  ];
  const apiOnly = [
    { n: 1, stem: "api stem 1", choices: ["①", "②", "③", "④", "⑤"] },
    { n: 2, stem: "api stem 2", choices: [] },
    { n: 3, stem: "extra api row", choices: ["x"], plate: "" },
  ];

  it("keeps client length and JPEG plates; overlays API stem/choices on matching n only", () => {
    const merged = mergeSplitBank(clientPlates, apiOnly);
    assert.equal(merged.length, clientPlates.length);
    assert.equal(merged[0].plate, clientPlates[0].plate);
    assert.equal(merged[1].plate, clientPlates[1].plate);
    assert.ok(merged.every((row) => row.plate.startsWith("data:image/jpeg")));
    assert.equal(merged[0].stem, "api stem 1");
    assert.deepEqual(merged[0].choices, ["①", "②", "③", "④", "⑤"]);
    assert.equal(merged[1].stem, "api stem 2");
    assert.deepEqual(merged[1].choices, ["가"]);
    assert.ok(!merged.some((row) => row.n === 3));
  });

  it("uses client items when API is missing, and stays empty when client is empty", () => {
    assert.equal(mergeSplitBank(clientPlates, null).length, 2);
    assert.equal(mergeSplitBank(clientPlates, [])[0].plate, clientPlates[0].plate);
    assert.deepEqual(mergeSplitBank([], apiOnly), []);
    assert.deepEqual(mergeSplitBank(null, apiOnly), []);
  });

  it("wires splitHomeFile to mergeSplitBank instead of preferring /api/split rows", async () => {
    const src = await readFile(new URL("../js/pdf.js", import.meta.url), "utf8");
    assert.match(src, /mergeSplitBank/);
    assert.doesNotMatch(src, /json\.items && json\.items\.length \? json\.items : client\.items/);
  });
});

describe("client crop session wiring", () => {
  it("deletes the page-as-item fallback and crops via marker boxes", async () => {
    const src = await readFile(new URL("../js/pdf.js", import.meta.url), "utf8");
    assert.doesNotMatch(src, /plates\.map/);
    assert.doesNotMatch(src, /1쪽 문제를 보고/);
    assert.match(src, /normalizePdfItems/);
    assert.match(src, /findItemMarkers/);
    assert.match(src, /boxesFromMarkers/);
    assert.match(src, /pixelBox/);
    assert.match(src, /itemType/);
    assert.match(src, /drawImage/);
    assert.match(src, /toDataURL\("image\/jpeg", 0\.85\)/);
    assert.doesNotMatch(src, /normalizePdfItems\(content\.items,\s*viewport\.height\)/);
    assert.match(src, /page\.view/);
  });

  it("labels live PDF title/concept as 문항 N and uses detected count, not 30 or 추출", async () => {
    const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
    const question = fnSource(html, "question");
    assert.doesNotMatch(question, /추출/);
    assert.match(question, /it\.type \|\| \("문항 " \+ it\.n\)/);
    const splitLines = fnSource(html, "splitLines");
    assert.doesNotMatch(splitLines, /30문항으로 나누는 중/);
    assert.match(splitLines, /count \+ "문항으로 나누는 중…"/);
    const renderRecognition = fnSource(html, "renderRecognition");
    assert.doesNotMatch(renderRecognition, /\|\| 30/);
    const openSession = fnSource(html, "openSession");
    assert.doesNotMatch(openSession, /\|\| 30/);
  });
});

describe("fixture marker boxes", () => {
  it("finds 12 naesin items with item-1 crop shorter than the page", async () => {
    const pages = await pageTokens(new URL("../qa/fixtures/naesin-12.pdf", import.meta.url));
    const drafts = draftsFromPages(pages);
    const bank = toBankItems(drafts.map((d) => ({ n: d.n, stem: "문항 줄기 텍스트", plate: "data:crop" })));
    assert.equal(drafts.length, 12);
    assert.equal(bank.length, 12);
    assert.ok(!bank.some((row) => row.type === "추출"));
    assert.equal(bank[0].type, "문항 1");
    assert.ok(drafts[0].px.sh < (pages[0].canvasH || pages[0].h));
    assert.equal(pages.filter((p) => !findItemMarkers(normalizePdfItems(p.raw, p.h)).length).length, 0);
  });

  it("finds 20 pyunip items and returns no items when a page has zero markers", async () => {
    const pages = await pageTokens(new URL("../qa/fixtures/pyunip-20.pdf", import.meta.url));
    const drafts = draftsFromPages(pages);
    assert.equal(drafts.length, 20);
    assert.equal(drafts[0].type, "문항 1");
    assert.deepEqual(draftsFromPages([{ raw: [{ str: "수학 영역", transform: [1, 0, 0, 1, 40, 800] }], w: 595, h: 842 }]), []);
  });
});

describe("crop path plates", () => {
  it("paints distinct JPEGs from fixture-shaped token boxes", () => {
    const canvas = createCanvas(400, 600);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 400, 600);
    ctx.fillStyle = "#111111";
    ctx.fillRect(20, 80, 360, 40);
    ctx.fillStyle = "#cc3333";
    ctx.fillRect(20, 240, 360, 40);
    const tokens = [
      { str: "1.", x: 50, y: 80, w: 16, h: 14 },
      { str: "2x+5=17", x: 70, y: 80, w: 80, h: 14 },
      { str: "2.", x: 50, y: 240, w: 16, h: 14 },
      { str: "f(x)=x^2", x: 70, y: 240, w: 80, h: 14 },
    ];
    const boxes = boxesFromMarkers(findItemMarkers(tokens), 400, 600);
    const plates = boxes.map((box) => cropPlateNode(canvas, box.bbox));
    assert.equal(plates.length, 2);
    assert.ok(plates[0].plate.startsWith("data:image/jpeg"));
    assert.notEqual(plates[0].plate, plates[1].plate);
    assert.ok(plates[0].px.sh < 600);
    assert.ok(plates[0].ink > 0 && plates[1].ink > 0);
  });

  it("crops unique inked plates for naesin-12 and pyunip-20", async () => {
    const naesin = await cropBankFromPdf(new URL("../qa/fixtures/naesin-12.pdf", import.meta.url));
    const pyunip = await cropBankFromPdf(new URL("../qa/fixtures/pyunip-20.pdf", import.meta.url));
    assert.equal(naesin.bank.length, 12);
    assert.equal(pyunip.bank.length, 20);
    for (const pack of [naesin, pyunip]) {
      assert.ok(!pack.bank.some((row) => row.type === "추출" || String(row.stem).includes("추출")));
      assert.equal(pack.bank[0].type, "문항 1");
      const plates = pack.drafts.map((d) => d.plate);
      assert.ok(plates.every((p) => p.startsWith("data:image/jpeg")));
      assert.equal(new Set(plates).size, plates.length);
      assert.ok(pack.drafts.every((d) => d.px && d.px.sh < d.pageH));
      assert.ok(pack.drafts.every((d) => d.ink > 0));
    }
  });
});
