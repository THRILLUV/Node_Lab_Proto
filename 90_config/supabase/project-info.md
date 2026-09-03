# Supabase 프로젝트

| 용도 | 프로젝트 | 쓰면 |
|---|---|---|
| 테스트 앱 | thrilluv 쪽 Node_Lab (`yrgajwztpuscjbmrbkqg`) | 이 레포 루트만 |
| 공식 앱 | 공식 계정으로 만든 프로젝트 | `edu_logic_auditor`만 |

두 프로젝트를 섞지 않는다. anon 키는 클라이언트에 들어가도 RLS가 막는다. service_role은 서버만.

테이블:

- 추가: `nl_profiles` (`91_mig/supabase/migrations/`)
- 금지: `public.profiles` ALTER
- 건드리지 않음: 공식 `members`, `system_accounts`, `audits`

가입 컬럼이 아직 없으면 동의/별명은 브라우저 localStorage에만 남고, 다른 기기에서 다시 묻는다.
