import { landingCtaAction } from "../lib/core/auth-validate.mjs";
import { JOIN_COPY, shouldPromptJoin, usageSnapshot } from "../lib/core/usage.mjs";

window.NL = window.NL || {};
window.NL.JOIN_COPY = JOIN_COPY;
window.NL.landingCtaAction = landingCtaAction;
window.NL.shouldPromptJoin = shouldPromptJoin;
window.NL.usageSnapshot = usageSnapshot;
