import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { AGE_BANDS } from "../lib/core/consent.mjs";
import { LEGAL_MARKETING, LEGAL_PRIVACY, LEGAL_TERMS } from "../lib/core/legal-texts.mjs";
import {
  ONBOARDING_DONE_CTA,
  ONBOARDING_TITLE,
  SAVE_PROMISE_COPY,
  onboardingQuestions,
} from "../lib/core/onboarding.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const index = readFileSync(join(ROOT, "index.html"), "utf8");
const style = index.split("<style>")[1].split("</style>")[0];
const runtime = readFileSync(join(ROOT, "handoff/mock-runtime.js"), "utf8");

const extraCss = `
.mock-banner{position:sticky;top:0;z-index:200;display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between;padding:8px 12px;background:#1d1d1f;color:#fff;font-size:12px}
.mock-banner strong{font-size:13px}
.mock-banner span{color:rgba(255,255,255,.72)}
.mock-jumps{display:flex;flex-wrap:wrap;gap:6px}
.mock-jumps button{border:0;background:rgba(255,255,255,.12);color:#fff;border-radius:999px;padding:6px 10px;font:inherit;font-size:11px;font-weight:700;cursor:pointer}
.mock-jumps button.on{background:#fff;color:#1d1d1f}
body{overflow:auto}
`;

const payload = {
  AGE_BANDS,
  QUESTIONS: onboardingQuestions(),
  LEGAL: { terms: LEGAL_TERMS, privacy: LEGAL_PRIVACY, marketing: LEGAL_MARKETING },
  ONBOARD_TITLE: ONBOARDING_TITLE,
  SAVE_PROMISE: SAVE_PROMISE_COPY,
  DONE_CTA: ONBOARDING_DONE_CTA,
};

const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>NodeLab 배포본 목업 (인수인계)</title>
<link rel="icon" href="data:,"/>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"/>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700&display=swap"/>
<style>
${style}
${extraCss}
</style>
</head>
<body>
<div class="mock-banner" id="mockBanner">
  <div><strong>NodeLab 배포본 목업</strong> <span>API·구글 로그인 없음. 화면만 클릭해서 보면 됩니다.</span></div>
  <div class="mock-jumps">
    <button type="button" data-jump="landing">랜딩</button>
    <button type="button" data-jump="login">로그인</button>
    <button type="button" data-jump="consent">동의</button>
    <button type="button" data-jump="nickname">별명</button>
    <button type="button" data-jump="onboarding">온보딩</button>
    <button type="button" data-jump="member-home">회원 홈</button>
    <button type="button" data-jump="guest-home">게스트 홈</button>
  </div>
</div>
<div class="public-shell" id="publicShell">
  <section class="public-view landing-view on" id="landingScreen">
    <nav class="public-nav">
      <div class="logo"><span class="dot"></span> NodeLab</div>
      <div class="public-actions">
        <button class="link-btn" id="btn-landing-login" type="button">로그인</button>
      </div>
    </nav>
    <div class="hero">
      <div class="hero-copy">
        <div class="eyebrow">수능 수학 자습 루프</div>
        <h1>새벽에 문제집 풀다 막힐 때,<br/>과외쌤 부르듯 편하게.</h1>
        <p>문제집 PDF를 올리면, 막힌 부분만 콕 짚어줘요.</p>
        <div class="hero-cta">
          <button class="primary-btn" id="btn-start-hero" type="button">바로 시작하기</button>
          <span class="hint">로그인 없이 · 세션당 3문제</span>
        </div>
      </div>
      <div class="hero-card">
        <div class="hero-step"><div class="hero-num">1</div><div><b>문제 가져오기</b><span>PDF 한 권을 올리면 문항별 원문으로 분리</span></div></div>
        <div class="hero-step"><div class="hero-num">2</div><div><b>막힌 곳 찾기</b><span>답 대신 필요한 개념과 힌트만</span></div></div>
        <div class="hero-step"><div class="hero-num">3</div><div><b>한 번 더 해보기</b><span>같은 구조의 응용문제로 바로 확인</span></div></div>
      </div>
    </div>
  </section>
  <section class="public-view login-view" id="loginScreen">
    <div class="login-card">
      <div class="logo"><span class="dot"></span> NodeLab</div>
      <h1>Google 계정 하나면 돼요</h1>
      <p>기록과 오답을 이어서 쓰려면 Google · Kakao · Naver로 들어와 주세요.</p>
      <button class="google-btn" id="btn-google-login" type="button"><span class="google-g">G</span> Google로 계속하기</button>
      <button class="google-btn" id="btn-kakao-login" type="button" disabled style="margin-top:8px">Kakao 준비 중</button>
      <button class="google-btn" id="btn-naver-login" type="button" disabled style="margin-top:8px">Naver 준비 중</button>
      <button class="link-btn" id="btn-back-landing" type="button" style="width:100%">← 처음으로</button>
      <div class="login-note">계속하면 이용약관과 개인정보 처리방침에 동의한 것으로 간주합니다.</div>
    </div>
  </section>
</div>
<div class="app gone" id="appShell">
  <aside class="glass-shell">
    <div class="glass-core">
      <div class="sidebar-inner">
        <div class="brand">
          <div class="logo"><span class="dot"></span> NodeLab</div>
        </div>
        <button class="new-session" type="button"><span>+ 새 자습 세션</span><span class="kbd">⌘N</span></button>
        <div class="menu">
          <button class="item" type="button" data-hub-view="library">라이브러리</button>
          <button class="item" type="button" data-hub-view="wrong">오답노트</button>
        </div>
        <div class="scroll">
          <div class="overline">고정됨</div>
          <div class="overline" style="margin-top:18px">프로젝트</div>
        </div>
        <button class="foot" id="btn-account" type="button" style="border:0;background:transparent;width:100%;cursor:pointer;text-align:left">
          <div style="display:flex;align-items:center;gap:8px"><div class="avatar" id="accountAvatar">게</div><span id="accountName" style="font-size:13px;font-weight:600">게스트</span></div>
          <span style="font-size:12px;color:var(--text-tertiary)">설정</span>
        </button>
      </div>
    </div>
  </aside>
  <main class="glass-shell main">
    <div class="glass-core main-core">
      <section class="home" id="homeScreen">
        <h1>문제 가져오기</h1>
        <div class="composer-shell">
          <div class="composer">
            <textarea id="homeInput" rows="2" placeholder="수학 문제집 PDF를 올리거나, 모르는 문제를 물어보세요..."></textarea>
            <div class="row">
              <div class="left">
                <button class="round" id="btn-attach" type="button" aria-label="파일 첨부">+</button>
                <span style="font-size:13px;color:var(--text-secondary);cursor:pointer" id="lbl-attach">문제지 가져오기</span>
              </div>
              <div class="right">
                <button class="round send" id="btn-home-send" type="button">↑</button>
              </div>
            </div>
          </div>
          <div class="chips">
            <button class="chip" type="button">2026 수능 수학 PDF 업로드</button>
            <button class="chip" type="button">응용문제 집중 훈련</button>
          </div>
        </div>
        <p class="note">올린 원본은 이 세션 안에서만 쓰고, 공용 문제은행으로 재배포하지 않습니다.</p>
      </section>
    </div>
  </main>
</div>
<div class="modal-layer" id="modalLayer" role="dialog" aria-modal="true">
  <div class="modal-card" id="modalContent"></div>
</div>
<div class="toast" id="toast"></div>
<script>
window.NL_MOCK = ${JSON.stringify(payload)};
${runtime}
</script>
</body>
</html>
`;

mkdirSync(join(ROOT, "handoff"), { recursive: true });
writeFileSync(join(ROOT, "handoff/nodelab-deploy-mock.html"), html);
console.log("wrote handoff/nodelab-deploy-mock.html", html.length);
