import Link from "next/link";

export default function HomePage() {
  return (
    <main className="nl-shell">
      <h1>NodeLab 이식 프론트</h1>
      <p>
        공식 `20_src/frontend`를 통째로 바꾸지 마세요. `/signup`과 `/welcome`만
        새 라우트로 복사합니다. 기존 `/onboarding`은 그대로 둡니다.
      </p>
      <p>
        <Link className="nl-btn" href="/signup">가입 화면</Link>
      </p>
    </main>
  );
}
