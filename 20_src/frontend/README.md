# 공식 Next로 옮기는 프론트

공식 `20_src/frontend`를 **이 폴더로 교체하지 마세요.**

복사할 것만:

- `lib/nl/`
- `app/signup/`
- `app/welcome/`
- `app/auth/callback/`
- `lib/supabaseClient.js` — 공식 파일이 있으면 그 클라이언트를 쓰고 `@/lib/nl`만 추가

`package.json`은 참조. 공식에 `@supabase/supabase-js`가 있으면 추가하지 않음.  
`next.config.js`의 `/api/be/*` rewrite는 공식에 이미 있으면 유지.

로컬에서 이 폴더만 돌려 보려면:

```bash
cp .env.local.example .env.local
# 공식 Supabase 값만 넣기
npm install
npm run dev
```

기존 `app/onboarding` 과 이 `/welcome`은 다릅니다. 덮어쓰지 마세요.
