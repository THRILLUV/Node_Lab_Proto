import { geminiModels, geminiVision } from "./gemini.mjs";

export const OPENCODE_GEN_DEFAULT = "deepseek-v4-flash-free";
const OPENCODE_GEN_FALLBACKS = ["deepseek-v4-flash-free", "muse-spark-1.2-contributor-free"];

export function opencodeModels(env = process.env) {
  const preferred = String(env.LLM_MODEL_GEN || OPENCODE_GEN_DEFAULT).trim() || OPENCODE_GEN_DEFAULT;
  return [preferred, ...OPENCODE_GEN_FALLBACKS.filter((name) => name !== preferred)];
}

export function opencodePath(model) {
  return /muse-spark/i.test(String(model || "")) ? "/responses" : "/chat/completions";
}

export function extractChatText(json) {
  const choice = json?.choices?.[0]?.message?.content;
  if (typeof choice === "string" && choice) return choice;
  if (typeof json?.output_text === "string" && json.output_text) return json.output_text;
  const parts = [];
  for (const item of json?.output || []) {
    for (const chunk of item?.content || []) {
      if (typeof chunk?.text === "string") parts.push(chunk.text);
    }
  }
  return parts.join("");
}

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
  const models = geminiModels(env);
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

function chatContent(prompt, imageB64) {
  if (!imageB64) return prompt;
  return [
    { type: "text", text: prompt },
    {
      type: "image_url",
      image_url: {
        url: String(imageB64).startsWith("data:") ? imageB64 : `data:image/jpeg;base64,${imageB64}`,
      },
    },
  ];
}

function zenBase(base) {
  return /opencode\.ai/i.test(String(base || ""));
}

export async function openAiChat({ prompt, imageB64, env = process.env } = {}) {
  const key = env.OPENCODE_API_KEY || env.HF_TOKEN || env.HUGGING_FACE_HUB_TOKEN || "";
  const base = String(
    env.LLM_BASE_URL || env.HF_CHAT_URL || (env.OPENCODE_API_KEY ? "https://opencode.ai/zen/v1" : ""),
  ).replace(/\/$/, "");
  if (!base || !key) return null;
  const models = zenBase(base) ? opencodeModels(env) : [env.LLM_MODEL_GEN || OPENCODE_GEN_DEFAULT];
  const content = chatContent(prompt, imageB64);
  let lastErr = "";
  for (const model of models) {
    const path = zenBase(base) ? opencodePath(model) : "/chat/completions";
    const body =
      path === "/responses"
        ? { model, temperature: 0.2, input: typeof content === "string" ? content : prompt }
        : { model, temperature: 0.2, messages: [{ role: "user", content }] };
    try {
      const res = await fetch(`${base}${path}`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${key}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        lastErr = await res.text();
        continue;
      }
      const json = await res.json();
      const textOut = extractChatText(json);
      const parsed = parseModelJson(textOut);
      if (parsed) return { ...parsed, model, mock: false };
      lastErr = "parse_failed";
    } catch (err) {
      lastErr = String(err?.message || err);
    }
  }
  return lastErr ? { error: lastErr } : null;
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
  const oa = await openAiChat({ prompt, env });
  if (oa?.message) return oa;
  const g = await geminiText({ prompt, env });
  if (g?.message) return g;
  return oa || g || null;
}

export function composeVariantPrompt({ stem = "", choices = [] } = {}) {
  return `같은 유형, 숫자만 바꾼 객관식 한 문항. JSON만.
{"stem":"...","choices":["","","","",""]}
규칙: CAT_ 금지. 원문과 식이 달라야 함. 정답 숫자는 넣지 말 것.
원문: ${stem}
보기: ${JSON.stringify(choices)}`;
}
