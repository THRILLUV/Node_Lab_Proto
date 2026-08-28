# Node_Lab

SeSAC AI PM 2조 Node_Lab MVP.

수능 수학 자습 루프. 웹 3단 + 아이폰(열린 탭의 눈·귀·입).

## wireframes/

- `nodelab-wireframe.html` — 웹 ChatGPT식 3단
- `nodelab-app-wireframe.html` — 아이폰 카메라/홀드투토크
- `nodelab-ia.html` — 서비스 정보구조도
- `nodelab-master.html` — 1차 마스터 HTML (원본 복사, 로컬 원본은 안 건드림)
- `pm-grid-nodelab-flow.html` — PM Grid 보드에 Node_Lab 서비스 플로우를 그린 것. 브라우저로 열면 노드를 끌어 옮기고 글자를 고칠 수 있다.

## pm-grid/

- `nodelab-service-flow.patch` — 위 플로우를 [PM_Grid](https://github.com/THRILLUV/PM_Grid) 저장소에 그대로 얹는 패치.
  PM_Grid 클론에서 `git apply ../Node_Lab/pm-grid/nodelab-service-flow.patch`.
