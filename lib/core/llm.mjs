import { geminiVision } from "./gemini.mjs";

export function parseModelJson(text) {
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

export function hasVisionKey(env = process.env) {
  return Boolean(
    env.GEMINI_API_KEY ||
      env.GOOGLE_API_KEY ||
      env.HF_TOKEN ||
      env.HUGGING_FACE_HUB_TOKEN ||
      env.OPENCODE_API_KEY,
  );
}

export function hasTextKey(env = process.env) {
  return Boolean(
    env.GEMINI_API_KEY ||
      env.GOOGLE_API_KEY ||
      env.OPENCODE_API_KEY ||
      env.HF_TOKEN ||
      env.HUGGING_FACE_HUB_TOKEN,
  );
}

export async function geminiText({ prompt, env = process.env } = {}) {
  const key = env.GEMINI_API_KEY || env.GOOGLE_API_KEY || "";
  if (!key) return null;
  const models = [env.GEMINI_MODEL || "gemini-3.7-flash", "gemini-2.5-flash", "gemini-2.0-flash"];
  let lastErr = "";
  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2 },
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
  return lastErr ? { error: lastErr } : null;
}

export async function openAiChat({ prompt, imageB64, env = process.env } = {}) {
  const base = String(env.LLM_BASE_URL || env.HF_CHAT_URL || "").replace(/\/$/, "");
  const key = env.OPENCODE_API_KEY || env.HF_TOKEN || env.HUGGING_FACE_HUB_TOKEN || "";
  if (!base || !key) return null;
  const model = env.LLM_MODEL_GEN || "glm-5-free";
  const url = imageB64
    ? [
        { type: "text", text: prompt },
        {
          type: "image_url",
          image_url: {
            url: String(imageB64).startsWith("data:") ? imageB64 : `data:image/jpeg;base64,${imageB64}`,
          },
        },
      ]
    : prompt;
  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [{ role: "user", content: url }],
      }),
    });
    if (!res.ok) return { error: await res.text() };
    const json = await res.json();
    const textOut = json?.choices?.[0]?.message?.content || "";
    const parsed = parseModelJson(textOut);
    return parsed ? { ...parsed, model, mock: false } : { error: "parse_failed" };
  } catch (err) {
    return { error: String(err?.message || err) };
  }
}

export async function hfVision({ imageB64, text = "", env = process.env } = {}) {
  const key = env.HF_TOKEN || env.HUGGING_FACE_HUB_TOKEN || "";
  if (!key || !imageB64) return null;
  const model = env.HF_VISION_MODEL || "Qwen/Qwen2.5-VL-7B-Instruct";
  const prompt = `손글씨 수학 풀이를 읽어요. JSON만 답하세요.
{"label":"math_problem|maybe_math|not_math|unreadable","lines":[{"step":1,"latex":"..."}],"confidence":0.0}
규칙: CAT 코드 금지. 수식은 LaTeX. 글자가 없으면 unreadable.
부가텍스트: ${text || "(없음)"}`;
  return openAiChat({
    prompt,
    imageB64,
    env: {
      ...env,
      LLM_BASE_URL: env.HF_CHAT_URL || "https://router.huggingface.co/v1",
      OPENCODE_API_KEY: key,
      LLM_MODEL_GEN: model,
    },
  });
}

export async function readHandwriting({ imageB64, text = "", env = process.env } = {}) {
  const g = await geminiVision({ imageB64, text, purpose: "ocr" });
  if (Array.isArray(g?.lines) && g.lines.length) return g;
  const hf = await hfVision({ imageB64, text, env });
  if (Array.isArray(hf?.lines) && hf.lines.length) return hf;
  return g || hf || { error: "vision_unavailable" };
}

export function composeHintPrompt({ stem = "", lines = [], choice = "hand" } = {}) {
  return `학생 수학 첨삭. JSON만 답하세요.
{"style":"${choice}","message":"사람말 한두 문장","error_step_index":2}
규칙: CAT_ 금지. 정답 숫자를 먼저 말하지 말 것. 제출한 줄을 짚을 것.
문항: ${stem || "(없음)"}
줄: ${JSON.stringify(lines)}`;
}

export async function completeHint({ stem, lines, choice, env = process.env } = {}) {
  const prompt = composeHintPrompt({ stem, lines, choice });
  const g = await geminiText({ prompt, env });
  if (g?.message) return g;
  const oa = await openAiChat({ prompt, env });
  if (oa?.message) return oa;
  return g || oa || null;
}

export function composeVariantPrompt({ stem = "", choices = [] } = {}) {
  return `같은 유형, 숫자만 바꾼 객관식 한 문항. JSON만.
{"stem":"...","choices":["","","","",""]}
규칙: CAT_ 금지. 원문과 식이 달라야 함. 정답 숫자는 넣지 말 것.
원문: ${stem}
보기: ${JSON.stringify(choices)}`;
}
