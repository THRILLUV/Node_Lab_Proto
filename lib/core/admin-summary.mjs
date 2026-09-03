import { supabaseAnonKey, supabaseServiceRole, supabaseUrl } from "./env-names.mjs";

const MEMBER_LIST = [
  { id: "m1", email: "th930531@gmail.com", name: "THRILL UV", joined: "2026-08-12", login: "Google", consents: "서비스 이용, 개인정보", plan: "Free", cycle: "-", nextPay: "-", remain: 7, remainMax: 10, extraCredits: 0, lastPay: "없음", status: "active" },
  { id: "m2", email: "mina.park@gmail.com", name: "박민아", joined: "2026-07-03", login: "Google", consents: "서비스 이용, 개인정보, 마케팅", plan: "Pro", cycle: "월", nextPay: "2026-09-03", remain: "무제한", remainMax: "무제한", extraCredits: 0, lastPay: "2026-08-03 · 12,900원", status: "active" },
  { id: "m3", email: "junseo.lee@naver.com", name: "이준서", joined: "2026-06-18", login: "Google", consents: "서비스 이용, 개인정보", plan: "Pro", cycle: "연", nextPay: "2027-06-18", remain: "무제한", remainMax: "무제한", extraCredits: 0, lastPay: "2026-06-18 · 129,000원", status: "suspended" },
  { id: "m4", email: "hana.choi@gmail.com", name: "최하나", joined: "2026-08-20", login: "Google", consents: "서비스 이용, 개인정보", plan: "Free", cycle: "-", nextPay: "-", remain: 0, remainMax: 10, extraCredits: 0, lastPay: "없음", status: "active" },
  { id: "m5", email: "soyeon.kim@gmail.com", name: "김소연", joined: "2026-05-02", login: "Google", consents: "서비스 이용, 개인정보", plan: "Pro", cycle: "월", nextPay: "2026-09-02", remain: "무제한", remainMax: "무제한", extraCredits: 0, lastPay: "2026-08-02 · 12,900원", status: "active" },
  { id: "m6", email: "donghyun.oh@gmail.com", name: "오동현", joined: "2026-08-25", login: "Google", consents: "서비스 이용, 개인정보", plan: "Free", cycle: "-", nextPay: "-", remain: 10, remainMax: 10, extraCredits: 0, lastPay: "없음", status: "withdrawn" },
  { id: "m7", email: "yujin.han@kakao.com", name: "한유진", joined: "2026-04-11", login: "Google", consents: "서비스 이용, 개인정보, 마케팅", plan: "Pro", cycle: "월", nextPay: "2026-09-11", remain: "무제한", remainMax: "무제한", extraCredits: 0, lastPay: "2026-08-11 · 12,900원", status: "active" },
  { id: "m8", email: "seojun.bae@gmail.com", name: "배서준", joined: "2026-08-27", login: "Google", consents: "서비스 이용, 개인정보", plan: "Free", cycle: "-", nextPay: "-", remain: 9, remainMax: 10, extraCredits: 0, lastPay: "없음", status: "active" },
];

const USAGE_BY_MEMBER = {
  m1: [1200, 980, 1540, 2100, 860, 1320, 1780],
  m2: [4200, 3900, 5100, 4700, 5300, 4100, 4900],
  m3: [0, 0, 800, 0, 0, 0, 0],
  m4: [600, 720, 540, 0, 880, 910, 640],
  m5: [3100, 2800, 3400, 3600, 2900, 3300, 3500],
  m6: [200, 0, 0, 0, 0, 0, 0],
  m7: [2600, 2400, 2700, 2550, 2800, 2500, 2650],
  m8: [400, 350, 520, 480, 610, 390, 450],
};

const CALLS_BY_MEMBER = {
  m1: [4, 3, 5, 6, 2, 4, 5],
  m2: [11, 9, 13, 12, 14, 10, 12],
  m3: [0, 0, 2, 0, 0, 0, 0],
  m4: [2, 2, 1, 0, 3, 3, 2],
  m5: [8, 7, 9, 9, 8, 8, 9],
  m6: [1, 0, 0, 0, 0, 0, 0],
  m7: [7, 6, 7, 7, 8, 6, 7],
  m8: [1, 1, 2, 1, 2, 1, 1],
};

const EXCEPTIONS = [
  { id: "e1", kind: "결제실패", memberId: "m2", title: "정기결제 실패", detail: "한도 초과로 거절됨. 카드번호 원문은 저장하지 않음.", when: "08-28 09:12", status: "대기" },
  { id: "e2", kind: "결제실패", memberId: "m7", title: "정기결제 실패", detail: "결제사에서 거절. 회원에게 재시도 안내만.", when: "08-27 21:04", status: "대기" },
  { id: "e3", kind: "AI오류", memberId: "m1", title: "응용문제 생성 타임아웃", detail: "호출 28초 후 중단. 재시도 가능.", when: "08-28 08:41", status: "대기" },
  { id: "e4", kind: "AI오류", memberId: "m5", title: "호출 제한", detail: "분당 한도 초과. 자동 회복.", when: "08-26 14:18", status: "처리됨" },
  { id: "e5", kind: "결제실패", memberId: "m6", title: "결제 시도 실패", detail: "잔액 부족. 탈퇴 처리 전 기록.", when: "08-25 11:02", status: "처리됨" },
];

const LOGS = [
  { id: "l1", at: "08-27 19:40", actor: "태희", action: "정지", target: "junseo.lee@naver.com", note: "반복 결제실패 3회" },
  { id: "l2", at: "08-26 15:02", actor: "태희", action: "크레딧", target: "th930531@gmail.com", note: "데모 세션 5회 지급" },
  { id: "l3", at: "08-25 16:20", actor: "태희", action: "탈퇴처리", target: "donghyun.oh@gmail.com", note: "회원 요청" },
];

const DAYS = ["08-22", "08-23", "08-24", "08-25", "08-26", "08-27", "08-28"];
const WEEK_JOIN_FROM = "2026-08-22";

function sum(arr) {
  return (arr || []).reduce((a, b) => a + b, 0);
}

function mockTotals() {
  const weekJoin = MEMBER_LIST.filter((m) => m.joined >= WEEK_JOIN_FROM).length;
  const payWait = EXCEPTIONS.filter((e) => e.kind === "결제실패" && e.status === "대기").length;
  const stopped = MEMBER_LIST.filter((m) => m.status === "suspended").length;
  const active = MEMBER_LIST.filter((m) => m.status === "active").length;
  const withdrawn = MEMBER_LIST.filter((m) => m.status === "withdrawn").length;
  const tokens = MEMBER_LIST.reduce((n, m) => n + sum(USAGE_BY_MEMBER[m.id]), 0);
  return { weekJoin, payWait, stopped, active, withdrawn, tokens };
}

const totals = mockTotals();

export const NL_ADMIN_TABLES = {
  members: "nl_profiles",
  sessions: "nl_sessions",
  events: "nl_events",
  billing: "nl_subscriptions",
};

export const ADMIN_MOCK_SUMMARY = {
  source: "mock",
  members: {
    total: MEMBER_LIST.length,
    weekJoin: totals.weekJoin,
    active: totals.active,
    stopped: totals.stopped,
    withdrawn: totals.withdrawn,
    list: MEMBER_LIST,
  },
  billing: {
    payWait: totals.payWait,
    exceptions: EXCEPTIONS.filter((e) => e.kind === "결제실패"),
  },
  usage: {
    tokens: totals.tokens,
    days: DAYS,
    byMember: USAGE_BY_MEMBER,
    calls: CALLS_BY_MEMBER,
  },
  voc: {
    exceptions: EXCEPTIONS,
    logs: LOGS,
  },
};

export function cloneAdminMock() {
  return JSON.parse(JSON.stringify(ADMIN_MOCK_SUMMARY));
}

export function isEmptyAdminTables(data) {
  if (!data || data.source === "mock") return true;
  const members = Number(data.members?.total ?? 0);
  const sessions = Number(data.members?.sessions ?? 0);
  const billing = Number(data.billing?.total ?? 0);
  const events = Number(data.usage?.events ?? 0);
  return members === 0 && sessions === 0 && billing === 0 && events === 0;
}

async function countNlTable({ supabaseUrl, supabaseKey, table, fetchFn }) {
  const base = String(supabaseUrl).replace(/\/$/, "");
  const res = await fetchFn(`${base}/rest/v1/${table}?select=id`, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      Prefer: "count=exact",
      Range: "0-0",
    },
  });
  if (!res || (!res.ok && res.status !== 416)) {
    throw new Error(`count_${table}`);
  }
  const cr = res.headers?.get?.("content-range") || res.headers?.get?.("Content-Range") || "";
  const n = Number(String(cr.split("/")[1] || "").trim());
  if (!Number.isFinite(n)) throw new Error(`count_${table}`);
  return n;
}

export async function readNlCounts({
  supabaseUrl,
  supabaseKey,
  fetchFn = globalThis.fetch,
} = {}) {
  if (!supabaseUrl || !supabaseKey || !fetchFn) throw new Error("supabase_env");
  const [profiles, sessions, events, billing] = await Promise.all([
    countNlTable({ supabaseUrl, supabaseKey, table: NL_ADMIN_TABLES.members, fetchFn }),
    countNlTable({ supabaseUrl, supabaseKey, table: NL_ADMIN_TABLES.sessions, fetchFn }),
    countNlTable({ supabaseUrl, supabaseKey, table: NL_ADMIN_TABLES.events, fetchFn }),
    countNlTable({ supabaseUrl, supabaseKey, table: NL_ADMIN_TABLES.billing, fetchFn }),
  ]);
  return {
    source: "live",
    members: { total: profiles, sessions },
    billing: { total: billing },
    usage: { events },
    voc: { total: 0 },
  };
}

export async function adminSummaryPayload({
  headerKey = "",
  env = {},
  fetchFn = globalThis.fetch,
} = {}) {
  const expected = env.NL_ADMIN_KEY || "";
  if (!expected || String(headerKey) !== String(expected)) {
    return { status: 401, body: { error: "unauthorized" } };
  }
  try {
    const live = await readNlCounts({
      supabaseUrl: supabaseUrl(env),
      supabaseKey: supabaseServiceRole(env) || supabaseAnonKey(env),
      fetchFn,
    });
    if (isEmptyAdminTables(live)) {
      return { status: 200, body: cloneAdminMock(), mock: true };
    }
    return { status: 200, body: live };
  } catch {
    return { status: 200, body: cloneAdminMock(), mock: true };
  }
}

export async function loadAdminSummary({ fetchFn, key } = {}) {
  const fetchImpl = fetchFn || globalThis.fetch;
  if (!fetchImpl) return cloneAdminMock();
  try {
    const headers = {};
    if (key) headers["x-nl-admin-key"] = key;
    const res = await fetchImpl("/api/admin/summary", { method: "GET", headers });
    if (!res || res.status === 401 || !res.ok) return cloneAdminMock();
    const data = await res.json();
    if (!data || data.source === "mock" || isEmptyAdminTables(data)) return cloneAdminMock();
    return {
      source: "live",
      members: data.members,
      billing: data.billing,
      usage: data.usage,
      voc: data.voc,
    };
  } catch {
    return cloneAdminMock();
  }
}
