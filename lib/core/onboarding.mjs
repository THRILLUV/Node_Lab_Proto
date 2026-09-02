export const ONBOARDING_TITLE = "딱 30초면 맞춤 설정이 끝나요";
export const SAVE_PROMISE_COPY = "기록과 오답을 다음 세션에 연결할게요";
export const ONBOARDING_DONE_CTA = "첫 문제 시작하기";

const QUESTIONS = [
  {
    id: "exam_track",
    prompt: "어떤 시험을 준비하고 있어요?",
    options: ["2026 수능 홀수", "2026 수능 짝수", "내신", "편입", "독학사"],
  },
  {
    id: "target_band",
    prompt: "목표 구간이 어디예요?",
    options: ["1등급", "2등급", "3등급", "4등급 이하", "아직 모르겠어요"],
  },
  {
    id: "initial_pain_point",
    prompt: "지금 제일 막히는 건 뭐예요?",
    options: [
      "개념이 안 잡혀요",
      "계산에서 자주 틀려요",
      "응용 문제가 어려워요",
      "시간 안에 못 풀어요",
      "손풀이를 점검받고 싶어요",
    ],
  },
  {
    id: "volume",
    prompt: "오늘은 얼마나 풀 생각이에요?",
    options: ["1~3문제", "한 단원", "한 세트", "막힐 때만", "아직 모르겠어요"],
  },
  {
    id: "tutor_mode",
    prompt: "어떻게 도와드리면 좋아요?",
    options: ["답만 빠르게", "개념부터", "손풀이 봐주기", "비슷한 문제", "알아서 맞춰 줘요"],
  },
];

export function onboardingQuestions() {
  return QUESTIONS.map((q) => ({ ...q, options: q.options.slice() }));
}

export function shouldShowMemberOnboarding({ guest = false, onboarded = false } = {}) {
  if (guest) return false;
  return !onboarded;
}

export function onboardingCompletePayload(answers = {}) {
  return {
    exam_kind: String(answers.exam_track || ""),
    intent: String(answers.initial_pain_point || ""),
    input_type: String(answers.tutor_mode || ""),
  };
}

export function onboardingProfilePatch(answers = {}) {
  return {
    exam_track: String(answers.exam_track || ""),
    tutor_mode: String(answers.tutor_mode || ""),
  };
}

export function onboardingStorageKey(userId) {
  return `nl_onboarded:${String(userId || "")}`;
}
