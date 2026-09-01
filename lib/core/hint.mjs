const CHOICE_ALIAS = {
  score: "score",
  "1": "score",
  concept: "concept",
  "2": "concept",
  hand: "hand",
  "3": "hand",
  variant: "variant",
  "4": "variant",
  ask: "ask",
  "5": "ask",
};

export function buildHint({ choice, itemIndex = 1, lines = [], stem = "" } = {}) {
  const kind = CHOICE_ALIAS[String(choice)] || "ask";
  const liveLines = Array.isArray(lines) ? lines : [];
  const stemBit = String(stem || "").replace(/\s+/g, " ").trim().slice(0, 48);
  if (kind === "score") {
    return {
      style: "score",
      message: stemBit
        ? `답은 확인했어요. 「${stemBit}」에서 막힌 줄만 같이 볼까요?`
        : "답은 확인했어요. 막힌 줄만 같이 볼까요?",
    };
  }
  if (kind === "concept") {
    return {
      style: "concept",
      message: stemBit
        ? `이 문항은 「${stemBit}」예요. 조건에 나온 기호를 한 줄로 다시 써 보면 길이 보여요. 정답 숫자는 먼저 말하지 않을게요.`
        : "조건에 나온 기호를 한 줄로 다시 써 보면 길이 보여요. 정답 숫자는 먼저 말하지 않을게요.",
    };
  }
  if (kind === "hand") {
    const step = liveLines[1]?.step || liveLines[0]?.step || 2;
    const latex = liveLines[1]?.latex || liveLines[0]?.latex || "";
    return {
      style: "hand",
      message: latex
        ? `${step}번째 줄 · $${latex}$ 을 다시 계산해 볼까요? 정답은 아직 말하지 않을게요.`
        : `${step}번째 줄을 다시 보면 좋아요. 정답은 아직 말하지 않을게요.`,
      error_step_index: step,
      evidence_quote: latex,
    };
  }
  if (kind === "variant") {
    return {
      style: "variant",
      message: "같은 구조로 숫자만 바꾼 문제를 하나 꺼내둘게요.",
    };
  }
  return {
    style: "ask",
    message: "이 문제에 대해서만 편하게 물어보세요. 손풀이 사진이 있으면 더 정확히 봐줄 수 있어요.",
    item_index: itemIndex,
  };
}

export function normalizeChoice(choice) {
  return CHOICE_ALIAS[String(choice)] || null;
}
