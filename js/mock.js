import { cleanRetryState, mockModes, shouldForceNewSession, shuffleMock } from "../lib/core/mock.mjs";
import { applyRemoteVariant, buildVariantSet, mockVariantPlan, plateKind, railHint } from "../lib/core/variant.mjs";

window.NL = window.NL || {};
window.NL.mockModes = mockModes;
window.NL.shuffleMock = shuffleMock;
window.NL.cleanRetryState = cleanRetryState;
window.NL.shouldForceNewSession = shouldForceNewSession;
window.NL.mockVariantPlan = mockVariantPlan;
window.NL.plateKind = plateKind;
window.NL.railHint = railHint;

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

window.NL.startVariantMock = async ({ examKey = "2026", plan = "Free", items = [] } = {}) => {
  const cfg = await fetch("/api/config")
    .then((r) => r.json())
    .catch(() => ({}));
  const next = mockVariantPlan({
    plan,
    hasGenKey: Boolean(cfg.gemini || cfg.opencode),
  });
  let bank = buildVariantSet(items, { count: next.count });
  if (next.source === "variant") {
    bank = await Promise.all(
      bank.map(async (it) => {
        try {
          const res = await fetch("/api/variant", {
            method: "POST",
            headers: { "content-type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ item_index: it.n }),
          });
          if (!res.ok) return it;
          return applyRemoteVariant(it, await res.json());
        } catch {
          return it;
        }
      }),
    );
  }
  window.NL.mockItems = bank;
  window.NL.ocrPreview = null;
  window.NL.bus = null;
  if (window.NL.bindStudySession) {
    await window.NL.bindStudySession(examKey, { renew: true, entry: "mock" });
  }
  window.NL.applyVariantMock?.({
    examKey,
    mockMode: 3,
    mockOrder: bank.map((it) => it.n),
    visibleTabs: next.count,
    currentQ: bank[0]?.n || 1,
    phase: "prompt",
    pick: null,
    hinted: false,
    ocrPreview: null,
    hintMessage: "",
  });
  return { ...next, items: bank };
};
