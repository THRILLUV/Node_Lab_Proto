import { landingCtaAction, shouldEnterApp } from "../lib/core/auth-validate.mjs";
import { identityFromSession, emptyIntroState } from "../lib/core/identity.mjs";
import {
  ONBOARDING_TITLE,
  SAVE_PROMISE_COPY,
  onboardingCompletePayload,
  onboardingQuestions,
  onboardingStorageKey,
  shouldShowMemberOnboarding,
} from "../lib/core/onboarding.mjs";
import { persistOnboarding } from "../lib/core/persist.mjs";
import { readLocalSignup, writeLocalSignup, saveSignupProfile } from "../lib/core/signup-gate.mjs";
import { JOIN_COPY, consumeVisit, shouldPromptJoin, studentPlanName, usageBarView, usageSnapshot, visitSnapshot } from "../lib/core/usage.mjs";

window.NL = window.NL || {};
window.NL.JOIN_COPY = JOIN_COPY;
window.NL.landingCtaAction = landingCtaAction;
window.NL.shouldEnterApp = shouldEnterApp;
window.NL.identityFromSession = identityFromSession;
window.NL.emptyIntroState = emptyIntroState;
window.NL.shouldPromptJoin = shouldPromptJoin;
window.NL.usageSnapshot = usageSnapshot;
window.NL.visitSnapshot = visitSnapshot;
window.NL.consumeVisit = consumeVisit;
window.NL.usageBarView = usageBarView;
window.NL.studentPlanName = studentPlanName;
window.NL.ONBOARDING_TITLE = ONBOARDING_TITLE;
window.NL.SAVE_PROMISE_COPY = SAVE_PROMISE_COPY;
window.NL.onboardingQuestions = onboardingQuestions;
window.NL.onboardingCompletePayload = onboardingCompletePayload;
window.NL.onboardingStorageKey = onboardingStorageKey;
window.NL.shouldShowMemberOnboarding = shouldShowMemberOnboarding;
window.NL.persistOnboarding = persistOnboarding;
window.NL.readLocalSignup = readLocalSignup;
window.NL.writeLocalSignup = writeLocalSignup;
window.NL.saveSignupProfile = saveSignupProfile;
