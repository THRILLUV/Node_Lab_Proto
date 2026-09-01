export function socialButtonState({ google = false, kakao = false, naver = false } = {}) {
  return {
    google: {
      enabled: Boolean(google),
      label: google ? "Google로 계속하기" : "Google 준비 중",
    },
    kakao: {
      enabled: Boolean(kakao),
      label: kakao ? "카카오로 계속하기" : "Kakao 준비 중",
    },
    naver: {
      enabled: Boolean(naver),
      label: naver ? "네이버로 계속하기" : "Naver 준비 중",
    },
  };
}

export function authProviderFlags(env = process.env) {
  return {
    google: Boolean(env.AUTH_GOOGLE === "1" || env.SUPABASE_AUTH_GOOGLE === "1"),
    kakao: Boolean(env.AUTH_KAKAO === "1" || env.SUPABASE_AUTH_KAKAO === "1"),
    naver: Boolean(env.NAVER_CLIENT_ID && env.NAVER_CLIENT_SECRET),
  };
}
