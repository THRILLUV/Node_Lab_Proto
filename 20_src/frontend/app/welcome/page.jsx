"use client";

import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  ONBOARDING_DONE_CTA,
  ONBOARDING_TITLE,
  SAVE_PROMISE_COPY,
  onboardingProfilePatch,
  onboardingQuestions,
} from "@/lib/nl/onboarding";

export default function WelcomePage() {
  const questions = useMemo(() => onboardingQuestions(), []);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const current = questions[index];
  const done = index >= questions.length;

  async function pick(option) {
    const next = { ...answers, [current.id]: option };
    setAnswers(next);
    if (index + 1 >= questions.length && supabase) {
      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user?.id;
      if (userId) {
        await supabase.from("nl_profiles").upsert({ id: userId, ...onboardingProfilePatch(next) });
      }
    }
    setIndex(index + 1);
  }

  if (done) {
    return (
      <main className="nl-shell">
        <h1>맞춤 설정이 끝났어요</h1>
        <p>{SAVE_PROMISE_COPY}</p>
        <a className="nl-btn" href="/">{ONBOARDING_DONE_CTA}</a>
      </main>
    );
  }

  return (
    <main className="nl-shell">
      <h1>{ONBOARDING_TITLE}</h1>
      <p>{current.prompt}</p>
      <div className="nl-card nl-opt">
        {current.options.map((option) => (
          <button key={option} type="button" onClick={() => pick(option)}>{option}</button>
        ))}
      </div>
    </main>
  );
}
