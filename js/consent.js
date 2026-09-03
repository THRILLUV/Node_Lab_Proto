import {
  emptyConsentState,
  consentToggle,
  allChecked,
  canSubmitConsent,
} from "../lib/core/consent.mjs";
import { LEGAL_TERMS, LEGAL_PRIVACY, LEGAL_MARKETING } from "../lib/core/legal-texts.mjs";

window.NL = window.NL || {};
window.NL.emptyConsentState = emptyConsentState;
window.NL.consentToggle = consentToggle;
window.NL.allChecked = allChecked;
window.NL.canSubmitConsent = canSubmitConsent;
window.NL.LEGAL_TERMS = LEGAL_TERMS;
window.NL.LEGAL_PRIVACY = LEGAL_PRIVACY;
window.NL.LEGAL_MARKETING = LEGAL_MARKETING;
