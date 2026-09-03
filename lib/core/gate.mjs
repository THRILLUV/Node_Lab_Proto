const COPY = {
  unreadable: "글자가 잘 안 보여요. 밝은 데서 다시 찍거나 문제 페이지만 올려 주세요.",
  not_math: "이 장은 수학 문제로 안 보여요. 지금은 수능·내신·편입 수학만 봐줄 수 있어요.",
  chat: "이 문제 말고는 수학만 도와줘요.",
  answer_key: "문제 지문이 안 보여요. 문제 쪽이 나오게 올려 주세요.",
  maybe: "수식이 있긴 한데, 수능 수학이 아닐 수 있어요. 수학으로 풀어볼까요?",
};

const OUT_OF_SCOPE = /날씨|자소서|이전 지시|ignore previous|코드 작성|번역해|영어 단어|셀카/i;
const MATH = /[∑∫√×÷≤≥≠∞\\]|정적분|미분|지수|수열|시그마|의 값은|방정식|부등식|함수\s*f|lim_|[0-9]\^|x\^|3\^\{/;
const EXAM_PAPER = /수능|수학영역|미적분|독학사|편입/;

export function classifyGate({ text = "", imageBytes = 0 } = {}) {
  const t = String(text || "").trim();
  if (!t && Number(imageBytes || 0) < 80) {
    return { label: "unreadable", charge: false, message: COPY.unreadable };
  }
  if (OUT_OF_SCOPE.test(t)) {
    return { label: "not_math", charge: false, message: COPY.chat };
  }
  if (EXAM_PAPER.test(t)) {
    return { label: "math_problem", charge: false };
  }
  const answerOnly = t.split(/\n/).filter((line) => /^\s*정답\s*[:：]/.test(line));
  if (answerOnly.length >= 2 && !MATH.test(t)) {
    return { label: "not_math", charge: false, message: COPY.answer_key };
  }
  if (MATH.test(t)) {
    return { label: "math_problem", charge: false };
  }
  if (t && /[가-힣a-zA-Z]/.test(t)) {
    return { label: "not_math", charge: false, message: COPY.not_math };
  }
  if (Number(imageBytes || 0) > 80) {
    return { label: "maybe_math", charge: false, message: COPY.maybe };
  }
  return { label: "unreadable", charge: false, message: COPY.unreadable };
}
