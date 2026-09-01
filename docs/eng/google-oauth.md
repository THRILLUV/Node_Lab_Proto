# Google 로그인 등록 (사용자가 발급)

코드는 Supabase Auth `signInWithOAuth({ provider: "google" })` 를 이미 호출한다.  
OAuth 클라이언트가 대시보드에 없으면 버튼은 `준비 중`이다. 가짜 타이머 로그인은 쓰지 않는다.

## 1. Google Cloud Console

1. https://console.cloud.google.com/ 에서 프로젝트 선택(또는 생성).
2. **API 및 서비스 → 사용자 인증 정보 → OAuth 클라이언트 ID**.
3. 애플리케이션 유형: **웹 애플리케이션**.
4. 승인된 JavaScript 원본:
   - `http://127.0.0.1:4173`
   - Vercel 프로덕션/프리뷰 origin
5. 승인된 리디렉션 URI:
   - `https://rccewveplhbgkhrxloui.supabase.co/auth/v1/callback`

클라이언트 ID와 시크릿을 복사한다.

## 2. Supabase (기존 프로젝트)

프로젝트 `rccewveplhbgkhrxloui` → Authentication → Providers → Google:

- Enable
- Client ID / Secret 붙여넣기
- Redirect URL이 위 callback과 같은지 확인

## 3. NodeLab env

로컬/Vercel에 `AUTH_GOOGLE=1` 을 켠다. `/api/config` 가 `{ auth: { google: true } }` 를 주면 버튼이 활성화된다.

Kakao/Naver도 같은 패턴이다. 키 없이 버튼을 눌러도 `enterApp` 하지 않는다.
