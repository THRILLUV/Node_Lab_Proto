# NodeLab 모바일 컴패니언 설계 (ADR-004 구현분)

- 정책 SoT: ADR-004(웹 표준 컴패니언), ADR-001(③손풀이에서만 뷰파인더), ADR-018(OCR 확인), ADR-022(게이트0).
- 결정: 실시간 동기화는 **Supabase Realtime broadcast 채널**. Vercel 서버리스는 WebSocket 서버를 못 열므로,
  PC·폰 브라우저가 `session:{session_id}` 채널을 직접 구독한다. 서버 중계 코드 없음.
- 참고 와이어: `wireframes/nodelab-app-wireframe.html` (레이아웃 유지, 가짜 배경 → 실카메라).

## 1. 라우트

| 경로 | 화면 |
|---|---|
| `/` | PC 프로토 (기존). 세션 화면 우측에 "폰으로 잇기" 버튼 → QR + 링크 모달 |
| `/m?s={session_id}` | 폰 컴패니언. QR 스캔·링크로 진입, 무로그인 허용(게스트 페어링) |
| `/m` (세션 없음) | 같은 계정 로그인 시 "진행 중인 세션 연결" 바, 아니면 QR 안내 |

## 2. 폰 화면 구성

- 배경: `getUserMedia({video:{facingMode:'environment'}})` 풀스크린 `<video playsinline>`.
  권한 거부/미지원 시 정적 어두운 배경 + "카메라를 허용해 주세요" 카드로 폴백.
- 오버레이(글래스): 상단 문제 카드(현재 문항 크롭·태그) + AI 대화 말풍선 + 5선택지 칩 + [안보이기] 토글.
- 하단 독: 셔터(촬영) · Hold-to-Talk 붉은 버튼(`pointerdown` 녹음 시작 → `pointerup` 종료, Web Speech STT) · 문항 서랍(1~30).
- ADR-001: 뷰파인더 프레임·셔터 활성화는 ③손풀이 선택 상태에서만. 그 외에는 칩만 노출.

## 3. 동기화 이벤트 (Realtime broadcast)

채널 `session:{session_id}`, self-broadcast off.

| 이벤트 | 방향 | payload |
|---|---|---|
| `item_change` | PC→폰 | `{item_index, stem_preview, tag}` — 폰 문제 카드 즉시 교체 |
| `choice_select` | 양방향 | `{choice}` — 어느 쪽에서 눌러도 양쪽 상태 일치 |
| `capture` | 폰→PC | `{upload_id}` — 이미지는 채널에 안 태움. `/api/ocr` 업로드 후 id만 브로드캐스트, PC는 그 결과를 렌더 |
| `stt_text` | 폰→PC | `{text}` — PC 채팅 스트림에 즉시 붙음 |
| `ocr_preview` | 서버결과→양쪽 | `{lines, confidence}` — 미리보기 카드가 PC·폰 동시 노출 |
| `ocr_confirm` | 양방향 | `{result: ok\|edit\|retake}` — 어느 기기에서 확정해도 동일 |
| `presence` | 양방향 | join/leave — PC에 "폰 연결됨" 배지 |

## 4. 데이터 흐름 (손풀이 1회)

```
폰 셔터 → JPEG 압축(최대 1280px) → POST /api/ocr (session_id, item_index)
  → 서버: 게이트0 라벨 동승(ADR-022) → not_math/unreadable이면 거절 카드만, 차감 없음
  → OCR 라인 → ocr_preview 브로드캐스트 → PC·폰 미리보기(맞아요/줄만 고치기/다시촬영)
  → 확인(ocr_confirm ok) → POST /api/ocr-confirm → 진단·힌트 카드(사람말, CAT 코드 비노출)
```

## 5. 페어링

- 기본: PC 모달의 QR(= `/m?s={id}` URL 인코딩) 스캔. 로그인 불요.
- 보조: 같은 Supabase 계정 로그인 상태면 `/m` 진입 시 최근 활성 세션 원터치 연결.
- 세션 id는 서버 발급(`/api/session`), URL 추측 방지를 위해 uuid.

## 6. 제약·폴백

- 카메라는 HTTPS 필수 → Vercel 도메인 충족. iOS Safari: `playsinline` 필수, 마이크는 사용자 제스처 내 요청.
- Supabase env 미설정(로컬/목업): BroadcastChannel(같은 브라우저 탭 간) 폴백 + `X-NL-Mock` 응답으로 UX 검증 가능.
- Realtime 무료 한도(동시 200 연결) 내 운영. 이미지·음성 원본은 채널에 싣지 않는다(메시지 상한 회피 + ADR-012).
