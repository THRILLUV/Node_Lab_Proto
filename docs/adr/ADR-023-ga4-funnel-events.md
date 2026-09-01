# ADR-023: GA4 행동 데이터 · 퍼널 이벤트 사전 (수업 필수 UTM→구매 + 학습 활성화)

## 상태
확정 (Accepted) - 2026-09-01
- 성격: 요약. **디테일 SoT는 엑셀** `NodeLab_Day2-3_데이터수집계획_2조.xlsx` (수업 Day2-3 양식: 가설→Journey→Event→Property→AI Log→Tracking Plan→실험→Decision).
- 담당: 손소연 오너. 박태희 유입. 김홍 AI Log. 변희웅 purchase. 장명희 품질.

## 맥락
수업 필수값에 **GA4 퍼널 UTM → 구매**가 있다. 화면마다 이벤트를 뿌리면 안 보인다. **돈이 되는 길 하나, 공부가 되는 길 하나**만 남긴다. 이벤트는 20개 이하. 손글씨·문제 원문·이메일은 보내지 않는다.

최근 BM: Google 로그인 후 온보딩 → 무료 체험 → 월 구독. (비회원 3문제 맛보기는 ADR-009와 어긋나면 이 문서의 로그인 후 퍼널을 따른다.)

---

## 1. 정하는 규칙

1. **화면 impression이 아니라 의사결정에 찍는다.** 홈을 본 횟수보다 “PDF를 올렸다 / 5선택지를 골랐다 / 페이월에서 막혔다”.
2. **퍼널은 2개만.** 그 외는 나중에.
3. **이벤트 이름 = 동사_목적어** (`login_success`, `paywall_view`). 한글·CAT 코드는 이벤트 이름으로 쓰지 않는다.
4. **파라미터는 자를 축만.** `source`, `device`, `exam_kind`, `choice`, `gate_reason`, `plan`. 문장·수식·파일명 금지.
5. **user_id는 UUID.** 이메일·이름·학교 금지. GA4 User-ID = 우리 UUID.
6. **막힌 것도 찍는다.** 가드레일 차단·OCR 실패가 있어야 왜 이탈했는지 안다.
7. **막힌 입력은 전환 성공으로 세지 않는다.** 사용량 미차감과 동일.

공통 파라미터 (모든 이벤트에 자동):
`session_id`, `user_tier` (guest|free|pro), `device` (pc|mobile|tablet), `utm_source`, `utm_medium`, `utm_campaign`

---

## 2. 퍼널 A — 돈 (수업 제출용 UTM → purchase)

GA4 탐색 > 유입경로. 한 칸이라도 비면 안 된다.

| 순서 | 이벤트 | 언제 | 핵심 파라미터 |
|---|---|---|---|
| A0 | `session_start` | GA4 기본 | (자동) |
| A1 | `view_landing` | 인트로/랜딩 | |
| A2 | `click_start` | 3초 만에 시작하기 | |
| A3 | `login_success` | Google 로그인 성공 | `method=google` |
| A4 | `onboarding_complete` | 5지선다 끝 | `exam_kind`, `intent`, `input_type` |
| A5 | `first_item_ready` | 1번 문제 + 5선택지가 처음 보임 | `entry` (pdf\|photo\|demo) |
| A6 | `paywall_view` | 한도/Pro 모달 | `trigger` (quota\|variant\|report) |
| A7 | `begin_checkout` | 결제창 진입 | `value=9900`, `currency=KRW` |
| A8 | `purchase` | 결제 성공 | `transaction_id`, `value=9900` |
| A8x | `purchase_fail` | 결제 실패 | `reason` (limit\|cancel\|pg) |

추천 탐색: `utm_campaign`별로 A2→A8 전환율. 수업 슬라이드에 이 한 줄이면 된다.

---

## 3. 퍼널 B — 공부 (아하 / 활성화)

첫 세션에서 “문제를 끝까지 한 칸 움직였는가”.

| 순서 | 이벤트 | 언제 | 핵심 파라미터 |
|---|---|---|---|
| B1 | `upload_submit` | PDF/사진 제출 | `file_kind` (pdf\|photo\|handwriting) |
| B2 | `guardrail_block` | ADR-022에 막힘 | `reason` (not_math\|unreadable\|answer_key\|empty\|too_large\|off_topic) |
| B3 | `item_view` | 문항 1개가 고정됨 | `item_index` |
| B4 | `choice_select` | 5선택지 클릭 | `choice` (grade\|concept\|handwriting\|variant\|ask) |
| B5 | `ocr_confirm` | 손풀이 “맞아요” | `result` (ok\|edit\|retake) |
| B6 | `feedback_shown` | 첨삭/힌트가 보임 | `style` (pin\|drill\|formula\|condition)  ※ CAT 코드 아님 |
| B7 | `variant_shown` | 변형 문제가 화면에 나옴 | `pass=true` (5게이트 통과분만) |
| B8 | `item_complete` | 탭 초록 / 이어 풀기 | `with_variant` (bool) |
| B9 | `wrongnote_open` | 오답노트 진입 | |
| B10 | `wrongnote_retry` | 다시 풀기 / 변형 | `action` (retry\|variant) |

활성화 정의 (내부 KPI, 이벤트 아님):
**가입 후 24시간 안에 `item_complete` 1회 이상.**

---

## 4. 보조용 (퍼널에 안 넣어도 됨, 5개)

| 이벤트 | 언제 |
|---|---|
| `talkback_used` | 마이크/토크백 1회 | `surface` (pc_bar\|mobile_hold) |
| `ocr_edit` | 인식 수정 기여 (크레딧) | |
| `report_open` | Pro Audit 리포트 | |
| `quota_hit` | 무료 한도 도달 (paywall 직전) | `quota_type` |
| `logout` | 로그아웃 | |

이 이상은 MVP에서 안 찍는다. 스크롤, 호버, 매 키입력, 모델명, 토큰 원가는 GA가 아니라 운영 로그(장명희).

---

## 5. 절대 보내지 않는 것

- 이메일, 이름, 학교, 사진 URL, 손글씨 원문, 문제 LaTeX
- `CAT_2` 같은 내부 코드 (필요하면 `style=drill` 정도)
- 프롬프트 전문, API 키, 결제 카드 정보
- 가드레일에 막힌 파일 내용

---

## 6. 누가 뭘 보나

- **손소연**: 퍼널 A 캠페인별 전환, 페이월 트리거별 구매
- **박태희**: A1–A5, 온보딩 완주율, 첫 문항까지 시간
- **김홍**: B4 선택지 분포, B6 피드백 스타일, B2 not_math 비율 (내용은 안 봄)
- **변희웅**: A6–A8, `purchase` 금액, 실패 사유
- **장명희**: `guardrail_block` 급증, `purchase_fail` 급증만 알림
