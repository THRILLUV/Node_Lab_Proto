# Node_Lab

SeSAC AI PM 2조 Node_Lab MVP.

수능 수학 자습 루프. 웹 3단 + 아이폰(열린 탭의 눈·귀·입).

## wireframes/

- `nodelab-wireframe.html` — 웹 ChatGPT식 3단
- `nodelab-proto.html` — 클릭 가능한 웹 3단 자습 플로우 목업 (가짜 OCR/AI)
- `items/` — 업로드된 2026 수능 수학 홀수형 PDF에서 크롭한 30문항 원본 이미지(q01–q30) + 1쪽 전체(page-01). 문제판에는 이 원본만 표시
- `questions.json` — OCR·LaTeX 인식이 끝났다고 가정한 내부 데이터. 풀이 도움·응용문제 생성에만 사용 (변형 3개씩)
- `nodelab-app-wireframe.html` — 아이폰 카메라/홀드투토크
- `nodelab-ia.html` — 서비스 정보구조도
- `nodelab-master.html` — 1차 마스터 HTML (원본 복사, 로컬 원본은 안 건드림)

## 1차 클릭 프로토 범위

사용자 A 플로우만 클릭 구현한다: 인트로 → Google 로그인 → 홈/라이브러리/오답노트 → PDF 학습 세션 → 마이페이지 → 요금제/결제/구독/환불 → 상세 Audit 리포트.

팀 공통 IA에는 관리자·결제 운영·AI 사용량·타겟팅 배너·푸시/알림톡도 유지하지만, 관리자 기능은 B 후속 구현이고 배너는 슬롯, 푸시/알림톡은 문서이므로 이번 사용자 프로토의 앱 화면으로 만들지 않는다. Google OAuth, PG, 실제 환불/사용량 차감은 가짜 상태 전환으로만 표현한다.
