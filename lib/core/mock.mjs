function mulberry32(seed) {
  let t = Number(seed) >>> 0;
  return function rand() {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleInPlace(arr, rand) {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function shuffleMock(items = [], seed = 1) {
  const rand = mulberry32(seed);
  const copy = items.map((it) => ({
    ...it,
    choices: [...(it.choices || [])],
  }));
  shuffleInPlace(copy, rand);
  return copy.map((it) => {
    const choices = [...it.choices];
    const correct = choices[(it.answer || 1) - 1];
    shuffleInPlace(choices, rand);
    return {
      ...it,
      choices,
      answer: choices.indexOf(correct) + 1,
    };
  });
}

export function mockModes() {
  return [
    { id: 1, title: "순서·보기 셔플", blurb: "문항 순서와 5보기만 섞어요. 답 번호 암기를 끊습니다." },
    { id: 2, title: "원본 깨끗이 다시 풀기", blurb: "같은 시험지를 백지로 다시 풉니다. 해설은 숨깁니다." },
    { id: 3, title: "완전 변형", blurb: "유형은 같고 숫자는 새로운 세트. 키 없으면 10문 미니." },
  ];
}

export function shouldForceNewSession(mode) {
  return Number(mode) === 2;
}

export function cleanRetryState({ examKey = "2026" } = {}) {
  return {
    examKey,
    entry: "mock",
    mockMode: 2,
    mockItems: null,
    mockOrder: null,
    visibleTabs: 30,
    currentQ: 1,
    phase: "prompt",
    pick: null,
    hinted: false,
    ocrPreview: null,
    hintMessage: "",
  };
}
