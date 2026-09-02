const FLASH_FALLBACKS = ["gemini-3.7-flash", "gemini-3.6-flash", "gemini-3.5-flash"];

export function geminiModels(env = process.env) {
  const preferred = String(env.GEMINI_MODEL || FLASH_FALLBACKS[0]).trim() || FLASH_FALLBACKS[0];
  return [preferred, ...FLASH_FALLBACKS.filter((name) => name !== preferred)];
}

export function splitPrompt() {
  return `이 시험지 사진에서 수학 문항 박스만 찾아 JSON만 답하세요.
{"items":[{"n":1,"bbox":{"x":0,"y":0,"w":1,"h":1},"skip":""}],"truncated":false}
bbox는 페이지 대비 0~1. 수학이 아니면 skip="not_math". CAT 코드 금지.`;
}

export function splitKeyForGuest(env = process.env) {
  return String(env.GOOGLE_FREE_TIER_KEY || "").trim();
}

function stripDataUrl(imageB64 = "") {
  const m = String(imageB64).match(/^data:([^;]+);base64,(.+)$/);
  if (m) return { mime: m[1], data: m[2] };
  return { mime: "image/jpeg", data: String(imageB64).replace(/\s/g, "") };
}

function parseModelJson(text) {
  const raw = String(text || "").trim();
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fence ? fence[1] : raw;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start < 0 || end < 0) return null;
  try {
    return JSON.parse(body.slice(start, end + 1));
  } catch {
    return null;
  }
}

export async function geminiVision({ imageB64, text = "", purpose = "ocr" } = {}) {
  const key =
    purpose === "split"
      ? splitKeyForGuest(process.env)
      : process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
  if (!key) return null;
  const models = geminiModels(process.env);
  const { mime, data } = stripDataUrl(imageB64);
  const prompt =
    purpose === "ocr"
      ? `손글씨 수학 풀이를 읽어요. JSON만 답하세요.
{"label":"math_problem|maybe_math|not_math|unreadable","lines":[{"step":1,"latex":"..."}],"confidence":0.0}
규칙: CAT 코드 금지. 수식은 LaTeX. 글자가 없으면 unreadable. 수학이 아니면 not_math.
부가텍스트: ${text || "(없음)"}`
      : purpose === "split"
        ? splitPrompt()
        : text;

  let lastErr = "";
  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: data
                ? [{ text: prompt }, { inline_data: { mime_type: mime, data } }]
                : [{ text: prompt }],
            },
          ],
          generationConfig: { temperature: 0.1 },
        }),
      });
      if (!res.ok) {
        lastErr = await res.text();
        continue;
      }
      const json = await res.json();
      const textOut = json?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "";
      const parsed = parseModelJson(textOut);
      if (parsed) return { ...parsed, model, mock: false };
    } catch (err) {
      lastErr = String(err?.message || err);
    }
  }
  return { error: lastErr || "gemini_unavailable" };
}
