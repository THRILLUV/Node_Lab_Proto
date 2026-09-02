# Google / Kakao / Naver 로그인

가짜 타이머 로그인은 쓰지 않는다. 키가 없으면 버튼은 `준비 중`이다.

계정: 구글 콘솔 = `giftedonyou` / 수파베이스·Vercel·GitHub = `thrilluv`.  
대상 프로젝트: `yrgajwztpuscjbmrbkqg`  
콜백: `https://yrgajwztpuscjbmrbkqg.supabase.co/auth/v1/callback`

## 1. Google (Supabase Auth 제공자)

1. https://console.cloud.google.com/ → OAuth 클라이언트 ID(웹).
2. JavaScript 원본:
   - `http://127.0.0.1:4173`
   - `https://nodelab-swart.vercel.app`
3. 리디렉션 URI:
   - `https://yrgajwztpuscjbmrbkqg.supabase.co/auth/v1/callback`
4. thrilluv 대시보드 [Authentication → Providers → Google](https://supabase.com/dashboard/project/yrgajwztpuscjbmrbkqg/auth/providers) 에 Client ID/Secret 붙여 넣고 Enable.
5. [URL configuration](https://supabase.com/dashboard/project/yrgajwztpuscjbmrbkqg/auth/url-configuration) Site URL: `https://nodelab-swart.vercel.app`  
   Redirect allow list:
   - `https://nodelab-swart.vercel.app`
   - `https://nodelab-swart.vercel.app/**`
   - `http://127.0.0.1:4173`
   - `http://127.0.0.1:4173/**`

`/api/config` 가 라이브 GoTrue 설정을 읽어 `{ auth.google: true }` 가 되면 버튼이 켜진다.

## 2. Kakao

두 길 중 하나.

**A. Supabase 내장 Kakao**  
카카오 디벨로퍼스에서 REST API 키 + 로그인 Client Secret. Redirect URI는 위 Supabase callback과 같다. 대시보드 Providers → Kakao Enable.

**B. 앱 라우트**  
Vercel/로컬에 `KAKAO_REST_API_KEY`, `KAKAO_CLIENT_SECRET` 을 넣는다.  
카카오 Redirect URI:

- `https://nodelab-swart.vercel.app/api/auth/kakao`
- `http://127.0.0.1:4173/api/auth/kakao`

이 경우 버튼은 `/api/auth/kakao` 로 간다.

## 3. Naver

Naver는 GoTrue 내장이 아니다. `NAVER_CLIENT_ID` + `NAVER_CLIENT_SECRET` 이 있을 때만 버튼이 켜지고 `/api/auth/naver` 로 간다.

네이버 디벨로퍼스 Callback URL:

- `https://nodelab-swart.vercel.app/api/auth/naver`
- `http://127.0.0.1:4173/api/auth/naver`

서버는 `nl_oauth_prepare` RPC로 `auth.users` / `nl_profiles` 를 만든 뒤 세션 해시로 돌아온다. `NL_OAUTH_DB_SECRET` 이 프로젝트 시크릿과 같아야 한다.

키 없이 버튼을 눌러도 `enterApp` 하지 않는다.
