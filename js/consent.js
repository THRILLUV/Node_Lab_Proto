import {
  emptyConsentState,
  consentToggle,
  allChecked,
  canSubmitConsent,
  AGE_BANDS,
  nicknameError,
} from "../lib/core/consent.mjs";
import { LEGAL_TERMS, LEGAL_PRIVACY, LEGAL_MARKETING } from "../lib/core/legal-texts.mjs";

window.NL = window.NL || {};
window.NL.emptyConsentState = emptyConsentState;
window.NL.consentToggle = consentToggle;
window.NL.allChecked = allChecked;
window.NL.canSubmitConsent = canSubmitConsent;
window.NL.AGE_BANDS = AGE_BANDS;
window.NL.nicknameError = nicknameError;
window.NL.LEGAL_TERMS = LEGAL_TERMS;
window.NL.LEGAL_PRIVACY = LEGAL_PRIVACY;
window.NL.LEGAL_MARKETING = LEGAL_MARKETING;
