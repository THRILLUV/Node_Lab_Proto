# NodeLab `nl_profiles` (추가분)

공식 `10_doc/20_design/data-dictionary.md`에 아래를 **덧붙인다**. 기존 행은 삭제하지 않는다.  
`public.profiles` / `members` / `system_accounts` / `audits` 설명은 여기 없다.

## `nl_profiles`

회원 1행. PK `id` = `auth.users.id`.

| column | type | 의미 |
|---|---|---|
| `id` | uuid | auth 사용자 |
| `tier` | text | 기본 `free` |
| `exam_track` | text | 온보딩 시험 |
| `tutor_mode` | text | 온보딩 도움 방식 |
| `display_name` | text | 표시 이름(레거시) |
| `nickname` | text | 별명 2–12 |
| `age_band` | text | 연령대 |
| `over14` | boolean | 만 14세 이상 |
| `terms_version` | text | 동의한 이용약관 버전 |
| `privacy_version` | text | 동의한 개인정보 동의 버전 |
| `marketing_opt_in` | boolean | 마케팅 선택 |
| `consented_at` | timestamptz | 동의 시각 |
| `created_at` | timestamptz | 행 생성 |

가입 완료 판정: `terms_version` AND `privacy_version` AND `nickname`.
