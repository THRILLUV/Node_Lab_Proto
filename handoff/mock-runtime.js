(function () {
  const AGE_BANDS = window.NL_MOCK.AGE_BANDS;
  const QUESTIONS = window.NL_MOCK.QUESTIONS;
  const LEGAL = window.NL_MOCK.LEGAL;
  const PROFANITY = ["시발", "씨발", "병신", "개새", "새끼", "fuck", "shit"];

  const els = {
    banner: document.getElementById("mockBanner"),
    publicShell: document.getElementById("publicShell"),
    landing: document.getElementById("landingScreen"),
    login: document.getElementById("loginScreen"),
    appShell: document.getElementById("appShell"),
    modal: document.getElementById("modalLayer"),
    modalContent: document.getElementById("modalContent"),
    accountName: document.getElementById("accountName"),
    accountAvatar: document.getElementById("accountAvatar"),
    toast: document.getElementById("toast"),
  };

  const state = {
    consent: { terms: false, privacy: false, marketing: false, over14: false },
    step: "checks",
    doc: "",
    nickname: "",
    ageBand: "",
    onboard: 0,
    answers: {},
    member: false,
  };

  function emptyConsent() {
    return { terms: false, privacy: false, marketing: false, over14: false };
  }

  function allChecked(s) {
    return s.terms && s.privacy && s.marketing && s.over14;
  }

  function canSubmit(s) {
    return s.terms && s.privacy && s.over14;
  }

  function toggle(s, key) {
    if (key === "all") {
      return allChecked(s)
        ? emptyConsent()
        : { terms: true, privacy: true, marketing: true, over14: true };
    }
    return Object.assign({}, s, { [key]: !s[key] });
  }

  function nicknameError(value) {
    const trimmed = String(value || "").trim();
    if (trimmed.length < 2 || trimmed.length > 12) return "별명은 2~12자로 지어 주세요.";
    const lower = trimmed.toLowerCase();
    for (let i = 0; i < PROFANITY.length; i += 1) {
      if (lower.indexOf(PROFANITY[i]) !== -1) return "쓸 수 없는 단어가 들어 있어요.";
    }
    return "";
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function toast(msg) {
    els.toast.textContent = msg;
    els.toast.classList.add("on");
    clearTimeout(toast.t);
    toast.t = setTimeout(function () { els.toast.classList.remove("on"); }, 1600);
  }

  function showPublic(which) {
    els.publicShell.classList.remove("gone");
    els.appShell.classList.add("gone");
    els.landing.classList.toggle("on", which === "landing");
    els.login.classList.toggle("on", which === "login");
    closeModal();
    markJump(which);
  }

  function showApp(member) {
    state.member = Boolean(member);
    els.publicShell.classList.add("gone");
    els.appShell.classList.remove("gone");
    els.accountName.textContent = member ? (state.nickname || "회원") : "게스트";
    els.accountAvatar.textContent = member ? String(state.nickname || "회").slice(0, 1) : "게";
    closeModal();
    markJump(member ? "member-home" : "guest-home");
  }

  function openModal(html) {
    els.modalContent.innerHTML = html;
    els.modal.classList.add("on");
  }

  function closeModal() {
    els.modal.classList.remove("on");
    els.modalContent.innerHTML = "";
  }

  function markJump(id) {
    document.querySelectorAll("[data-jump]").forEach(function (btn) {
      btn.classList.toggle("on", btn.getAttribute("data-jump") === id);
    });
  }

  function renderConsent() {
    const s = state.consent;
    const allOn = allChecked(s);
    const nextOn = canSubmit(s);
    openModal(
      '<div class="signup-consent" data-signup-consent="1">' +
      "<h2>NodeLab 이용 약관 동의 수집 안내</h2>" +
      "<p>노드랩(이하 ‘회사’)은 서비스 제공을 위해 아래와 같이 귀하의 개인정보를 수집·이용합니다. 내용을 자세히 읽으신 후 동의해 주시기 바랍니다.</p>" +
      '<div class="signup-checks">' +
      '<label class="signup-check-row all" data-consent-key="all"><input type="checkbox"' + (allOn ? " checked" : "") + "/>모두 동의합니다.</label>" +
      '<label class="signup-check-row" data-consent-key="terms"><input type="checkbox"' + (s.terms ? " checked" : "") + '/><span>(필수) 서비스 이용약관 동의</span><button class="signup-full-link" type="button" data-signup-full="terms">전체보기</button></label>' +
      '<label class="signup-check-row" data-consent-key="privacy"><input type="checkbox"' + (s.privacy ? " checked" : "") + '/><span>(필수) 개인정보 수집 및 이용 동의</span><button class="signup-full-link" type="button" data-signup-full="privacy">전체보기</button></label>' +
      '<label class="signup-check-row" data-consent-key="marketing"><input type="checkbox"' + (s.marketing ? " checked" : "") + '/><span>(선택) 이벤트, 혜택 및 마케팅 알림 받기</span><button class="signup-full-link" type="button" data-signup-full="marketing">전체보기</button></label>' +
      '<label class="signup-check-row" data-consent-key="over14"><input type="checkbox"' + (s.over14 ? " checked" : "") + "/>만 14세 이상입니다.</label>" +
      "</div>" +
      '<p class="signup-notice">필수 약관에 동의하지 않으면 서비스 이용이 제한됩니다.</p>' +
      '<div class="signup-consent-actions">' +
      '<button class="primary-btn signup-next" type="button" data-signup-next' + (nextOn ? "" : " disabled") + ">다음</button>" +
      '<button class="link-btn" type="button" data-signup-refuse>동의하지 않아요</button>' +
      "</div></div>"
    );
    markJump("consent");
  }

  function renderLegal(doc) {
    const heading = doc === "privacy" ? "개인정보 수집 및 이용" : doc === "marketing" ? "마케팅 알림" : "서비스 이용약관";
    openModal(
      '<div class="signup-consent" data-signup-consent="1">' +
      "<h2>" + heading + "</h2>" +
      '<div class="signup-legal-body">' + escapeHtml(LEGAL[doc] || "") + "</div>" +
      '<div class="modal-actions"><button class="secondary-btn" type="button" data-signup-back>뒤로</button></div></div>'
    );
  }

  function renderProfile() {
    const err = nicknameError(state.nickname);
    const typed = state.nickname.length > 0;
    const canNext = err === "" && Boolean(state.ageBand);
    const bands = AGE_BANDS.map(function (band) {
      const on = state.ageBand === band ? " on" : "";
      return '<button class="secondary-btn signup-age-btn' + on + '" type="button" data-signup-age="' + escapeHtml(band) + '">' + escapeHtml(band) + "</button>";
    }).join("");
    openModal(
      '<div class="signup-consent" data-signup-consent="1">' +
      "<h2>별명을 정해 주세요</h2>" +
      "<p>학습 화면에 이 이름으로 보여요. 나중에 마이페이지에서 바꿀 수 있어요.</p>" +
      '<div class="field"><label>별명</label><input data-signup-nickname maxlength="12" placeholder="2~12자" value="' + escapeHtml(state.nickname) + '"/></div>' +
      '<p class="signup-nick-error">' + (typed && err ? escapeHtml(err) : "") + "</p>" +
      '<div class="field"><label>연령대</label><div class="signup-age-grid">' + bands + "</div></div>" +
      '<div class="signup-consent-actions">' +
      '<button class="primary-btn signup-next" type="button" data-signup-next' + (canNext ? "" : " disabled") + ">다음</button>" +
      '<button class="link-btn" type="button" data-signup-refuse>동의하지 않아요</button>' +
      "</div></div>"
    );
    markJump("nickname");
  }

  function renderOnboarding() {
    if (state.onboard >= QUESTIONS.length) {
      openModal(
        "<h2>맞춤 설정을 저장했어요</h2>" +
        "<p>" + escapeHtml(window.NL_MOCK.SAVE_PROMISE) + "</p>" +
        '<div class="modal-actions"><button class="primary-btn" type="button" data-onboard-done>' +
        escapeHtml(window.NL_MOCK.DONE_CTA) + "</button></div>"
      );
      return;
    }
    const q = QUESTIONS[state.onboard];
    const opts = q.options.map(function (opt, i) {
      return '<button class="secondary-btn" type="button" data-onboard-opt="' + i + '" style="width:100%;margin-top:8px;text-align:left">' + escapeHtml(opt) + "</button>";
    }).join("");
    openModal(
      "<h2>" + escapeHtml(window.NL_MOCK.ONBOARD_TITLE) + "</h2>" +
      "<p>" + escapeHtml(q.prompt) + "</p>" +
      '<p class="note">' + (state.onboard + 1) + " / 5</p>" + opts
    );
    markJump("onboarding");
  }

  function startMemberSignup() {
    state.consent = emptyConsent();
    state.step = "checks";
    state.doc = "";
    state.nickname = "";
    state.ageBand = "";
    state.onboard = 0;
    state.answers = {};
    showPublic("login");
    renderConsent();
  }

  function refuse() {
    closeModal();
    showPublic("landing");
    toast("동의하지 않아 가입하지 않았어요");
  }

  document.getElementById("btn-landing-login").onclick = function () { showPublic("login"); };
  document.getElementById("btn-back-landing").onclick = function () { showPublic("landing"); };
  document.getElementById("btn-start-hero").onclick = function () { showApp(false); };
  document.getElementById("btn-google-login").onclick = function () { startMemberSignup(); };
  document.getElementById("btn-kakao-login").onclick = function () { toast("Kakao는 준비 중이에요"); };
  document.getElementById("btn-naver-login").onclick = function () { toast("Naver는 준비 중이에요"); };
  document.getElementById("btn-account").onclick = function () {
    if (!state.member) {
      toast("게스트는 기록이 남지 않아요");
      return;
    }
    openModal(
      "<h2>회원정보 설정</h2>" +
      '<div class="form-grid"><div class="field"><label>별명</label><input value="' + escapeHtml(state.nickname) + '" readonly/></div>' +
      '<div class="field"><label>이메일</label><input value="demo@users.nodelab.invalid" disabled/></div></div>' +
      '<div class="modal-actions"><button class="secondary-btn" type="button" data-modal-close>닫기</button></div>'
    );
  };
  document.getElementById("btn-home-send").onclick = function () {
    toast("목업이라 PDF·OCR은 동작하지 않아요");
  };
  document.getElementById("btn-attach").onclick = function () {
    toast("목업이라 PDF·OCR은 동작하지 않아요");
  };
  document.getElementById("lbl-attach").onclick = function () {
    toast("목업이라 PDF·OCR은 동작하지 않아요");
  };

  document.querySelectorAll("[data-hub-view]").forEach(function (btn) {
    btn.onclick = function () {
      toast(btn.getAttribute("data-hub-view") === "wrong" ? "오답노트 목업" : "라이브러리 목업");
    };
  });

  document.querySelectorAll("[data-jump]").forEach(function (btn) {
    btn.onclick = function () {
      const id = btn.getAttribute("data-jump");
      if (id === "landing") showPublic("landing");
      if (id === "login") showPublic("login");
      if (id === "consent") startMemberSignup();
      if (id === "nickname") {
        state.consent = { terms: true, privacy: true, marketing: false, over14: true };
        state.step = "profile";
        showPublic("login");
        renderProfile();
      }
      if (id === "onboarding") {
        state.nickname = state.nickname || "별명";
        state.onboard = 0;
        showPublic("login");
        renderOnboarding();
      }
      if (id === "member-home") {
        state.nickname = state.nickname || "별명";
        showApp(true);
      }
      if (id === "guest-home") showApp(false);
    };
  });

  els.modal.onclick = function (e) {
    if (e.target === els.modal) return;
    const full = e.target.closest("[data-signup-full]");
    if (full) {
      e.preventDefault();
      state.step = "legal";
      state.doc = full.getAttribute("data-signup-full");
      renderLegal(state.doc);
      return;
    }
    const key = e.target.closest("[data-consent-key]");
    if (key) {
      state.consent = toggle(state.consent, key.getAttribute("data-consent-key"));
      renderConsent();
      return;
    }
    if (e.target.closest("[data-signup-back]")) {
      state.step = "checks";
      renderConsent();
      return;
    }
    if (e.target.closest("[data-signup-refuse]")) {
      refuse();
      return;
    }
    if (e.target.closest("[data-signup-next]")) {
      if (state.step === "checks" || !state.step) {
        if (!canSubmit(state.consent)) return;
        state.step = "profile";
        renderProfile();
        return;
      }
      if (nicknameError(state.nickname) || !state.ageBand) return;
      state.onboard = 0;
      renderOnboarding();
      return;
    }
    const age = e.target.closest("[data-signup-age]");
    if (age) {
      state.ageBand = age.getAttribute("data-signup-age");
      renderProfile();
      return;
    }
    const opt = e.target.closest("[data-onboard-opt]");
    if (opt) {
      const q = QUESTIONS[state.onboard];
      if (q) state.answers[q.id] = q.options[Number(opt.getAttribute("data-onboard-opt"))];
      state.onboard += 1;
      renderOnboarding();
      return;
    }
    if (e.target.closest("[data-onboard-done]") || e.target.closest("[data-modal-close]")) {
      closeModal();
      if (e.target.closest("[data-onboard-done]")) showApp(true);
    }
  };

  els.modal.addEventListener("input", function (e) {
    const nick = e.target.closest("[data-signup-nickname]");
    if (!nick) return;
    state.nickname = nick.value;
    renderProfile();
    const again = els.modalContent.querySelector("[data-signup-nickname]");
    if (again) {
      again.focus();
      const n = state.nickname.length;
      again.setSelectionRange(n, n);
    }
  });

  showPublic("landing");
})();
