import { cleanRetryState, mockModes, shouldForceNewSession, shuffleMock } from "../lib/core/mock.mjs";

window.NL = window.NL || {};
window.NL.mockModes = mockModes;
window.NL.shuffleMock = shuffleMock;
window.NL.cleanRetryState = cleanRetryState;
window.NL.shouldForceNewSession = shouldForceNewSession;

window.NL.startCleanRetry = async ({ examKey = "2026" } = {}) => {
  const next = cleanRetryState({ examKey });
  window.NL.mockItems = null;
  window.NL.ocrPreview = null;
  window.NL.bus = null;
  if (window.NL.bindStudySession) {
    await window.NL.bindStudySession(examKey, { renew: true, entry: next.entry });
  }
  window.NL.applyCleanRetry?.(next);
  return next;
};
