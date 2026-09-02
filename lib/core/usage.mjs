const ledger = new Map();
const visitLedger = new Map();

export const JOIN_COPY = "여기서부터는 무료 가입하고 이어 풀 수 있어요.";
export const GUEST_VISIT_UPLOADS = 3;
export const GUEST_VISIT_HANDWRITING = 1;

function visitRow(userKey) {
  const existing = visitLedger.get(userKey);
  if (existing) return existing;
  const row = { uploads: 0, handwriting: 0 };
  visitLedger.set(userKey, row);
  return row;
}

function resolveTier(userKey, tier) {
  if (tier) return String(tier).toLowerCase();
  return userKey === "guest" ? "guest" : "free";
}

function limitFor(tier) {
  if (tier === "pro") return Infinity;
  if (tier === "guest") return 3;
  return 10;
}

export function shouldCharge({ gateLabel = "", ocrConfirmed = false } = {}) {
  if (!ocrConfirmed) return false;
  return gateLabel === "math_problem" || gateLabel === "maybe_math";
}

export function usageSnapshot(userKey = "guest", { tier } = {}) {
  const resolved = resolveTier(userKey, tier);
  const used = Number(ledger.get(userKey) || 0);
  const limit = limitFor(resolved);
  return { tier: resolved, used, limit: limit === Infinity ? null : limit };
}

export function shouldPromptJoin({
  tier = "guest",
  used = 0,
  itemIndex,
  variantCount = 0,
  uploadCount,
  handwritingCount,
  action,
} = {}) {
  if (String(tier).toLowerCase() !== "guest") return false;
  if (Number(itemIndex) >= 4) return true;
  if (Number(used) >= 3) return true;
  if (Number(variantCount) >= 2) return true;
  if (action === "upload" && Number(uploadCount) >= GUEST_VISIT_UPLOADS) return true;
  if (action === "handwriting" && Number(handwritingCount) >= GUEST_VISIT_HANDWRITING) return true;
  return false;
}

export function visitSnapshot(userKey = "guest") {
  const row = visitRow(userKey);
  return { uploads: row.uploads, handwriting: row.handwriting };
}

export function consumeVisit(userKey = "guest", {
  kind,
  gateLabel = "",
  tier,
} = {}) {
  const resolved = resolveTier(userKey, tier);
  const row = visitRow(userKey);
  if (kind === "upload") {
    if (gateLabel === "not_math" || gateLabel === "unreadable") {
      return { uploads: row.uploads, handwriting: row.handwriting, kind, charged: false };
    }
    if (shouldPromptJoin({
      tier: resolved,
      uploadCount: row.uploads,
      action: "upload",
    })) {
      return {
        uploads: row.uploads,
        handwriting: row.handwriting,
        kind,
        blocked: true,
        join: true,
        copy: JOIN_COPY,
      };
    }
    row.uploads += 1;
    return { uploads: row.uploads, handwriting: row.handwriting, kind };
  }
  if (kind === "handwriting") {
    if (shouldPromptJoin({
      tier: resolved,
      handwritingCount: row.handwriting,
      action: "handwriting",
    })) {
      return {
        uploads: row.uploads,
        handwriting: row.handwriting,
        kind,
        blocked: true,
        join: true,
        copy: JOIN_COPY,
      };
    }
    row.handwriting += 1;
    return { uploads: row.uploads, handwriting: row.handwriting, kind };
  }
  return { uploads: row.uploads, handwriting: row.handwriting, kind };
}

export function chargeUsage(userKey = "guest", {
  kind = "ocr_confirm",
  delta = 1,
  gateLabel,
  ocrConfirmed,
  tier,
  itemIndex,
  variantCount,
} = {}) {
  const resolved = resolveTier(userKey, tier);
  if (!shouldCharge({ gateLabel, ocrConfirmed })) {
    return usageSnapshot(userKey, { tier: resolved });
  }
  const before = usageSnapshot(userKey, { tier: resolved });
  if (shouldPromptJoin({
    tier: resolved,
    used: before.used,
    itemIndex,
    variantCount,
  })) {
    return { ...before, kind, blocked: true, join: true, copy: JOIN_COPY };
  }
  ledger.set(userKey, Number(ledger.get(userKey) || 0) + Number(delta || 1));
  return { ...usageSnapshot(userKey, { tier: resolved }), kind };
}

export function resetUsageForTests() {
  ledger.clear();
  visitLedger.clear();
}
