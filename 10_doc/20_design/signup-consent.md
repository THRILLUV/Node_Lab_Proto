# 가입 화면 계약

원본 문구 SoT: `10_doc/10_legal/signup/`.  
로직 SoT: `lib/core/consent.mjs` (공식 드롭인: `20_src/frontend/lib/nl/consent.js`).

이 문서는 ADR을 고치지 않는다.

## 순서

1. 소셜 로그인 성공 (`SIGNED_IN`)
2. `nl_profiles`에서 `nickname, terms_version, privacy_version` 조회
3. 세 값이 있으면 학습(또는 `/welcome` 5선택)
4. 없으면 `/signup` 동의 → 별명·연령대
5. 필수 거부 / 만 14세 미만 → signOut, 랜딩. 회원 아님

## 체크

| UI | 저장 |
|---|---|
| (필수) 이용약관 | `terms_version` (`v0.1`) |
| (필수) 개인정보 수집·이용 | `privacy_version` (`v0.1`). 본문에 국외이전 |
| (선택) 마케팅 | `marketing_opt_in` |
| 만 14세 이상 | `over14` |
| 별명 2–12자 | `nickname` |
| 연령대 | `age_band` |
| (자동) | `consented_at` |

국외이전은 체크박스가 아니다.

다음 버튼: `terms && privacy && over14`. 마케팅은 꺼져 있어도 된다.  
모두 동의는 마케팅까지 켠다. 마케팅만 다시 끌 수 있다.

이메일·이름·생년월일은 받지 않는다.

## 온보딩

`app/welcome` — 시험 / 목표 / 막히는 점 / 오늘 양 / 도와 주는 방식.  
레벨테스트 아님. CAT 코드 없음. 공식 `app/onboarding`과 다른 라우트.
