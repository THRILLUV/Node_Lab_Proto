const ledger = new Map();

export function shouldCharge({ gateLabel = "", ocrConfirmed = false } = {}) {
  if (!ocrConfirmed) return false;
  return gateLabel === "math_problem" || gateLabel === "maybe_math";
}

export function usageSnapshot(userKey = "guest", { tier = "free" } = {}) {
  const used = Number(ledger.get(userKey) || 0);
  const limit = String(tier).toLowerCase() === "pro" ? Infinity : 10;
  return { tier, used, limit: limit === Infinity ? null : limit };
}

export function chargeUsage(userKey = "guest", { kind = "ocr_confirm", delta = 1, gateLabel, ocrConfirmed } = {}) {
  if (!shouldCharge({ gateLabel, ocrConfirmed })) {
    return usageSnapshot(userKey);
  }
  ledger.set(userKey, Number(ledger.get(userKey) || 0) + Number(delta || 1));
  return { ...usageSnapshot(userKey), kind };
}

export function resetUsageForTests() {
  ledger.clear();
}
