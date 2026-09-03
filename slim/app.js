import { createBus } from "./bus.js";
import { track } from "./track.js";

const $ = (id) => document.getElementById(id);
const state = {
  sessionId: "",
  itemIndex: 1,
  items: [],
  choice: "",
  preview: null,
  phoneOn: false,
  bus: null,
};

function katexOrText(el, tex) {
  if (window.katex) {
    try {
      el.innerHTML = window.katex.renderToString(tex, { throwOnError: false });
      return;
    } catch {}
  }
  el.textContent = tex;
}

async function api(path, body) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body || {}),
  });
  const json = await res.json();
  if (!res.ok) throw Object.assign(new Error(json.error || "api"), { status: res.status, json });
  return json;
}

function currentItem() {
  return state.items.find((it) => it.n === state.itemIndex) || state.items[0];
}

function renderPlate() {
  const item = currentItem();
  if (!item) return;
  $("kicker").textContent = `2026 수능 수학 · ${item.n}번 · ${item.type}`;
  katexOrText($("stem"), item.stem);
  $("opts").innerHTML = "";
  (item.choices || []).forEach((c, i) => {
    const b = document.createElement("button");
    b.className = "opt";
    b.type = "button";
    katexOrText(b, `${i + 1}. ${c}`);
    $("opts").appendChild(b);
  });
}

function addBubble(html, me = false) {
  const div = document.createElement("div");
  div.className = me ? "bubble me" : "bubble";
  div.innerHTML = html;
  $("chat").appendChild(div);
  $("chat").scrollTop = $("chat").scrollHeight;
  return div;
}

function choiceButtons(host) {
  const wrap = document.createElement("div");
  wrap.className = "choices";
  [
    ["score", "1  답만 빠르게 채점"],
    ["concept", "2  개념부터 알고 싶어요"],
    ["hand", "3  내 손풀이 봐주세요"],
    ["variant", "4  비슷한 문제 더 풀기"],
    ["ask", "5  직접 질문하기"],
  ].forEach(([id, label]) => {
    const b = document.createElement("button");
    b.className = "chip";
    b.type = "button";
    b.textContent = label;
    b.addEventListener("click", () => onChoice(id));
    wrap.appendChild(b);
  });
  host.appendChild(wrap);
}

function showGuard(message, actions) {
  const box = addBubble(`<b>잠깐만요</b><div style="margin-top:6px">${message}</div>`);
  const row = document.createElement("div");
  row.className = "actions";
  actions.forEach(([label, fn]) => {
    const b = document.createElement("button");
    b.className = "ghost";
    b.type = "button";
    b.textContent = label;
    b.addEventListener("click", fn);
    row.appendChild(b);
  });
  box.appendChild(row);
  track("guardrail_block", { item_index: state.itemIndex });
}

function renderPreview(preview, from = "pc") {
  state.preview = preview;
  const box = addBubble(`<b>방금 올리신 손풀이를 이렇게 읽었어요</b>`);
  const pre = document.createElement("div");
  pre.className = "preview";
  (preview.lines || []).forEach((ln) => {
    const line = document.createElement("div");
    line.className = "line";
    const left = document.createElement("span");
    left.textContent = `Step ${ln.step}  `;
    const math = document.createElement("span");
    katexOrText(math, ln.latex);
    line.append(left, math);
    pre.appendChild(line);
  });
  const row = document.createElement("div");
  row.className = "actions";
  [
    ["네, 맞아요", "ok"],
    ["틀린 부분 직접 고치기", "edit"],
    ["다시 촬영하기", "retake"],
  ].forEach(([label, result]) => {
    const b = document.createElement("button");
    b.className = result === "ok" ? "primary" : "ghost";
    b.type = "button";
    b.textContent = label;
    b.addEventListener("click", () => confirmOcr(result, from));
    row.appendChild(b);
  });
  box.appendChild(pre);
  box.appendChild(row);
}

async function confirmOcr(result, from) {
  if (result === "edit") {
    const raw = window.prompt("고칠 줄을 LaTeX로 적어 주세요. 예: 3^{1/2} \\times 3^{-1/2} = 3^{0}");
    if (!raw) return;
    const lines = (state.preview?.lines || []).map((ln, i) => (i === 1 ? { ...ln, latex: raw } : ln));
    state.preview = { ...state.preview, lines };
  }
  if (result === "retake") {
    addBubble("다시 찍어 주세요. 밝은 데서 노트가 꽉 차게 맞춰 주세요.");
    state.bus?.send("ocr_confirm", { result: "retake", item_index: state.itemIndex });
    return;
  }
  const res = await api("/api/ocr-confirm", {
    session_id: state.sessionId,
    item_index: state.itemIndex,
    result,
    lines: state.preview?.lines,
  });
  track("ocr_confirm", { item_index: state.itemIndex, result, from });
  state.bus?.send("ocr_confirm", { result, item_index: state.itemIndex, lines: state.preview?.lines });
  if (res.ok) {
    const hint = await api("/api/hint", {
      choice: "hand",
      item_index: state.itemIndex,
      ocr_confirmed_lines: state.preview?.lines,
    });
    addBubble(hint.message);
    track("feedback_shown", { item_index: state.itemIndex, style: hint.style });
    state.bus?.send("hint", { message: hint.message });
  }
}

async function onChoice(choice, { remote = false } = {}) {
  state.choice = choice;
  track("choice_select", { choice, item_index: state.itemIndex });
  if (!remote) state.bus?.send("choice_select", { choice, item_index: state.itemIndex });
  const labels = { score: "1 답만 빠르게 채점", concept: "2 개념부터", hand: "3 내 손풀이 봐주세요", variant: "4 비슷한 문제", ask: "5 직접 질문" };
  addBubble(labels[choice] || choice, true);
  if (choice === "hand") {
    const box = addBubble("책상 위 풀이를 찍거나, 폰으로 이어서 찍어 주세요.");
    const row = document.createElement("div");
    row.className = "actions";
    const demo = document.createElement("button");
    demo.className = "ghost";
    demo.type = "button";
    demo.textContent = "데모 손풀이 올려보기";
    demo.addEventListener("click", () => submitImage(demoImage(), "pc"));
    const fileBtn = document.createElement("button");
    fileBtn.className = "primary";
    fileBtn.type = "button";
    fileBtn.textContent = "사진 올리기";
    fileBtn.addEventListener("click", () => $("file").click());
    row.append(demo, fileBtn);
    box.appendChild(row);
    $("file").disabled = false;
    return;
  }
  if (choice === "variant") {
    const v = await api("/api/variant", { item_index: state.itemIndex });
    const box = addBubble(`<b>비슷한 문제</b>`);
    const stem = document.createElement("div");
    katexOrText(stem, v.stem);
    box.appendChild(stem);
    track("variant_shown", { item_index: state.itemIndex });
    return;
  }
  const hint = await api("/api/hint", { choice, item_index: state.itemIndex });
  addBubble(hint.message);
  track("feedback_shown", { item_index: state.itemIndex, style: hint.style });
}

async function submitImage(imageB64, from = "pc") {
  const gate = await api("/api/gate", { image_b64: imageB64, session_id: state.sessionId, text: currentItem()?.stem || "" });
  if (gate.label === "not_math" || gate.label === "unreadable") {
    showGuard(gate.message, [["다른 파일 올리기", () => $("file").click()], ["이 장 건너뛰기", () => {}]]);
    return;
  }
  const ocr = await api("/api/ocr", {
    image_b64: imageB64,
    session_id: state.sessionId,
    item_index: state.itemIndex,
    text: currentItem()?.stem || "",
  });
  track("upload_submit", { item_index: state.itemIndex, from });
  if (ocr.blocked) {
    showGuard(ocr.gate?.message || "이 장은 수학으로 안 보여요.", [["다시 촬영", () => $("file").click()]]);
    return;
  }
  renderPreview(ocr, from);
  state.bus?.send("ocr_preview", { lines: ocr.lines, confidence: ocr.confidence, upload_id: ocr.upload_id, item_index: state.itemIndex });
}

function demoImage() {
  return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAIUlEQVQoU2NkYGD4z0AEYBxVSFQ0qhC3wlGFuBWOKsStEAC+uwQLdbGqswAAAABJRU5ErkJggg==";
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function openPair() {
  const url = `${location.origin}/m?s=${encodeURIComponent(state.sessionId)}`;
  $("pairLink").textContent = url;
  $("pairModal").classList.remove("gone");
  const canvas = $("qr");
  if (window.QRCode) {
    window.QRCode.toCanvas(canvas, url, { width: 200, margin: 1, color: { dark: "#191f28", light: "#ffffff" } });
  }
}

function bindBus(cfg) {
  state.bus = createBus({
    sessionId: state.sessionId,
    supabaseUrl: cfg.supabaseUrl,
    supabaseAnon: cfg.supabaseAnon,
    role: "pc",
    onEvent(evt) {
      if (evt.from === "pc") return;
      if (evt.type === "presence" || evt.type === "hello") {
        state.phoneOn = true;
        $("phoneBadge").textContent = "폰 연결됨";
        $("phoneBadge").classList.remove("off");
      }
      if (evt.type === "ocr_preview") renderPreview(evt.payload, "phone");
      if (evt.type === "stt_text" && evt.payload?.text) addBubble(evt.payload.text, true);
      if (evt.type === "choice_select" && evt.payload?.choice) {
        onChoice(evt.payload.choice, { remote: true });
      }
    },
    onPresence(stateMap) {
      const roles = Object.values(stateMap || {}).flat().map((x) => x.role);
      if (roles.includes("phone")) {
        state.phoneOn = true;
        $("phoneBadge").textContent = "폰 연결됨";
        $("phoneBadge").classList.remove("off");
      }
    },
  });
  state.bus.ready.then(() => {
    state.bus.send("item_change", {
      item_index: state.itemIndex,
      stem_preview: currentItem()?.stem,
      tag: currentItem()?.type,
    });
  });
}

async function start() {
  track("click_start");
  $("landing").classList.add("gone");
  $("app").classList.remove("gone");
  const [session, bank, cfg] = await Promise.all([
    api("/api/session", {}),
    fetch("/questions.json").then((r) => r.json()),
    fetch("/api/config").then((r) => r.json()),
  ]);
  state.sessionId = session.session_id;
  state.items = bank.items || [];
  renderPlate();
  const first = addBubble("1번 문제를 위에 고정해 두었어요. 답을 보기 전에 어떻게 풀어볼까요?");
  choiceButtons(first);
  track("first_item_ready", { item_index: 1 });
  track("item_view", { item_index: 1 });
  bindBus(cfg);
}

$("btnStart").addEventListener("click", start);
$("btnStartHero").addEventListener("click", start);
$("btnPair").addEventListener("click", openPair);
$("btnPairClose").addEventListener("click", () => $("pairModal").classList.add("gone"));
$("file").addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const url = await fileToDataUrl(file);
  await submitImage(url, "pc");
  e.target.value = "";
});
$("ask").addEventListener("keydown", async (e) => {
  if (e.key !== "Enter") return;
  const text = e.target.value.trim();
  if (!text) return;
  e.target.value = "";
  addBubble(text, true);
  const gate = await api("/api/gate", { text, session_id: state.sessionId });
  if (gate.label === "not_math") {
    showGuard(gate.message, []);
    return;
  }
  const hint = await api("/api/hint", { choice: "ask", item_index: state.itemIndex });
  addBubble(hint.message);
});
$("btnNext").addEventListener("click", () => {
  state.itemIndex = Math.min(30, state.itemIndex + 1);
  state.choice = "";
  state.preview = null;
  $("chat").innerHTML = "";
  renderPlate();
  const first = addBubble(`${state.itemIndex}번 문제를 위에 고정해 두었어요. 어떻게 풀어볼까요?`);
  choiceButtons(first);
  track("item_view", { item_index: state.itemIndex });
  state.bus?.send("item_change", {
    item_index: state.itemIndex,
    stem_preview: currentItem()?.stem,
    tag: currentItem()?.type,
  });
});

track("view_landing");
