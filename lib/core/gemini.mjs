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
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
  if (!key) return null;
  const models = [
    process.env.GEMINI_MODEL || "gemini-3.7-flash",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
  ];
  const { mime, data } = stripDataUrl(imageB64);
  const prompt =
    purpose === "ocr"
      ? `손글씨 수학 풀이를 읽어요. JSON만 답하세요.
{"label":"math_problem|maybe_math|not_math|unreadable","lines":[{"step":1,"latex":"..."}],"confidence":0.0}
규칙: CAT 코드 금지. 수식은 LaTeX. 글자가 없으면 unreadable. 수학이 아니면 not_math.
부가텍스트: ${text || "(없음)"}`
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
