import { buildOcrBody, formatOcrPreview, shouldTrackOcrConfirm, studentHintMessage } from "../lib/core/solve.mjs";

function pickHandFile() {
  return new Promise((resolve) => {
    const input = document.getElementById("hand-file");
    if (!input) return resolve(null);
    const onChange = () => {
      input.removeEventListener("change", onChange);
      resolve(input.files && input.files[0] ? input.files[0] : null);
    };
    input.addEventListener("change", onChange, { once: true });
    input.value = "";
    input.click();
  });
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("image_required"));
    reader.readAsDataURL(file);
  });
}

export async function requestOcr({ sessionId, itemIndex, imageB64, stem }) {
  const body = buildOcrBody({ sessionId, itemIndex, imageB64, stem });
  const res = await fetch("/api/ocr", {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) return { ok: false, status: res.status, ...json };
  return json;
}

export function initSolve() {
  window.NL = window.NL || {};
  window.NL.formatOcrPreview = formatOcrPreview;
  window.NL.requestOcr = requestOcr;
  window.NL.shouldTrackOcrConfirm = shouldTrackOcrConfirm;
  window.NL.confirmOcr = async (result) => {
    const preview = window.NL.ocrPreview;
    let lines = preview?.lines || [];
    if (result === "edit") {
      const raw = window.prompt("고칠 줄을 LaTeX로 적어 주세요.");
      if (!raw) return { cancelled: true };
      lines = lines.map((ln, i) => (i === 1 ? { ...ln, latex: raw } : ln));
    }
    const res = await fetch("/api/ocr-confirm", {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        session_id: window.NL.sessionId || "",
        item_index: window.NL.currentQ || 1,
        result,
        lines,
        tier: window.NL_TIER || "guest",
      }),
    });
    const json = await res.json();
    if (shouldTrackOcrConfirm({ confirmed: result !== "retake" && res.ok })) {
      window.NL.track?.("ocr_confirm", { result, item_index: window.NL.currentQ || 1 });
    }
    if (result !== "retake" && res.ok) {
      const hintRes = await fetch("/api/hint", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          choice: "hand",
          item_index: window.NL.currentQ || 1,
          ocr_confirmed_lines: lines,
          stem: window.NL.currentStem || "",
        }),
      });
      const hint = await hintRes.json();
      json.hint = studentHintMessage(hint);
    }
    window.NL.onOcrConfirmed?.({ result, json, lines });
    return json;
  };
  window.NL.runCapture = async () => {
    const file = await pickHandFile();
    if (!file) {
      window.NL.onOcrPreview?.({ ok: false, error: "image_required", message: "손풀이 사진을 올려 주세요." });
      return { cancelled: true };
    }
    const imageB64 = await fileToDataUrl(file);
    const ocr = await requestOcr({
      sessionId: window.NL.sessionId || "",
      itemIndex: window.NL.currentQ || 1,
      imageB64,
      stem: window.NL.currentStem || "",
    });
    window.NL.ocrPreview = ocr;
    window.NL.onOcrPreview?.(ocr);
    return ocr;
  };
}

initSolve();
