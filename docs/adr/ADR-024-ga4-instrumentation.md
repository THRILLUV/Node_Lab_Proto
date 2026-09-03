# ADR-024: GA4 이벤트 심는 방법 (구현 시)

## 상태
확정 (Accepted) - 2026-09-01
- 설계 SoT: `NodeLab_Day2-3_데이터수집계획_2조.xlsx` + ADR-023
- 이 문서는 **코드를 어디에, 어느 순간에 넣을지**. 측정 ID는 소연이 GA4 속성 만들면 채움.

## 한 줄
화면 `onclick`에 로그를 흩뿌리지 말고, **`track(name, params)` 한 함수만** 쓴다. 클릭으로 끝나는 것만 클라이언트. 저장·결제·OCR 확인은 **API 성공 후에만** 서버 또는 성공 콜백에서 찍는다.

---

## 1. 구성

```
[웹 UI]  click/view
    │  track() → dataLayer → gtag → GA4
    │
[API 성공]  login / ocr_confirm / item_complete / purchase
    │  같은 track() 또는 Measurement Protocol
    │
[AI Gateway]  diagnose_started, variant 게이트
    └  ai_request_log (Warehouse). GA4에는 request_id·style만.
```

- 도구: **GA4** (수업 필수). HTML 프로토는 `gtag.js`. 나중에 앱이 돼도 이벤트 이름은 그대로.
- `user_id`: 우리 UUID. 이메일 넣지 않음.
- `G-XXXXXXXX`: 소연 계정 GA4 웹 스트림 ID. 없을 때는 `dataLayer`만 쌓아도 DebugView 데모 가능.

공통으로 항상 붙는 값 (함수가 자동 주입):
`event_id`(uuid), `event_timestamp`, `user_id`, `session_id`, `user_tier`, `device`

---

## 2. 구현 패턴

```js
function track(name, params) {
  window.dataLayer = window.dataLayer || [];
  const payload = {
    event: name,
    event_id: crypto.randomUUID(),
    event_timestamp: new Date().toISOString(),
    user_id: window.NL_USER_ID || null,
    session_id: window.NL_SESSION_ID,
    user_tier: window.NL_TIER || 'free',
    device: window.matchMedia('(max-width: 768px)').matches ? 'mobile' : 'pc',
    ...params
  };
  window.dataLayer.push(payload);
  if (window.gtag) gtag('event', name, payload);
}
```

규칙:
- 같은 버튼 연타: `event_id`는 매번 새 값이되, **서버 쪽은 첫 요청만 처리** (ADR-022 G4). 클라이언트는 로딩 중 두 번째 `track` 안 함.
- 실패 재시도 성공 시에만 `*_success`류를 한 번. 실패는 `purchase_fail`처럼 별 이벤트.
- params에 문제 원문, 손글씨, 이메일, `CAT_2` 넣지 않음.

로그인 직후 한 번:
```js
gtag('config', 'G-XXXXXXXX', { user_id: uuid });
```

---

## 3. 어디에 심나 (화면 → 코드 위치)

### 클라이언트 (UI 직후)

| 사용자 행동 | 이벤트 | 심는 위치 |
|---|---|---|
| 시작하기 | `click_start` | 인트로 CTA onClick |
| 랜딩 보임 | `view_landing` | 인트로 mount 1회 |
| 5선택지 클릭 | `choice_select` | 카드 onClick. `{ choice, item_index }` |
| 페이월 모달 보임 | `paywall_view` | 모달 open. `{ trigger }` |
| 오답노트 열림 | `wrongnote_open` | 라우트 진입 |
| 다시 풀기/변형 | `wrongnote_retry` | 버튼 onClick `{ action }` |
| 마이크 | `talkback_used` | 녹음 start `{ surface }` |

### 서버 성공 후 (클릭만으로 찍지 말 것)

| 사용자 행동 | 이벤트 | 심는 위치 |
|---|---|---|
| Google 로그인됨 | `login_success` | OAuth 콜백 200. `{ method: 'google' }` |
| 온보딩 제출됨 | `onboarding_complete` | POST /onboarding 200. `{ exam_kind, intent, input_type }` |
| 파일 업로드됨 | `upload_submit` | 업로드 200. `{ file_kind }` |
| 게이트에 막힘 | `guardrail_block` | 분류 결과 not_math 등. `{ reason }` 사용량 미차감 |
| 1번 문제 준비됨 | `first_item_ready` | 분할 완료 후 문제판 데이터 내려간 뒤. `{ entry }` |
| 문항 포커스 | `item_view` | 문항 전환 API 또는 탭 확정. `{ item_index }` |
| OCR 확인 | `ocr_confirm` | “맞아요/수정 저장” API 200. `{ result: ok\|edit\|retake }` 미리보기 화면만으로는 금지 |
| 진단 시작 | `diagnose_started` | Gemini 호출 직전 서버. `{ request_id, model_name }` |
| 힌트 카드 실제 표시 | `feedback_shown` | 응답을 화면에 그린 직후. `{ style, request_id, item_index }` |
| 변형 문제 표시 | `variant_shown` | 5게이트 통과분만. 실패 재생성은 안 찍음 |
| 완풀 | `item_complete` | 완료 상태 커밋 200. `{ item_index, with_variant }` |
| 결제창 | `begin_checkout` | PG 창 오픈 |
| 결제 성공 | `purchase` | PG 웹훅 성공. `{ transaction_id, value: 9900, currency: 'KRW' }` |
| 결제 실패 | `purchase_fail` | 웹훅/창 실패. `{ reason }` |
| 세션 시작 | `session_started` | 새 `session_id` 발급 시. **새로고침으로 재발급 금지** |
| 세션 끝 | `session_ended` | beforeunload + 서버 idle. `{ session_duration, had_ocr_ok, had_item_complete }` |

---

## 4. 클릭 프로토 (`nodelab-proto.html`)에서

실 API가 없어도 **가짜 성공 콜백**에 `track()`을 넣으면 수업 DebugView가 된다.

```js
// 잘못된 예: 손풀이 버튼만 눌러도 ocr_confirm
btnHandwrite.onclick = () => track('ocr_confirm', { result: 'ok' });

// 맞는 예: 선택지는 choice, 확인 모달에서 맞아요를 누른 뒤에 confirm
btnHandwrite.onclick = () => {
  track('choice_select', { choice: 'handwriting', item_index: currentItem });
  openOcrPreview();
};
btnOcrOk.onclick = () => {
  track('ocr_confirm', { result: 'ok', item_index: currentItem });
  showFeedback();
  track('feedback_shown', { style: 'pin', item_index: currentItem });
};
```

프로토는 GA 없이도 `console.log` + `dataLayer`면 된다. 제출 URL에 `G-` 넣으면 그때부터 GA4에 쌓임.

---

## 5. GA4 콘솔에서 할 일 (소연)

1. 속성 1개, 웹 스트림 1개, `G-` ID를 프론트 `gtag config`에.
2. 맞춤 이벤트 이름 등록할 필요 없음 (GA4는 이름 그대로 수신).
3. 맞춤 측정기준: `choice`, `ocr_result`, `reason`, `style`, `exam_kind`, `trigger` (이벤트 매개변수 → 측정기준).
4. User-ID 기능 켜기.
5. 탐색:
   - 퍼널 A: `click_start` → `login_success` → `onboarding_complete` → `first_item_ready` → `paywall_view` → `purchase`
   - 가설: 세그먼트 `ocr_result=ok` vs `choice=grade` 후 `item_complete`, 7일 `session_started`+`item_view`
6. DebugView로 수업 시연.

---

## 6. 백엔드가 반드시 넣을 것

- `session_id`는 서버가 발급. 클라 새로고침으로 바꾸지 않음 (7일 재사용 오염 방지).
- `request_id`는 진단/변형 호출마다. `feedback_shown`·`variant_shown`에 동일 값.
- `purchase`는 웹훅에서만. 결제 버튼 클릭은 `begin_checkout`.
- `guardrail_block`이면 그 문항으로 `item_complete`가 나오면 안 됨.

---

## 7. 구현 체크 (개발 완료 조건)

- [ ] `track()` 단일 진입점
- [ ] 엑셀 `03_Event` 16개 + ADR-023 퍼널 A 이벤트가 Trigger 문구와 같은 순간에 1회
- [ ] `ocr_confirm`이 미리보기만으로 안 나감
- [ ] `variant_shown`이 게이트 실패에 안 나감
- [ ] `session_started`가 F5에 안 나감
- [ ] payload에 원문/이메일/CAT 코드 없음
- [ ] DebugView에서 손풀이 경로 한 바퀴가 보임
