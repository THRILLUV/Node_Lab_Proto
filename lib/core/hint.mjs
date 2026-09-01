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

export function buildHint({ choice, itemIndex = 1, lines = [] } = {}) {
  const kind = CHOICE_ALIAS[String(choice)] || "ask";
  if (kind === "score") {
    return {
      style: "score",
      message: "답은 확인했어요. 막힌 줄만 같이 볼까요?",
    };
  }
  if (kind === "concept") {
    return {
      style: "concept",
      message:
        "지수법칙은 밑(아래 숫자)을 똑같이 맞춘 뒤 지수를 더하면 끝나요. 그럼 가볍게 한 칸만 확인해 볼까요? $9^{1/4}$을 3의 거듭제곱으로 바꾸면?",
    };
  }
  if (kind === "hand") {
    const step = lines?.[1]?.step || 2;
    return {
      style: "hand",
      message: `${step}번째 줄에서 지수를 더할 때 부호가 바뀌었어요. $3^{1/2}\\times 3^{-1/2}=3^{0}=1$로 다시 계산해 볼까요?`,
      error_step_index: step,
      evidence_quote: lines?.[1]?.latex || "",
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
