/* drop-in copy of lib/core/consent.mjs — keep in sync via scripts/sync-nl-frontend-lib.mjs */
export const AGE_BANDS = [
  "14–16세",
  "17–19세",
  "20–24세",
  "25–29세",
  "30–39세",
  "40세 이상",
];

const PROFANITY = ["시발", "씨발", "병신", "개새", "새끼", "fuck", "shit"];

export function emptyConsentState() {
  return { terms: false, privacy: false, marketing: false, over14: false };
}

export function consentToggle(state, key) {
  if (key === "all") {
    if (allChecked(state)) {
      return emptyConsentState();
    }
    return { terms: true, privacy: true, marketing: true, over14: true };
  }
  return { ...state, [key]: !state[key] };
}

export function allChecked(state) {
  return state.terms && state.privacy && state.marketing && state.over14;
}

export function canSubmitConsent(state) {
  return state.terms && state.privacy && state.over14;
}

export function nicknameError(value) {
  const trimmed = value.trim();
  if (trimmed.length < 2 || trimmed.length > 12) {
    return "별명은 2~12자로 지어 주세요.";
  }
  const lower = trimmed.toLowerCase();
  for (const word of PROFANITY) {
    if (lower.includes(word.toLowerCase())) {
      return "쓸 수 없는 단어가 들어 있어요.";
    }
  }
  return "";
}

export function consentProfilePatch({ userId, nickname, ageBand, marketing }) {
  if (!userId) {
    throw new Error("userId required");
  }
  return {
    id: userId,
    nickname,
    age_band: ageBand,
    over14: true,
    terms_version: "v0.1",
    privacy_version: "v0.1",
    marketing_opt_in: Boolean(marketing),
    consented_at: new Date().toISOString(),
  };
}

export function hasCompletedSignup(row) {
  if (!row) {
    return false;
  }
  return Boolean(row.terms_version && row.privacy_version && row.nickname);
}

export function signupStorageKey(userId) {
  return "nl_signup:" + userId;
}
