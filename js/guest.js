import { landingCtaAction, shouldEnterApp } from "../lib/core/auth-validate.mjs";
import { identityFromSession, emptyIntroState } from "../lib/core/identity.mjs";
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
