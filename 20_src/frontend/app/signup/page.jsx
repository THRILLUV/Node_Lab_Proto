"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  AGE_BANDS,
  canSubmitConsent,
  consentProfilePatch,
  consentToggle,
  emptyConsentState,
  nicknameError,
} from "@/lib/nl/consent";
import { LEGAL_MARKETING, LEGAL_PRIVACY, LEGAL_TERMS } from "@/lib/nl/legal-texts";
import {
  fetchSignupRow,
  gateDecision,
  resolveSignupStatus,
  saveSignupProfile,
  writeLocalSignup,
} from "@/lib/nl/signup-gate";

const LEGAL = {
  terms: LEGAL_TERMS,
  privacy: LEGAL_PRIVACY,
  marketing: LEGAL_MARKETING,
};

export default function SignupPage() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [step, setStep] = useState("boot");
  const [consent, setConsent] = useState(emptyConsentState());
  const [nickname, setNickname] = useState("");
  const [ageBand, setAgeBand] = useState(AGE_BANDS[0]);
  const [legalKey, setLegalKey] = useState("");
  const [error, setError] = useState("");
  const nickErr = useMemo(() => (nickname ? nicknameError(nickname) : ""), [nickname]);

  useEffect(() => {
    if (!supabase) {
      setStep("noconfig");
      return undefined;
    }
    let cancelled = false;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    async function boot() {
      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
        window.history.replaceState({}, "", "/signup");
      }
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      const nextSession = data.session;
      setSession(nextSession);
      if (!nextSession?.user) {
        setStep("login");
        return;
      }
      const row = await fetchSignupRow(supabase, nextSession.user.id);
      const status = resolveSignupStatus({ row });
      const gate = gateDecision({ session: nextSession, status });
      if (gate === "enter") {
        router.replace("/welcome");
        return;
      }
      setStep("consent");
    }

    boot();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [router]);

  async function startGoogle() {
    setError("");
    if (!supabase) return;
    const origin = window.location.origin;
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${origin}/auth/callback?next=/signup` },
    });
    if (oauthError) setError(oauthError.message);
  }

  async function refuse() {
    if (supabase) await supabase.auth.signOut();
    router.replace("/");
  }

  async function finishProfile() {
    if (nickErr || !nickname.trim() || !session?.user) return;
    const patch = consentProfilePatch({
      userId: session.user.id,
      nickname: nickname.trim(),
      ageBand,
      marketing: consent.marketing,
    });
    writeLocalSignup(session.user.id, patch, window.localStorage);
    await saveSignupProfile(supabase, patch);
    router.replace("/welcome");
  }

  if (step === "boot") {
    return <main className="nl-shell"><p>불러오는 중…</p></main>;
  }

  if (step === "noconfig") {
    return (
      <main className="nl-shell">
        <h1>환경 변수가 없습니다</h1>
        <p>`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` 를 공식 프로젝트 값으로 넣으세요. 테스트 앱 키를 재사용하지 마세요.</p>
      </main>
    );
  }

  if (step === "login") {
    return (
      <main className="nl-shell">
        <h1>로그인</h1>
        <p>구글 계정으로 계속한 뒤 약관에 동의해야 회원이 됩니다.</p>
        <div className="nl-card">
          <button type="button" onClick={startGoogle}>Google로 계속하기</button>
          {error ? <p className="nl-error">{error}</p> : null}
        </div>
      </main>
    );
  }

  if (step === "nickname") {
    return (
      <main className="nl-shell">
        <h1>별명을 정해 주세요</h1>
        <p>학습 화면에 이 이름으로 보여요. 나중에 마이페이지에서 바꿀 수 있어요.</p>
        <div className="nl-card">
          <div className="nl-field">
            <label htmlFor="nl-nick">별명</label>
            <input id="nl-nick" value={nickname} maxLength={12} onChange={(e) => setNickname(e.target.value)} />
            {nickErr ? <p className="nl-error">{nickErr}</p> : null}
          </div>
          <div className="nl-field">
            <label htmlFor="nl-age">연령대</label>
            <select id="nl-age" value={ageBand} onChange={(e) => setAgeBand(e.target.value)}>
              {AGE_BANDS.map((band) => (
                <option key={band} value={band}>{band}</option>
              ))}
            </select>
          </div>
          <div className="nl-actions">
            <button type="button" disabled={Boolean(nickErr) || nickname.trim().length < 2} onClick={finishProfile}>
              다음
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="nl-shell">
      <h1>NodeLab 이용 약관 동의 수집 안내</h1>
      <p>
        노드랩(이하 ‘회사’)은 서비스 제공을 위해 아래와 같이 귀하의 개인정보를 수집·이용합니다.
        내용을 자세히 읽으신 후 동의해 주시기 바랍니다.
      </p>
      <div className="nl-card">
        <Check
          label="모두 동의합니다."
          checked={consent.terms && consent.privacy && consent.marketing && consent.over14}
          onChange={() => setConsent(consentToggle(consent, "all"))}
        />
        <Check
          label="(필수) 이용약관 동의"
          checked={consent.terms}
          onChange={() => setConsent(consentToggle(consent, "terms"))}
          onLegal={() => setLegalKey(legalKey === "terms" ? "" : "terms")}
        />
        <Check
          label="(필수) 개인정보 수집 및 이용 동의"
          checked={consent.privacy}
          onChange={() => setConsent(consentToggle(consent, "privacy"))}
          onLegal={() => setLegalKey(legalKey === "privacy" ? "" : "privacy")}
        />
        <Check
          label="(선택) 이벤트, 혜택 및 마케팅 알림 받기"
          checked={consent.marketing}
          onChange={() => setConsent(consentToggle(consent, "marketing"))}
          onLegal={() => setLegalKey(legalKey === "marketing" ? "" : "marketing")}
        />
        <Check
          label="만 14세 이상입니다."
          checked={consent.over14}
          onChange={() => setConsent(consentToggle(consent, "over14"))}
        />
        {legalKey ? <pre className="nl-legal">{LEGAL[legalKey]}</pre> : null}
        <p>필수 약관에 동의하지 않으면 서비스 이용이 제한됩니다.</p>
        <div className="nl-actions">
          <button type="button" className="secondary" onClick={refuse}>동의하지 않음</button>
          <button type="button" disabled={!canSubmitConsent(consent)} onClick={() => setStep("nickname")}>
            다음
          </button>
        </div>
      </div>
    </main>
  );
}

function Check({ label, checked, onChange, onLegal }) {
  return (
    <div className="nl-check">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <label>
        {label}
        {onLegal ? (
          <button type="button" className="secondary" style={{ marginLeft: 8, padding: "4px 8px" }} onClick={onLegal}>
            전체보기
          </button>
        ) : null}
      </label>
    </div>
  );
}
