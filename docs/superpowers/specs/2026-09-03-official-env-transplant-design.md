# Official env + transplant surface

## Goal

명희가 `THRILLUV/Node_Lab`에서 `edu_logic_auditor`로 로그인·동의를 옮길 수 있게, 공식과 같은 폴더·환경 변수 이름을 이 레포에 만든다.

## Not in this slice

- 공식 레포에 push
- 테스트 앱을 Next로 교체
- 공식 `app/onboarding` / `app/admin` / 기존 마이그레이션 덮어쓰기
- 시크릿 커밋

## Shape

- `10_doc` / `20_src` / `90_config` / `91_mig` 드롭인
- `lib/core/env-names.mjs`가 공식 키 별칭을 읽음
- `20_src/frontend/lib/nl`는 `lib/core` 동기화 복사
- `91_mig`는 `nl_profiles` 추가만
