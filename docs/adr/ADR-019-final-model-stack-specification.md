# ADR-019: NodeLab 6대 AI 모델 및 연산 엔진 공식 단가 및 출처 명세서 (과금 PM 제출용)

- 수신: 과금 및 수익화 PM (변희웅) / 팀 공통
- 작성일: 2026. 09. 01
- 기준: 공식 개발사 API 가격표 (Google AI Studio, DeepSeek API, W3C Web Standards)

---

## 1. 6대 모델 및 연산 엔진 공식 단가표 (USD & KRW 환산)

* 환율 기준: **1,400원 / USD** (희웅 님 엑셀 C4 셀 기준)

| 번호 | 모델 / 엔진명 | 담당 역할 | Input 단가 (USD / 1M) | Output 단가 (USD / 1M) | 별도 OCR 비용 | 공식 가격 Source URL |
|---|---|---|---|---|---|---|
| **1** | **Gemini 3.7 Flash** (Google) | • 손풀이/수식 멀티모달 OCR<br>• 변형문제 2차 블라인드 감사<br>• CAT 1~4 결손 원인 정밀 진단 | **$0.75**<br>(텍스트·이미지 동일) | **$3.75**<br>(Thinking 포함) | **$0.00**<br>(멀티모달 직접 처리) | https://ai.google.dev/gemini-api/docs/pricing |
| **2** | **DeepSeek V4 Flash** (DeepSeek) | • 무제한 파생 변형문제 대량 생성<br>• 3단계 소크라테스 힌트 대화<br>• 온보딩 5문항 프로파일링 | **$0.14**<br>(Cache Hit: $0.07) | **$0.28** | **$0.00**<br>(텍스트 전용) | https://api-docs.deepseek.com/quick_start/pricing |
| **3** | **SymPy** (Python 엔진) | • 수식 단계별 수학적 동치 검산<br>• 분모 0 / 복소수 해 / 특이점 차단<br>• 100% 결정론적 정답 연산 | **$0.00**<br>(로컬 CPU) | **$0.00**<br>(로컬 CPU) | **$0.00** | https://www.sympy.org/ (BSD 라이선스) |
| **4** | **Web Speech API** (STT) | • 스마트폰 토크백 음성 인식<br>• PC 웹 채팅 Bar 마이크(`●`) 입력 | **$0.00**<br>(온디바이스) | **$0.00** | **$0.00** | https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API |
| **5** | **SpeechSynthesis API** (TTS) | • 학생 음성 질문 시 AI 음성 답변<br>(iOS Siri 보이스 / 안드로이드 음성) | **$0.00**<br>(온디바이스) | **$0.00** | https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis |
| **6** | **KaTeX 0.16.22** (렌더링) | • 생성된 변형문제 및 수식 렌더링 | **$0.00**<br>(클라이언트 JS) | **$0.00** | **$0.00** | https://katex.org/ (MIT 라이선스) |

---

## 2. 문제 1건 풀이 시 실측 토큰량 및 원가 산출 근거

희웅 님의 `01_입력값` 및 `06_모델PoC비교` 시트 표준 토큰량(Input 4,000 / Output 1,000 tokens) 대입 결과입니다.

### ① 손풀이 최초 제출 1회차 (OCR + 진단)
* **담당 모델**: `Gemini 3.7 Flash` (Input 4,000 tokens + Output 1,000 tokens)
* **Input 비용**: $\frac{4,000}{1,000,000} \times \$0.75 = \$0.003$
* **Output 비용**: $\frac{1,000}{1,000,000} \times \$3.75 = \$0.00375$
* **합계 원가**: $\$0.00675 \times 1,400\text{원} =$ **9.45원**

### ② 변형 응용문제 무한 생성 1회차 (생성 + 검산)
* **생성자 (`DeepSeek V4 Flash`)**: Input 2,000 + Output 800 tokens
  * 비용: $(\$0.00028 + \$0.000224) \times 1,400\text{원} = \mathbf{0.70\text{원}}$
* **계산기 (`SymPy`)**: 로컬 CPU 연산 = $\mathbf{0.00\text{원}}$
* **블라인드 검증자 (`Gemini 3.7 Flash`)**: Input 1,000 + Output 200 tokens
  * 비용: $(\$0.00075 + \$0.00075) \times 1,400\text{원} = \mathbf{2.10\text{원}}$
* **합계 원가**: **건당 2.80원** (순수 텍스트 변형만 반복 시 **건당 0.7원**)

---

## 3. 희웅 님 엑셀 파일 매핑 가이드

* **`06_모델PoC비교` 시트**:
  * Gemini 3.7 Flash ➔ Input `$0.75`, Output `$3.75`, Vision `$0`, Source: `https://ai.google.dev/gemini-api/docs/pricing`
  * DeepSeek V4 Flash ➔ Input `$0.14`, Output `$0.28`, Vision `$0`, Source: `https://api-docs.deepseek.com/quick_start/pricing`
* **`03_사용자시나리오` / `04_마진민감도` 시트**:
  * Base 판매 가격: **9,900원**
  * Normal 유저 (월 80문제): 월 AI 원가 **756원** (마진율 **92.4%**)
  * Heavy 유저 (월 200문제): 월 AI 원가 **1,890원** (마진율 **80.9%**)
  * Stress 유저 (월 600문제): 월 AI 원가 **4,200원** (마진율 **57.6%**)
