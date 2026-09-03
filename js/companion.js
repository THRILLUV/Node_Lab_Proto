import { createBus } from "./bus.js";
import { track } from "./track.js";

const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);
const sessionId = params.get("s") || "";
const state = { choice: "", item: { n: 1, stem: "연결되면 문제가 여기에 떠요", type: "대기" }, bus: null, stream: null };

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
  return res.json();
}

function setItem(item) {
  state.item = item;
  $("pinMeta").textContent = `${item.n}번`;
  $("pinTag").textContent = item.tag || item.type || "";
  katexOrText($("pinStem"), item.stem || "");
}

function addChat(text) {
  const b = document.createElement("div");
  b.className = "ov-b";
  b.textContent = text;
  $("ovChat").appendChild(b);
}

function setHandMode(on) {
  $("finder").classList.toggle("off", !on);
  $("shutter").disabled = !on;
}

async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" } },
      audio: false,
    });
    state.stream = stream;
    const video = $("cam");
    video.srcObject = stream;
    video.muted = true;
    video.setAttribute("playsinline", "true");
    await video.play();
    $("perm").classList.add("gone");
  } catch {
    $("permText").textContent = "카메라를 허용해 주세요. 설정에서 이 사이트 카메라만 켜면 돼요.";
  }
}

function snap() {
  const video = $("cam");
  const w = video.videoWidth || 1280;
  const h = video.videoHeight || 720;
  const scale = Math.min(1, 1280 / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.82);
}

async function capture() {
  if (state.choice !== "hand") {
    addChat("손풀이를 보려면 먼저 3번을 눌러 주세요.");
    return;
  }
  const imageB64 = snap();
  addChat("손풀이를 읽고 있어요…");
  const ocr = await api("/api/ocr", {
    image_b64: imageB64,
    session_id: sessionId,
    item_index: state.item.n || 1,
    text: state.item.stem || "",
  });
  track("upload_submit", { from: "phone", item_index: state.item.n });
  if (ocr.blocked) {
    addChat(ocr.gate?.message || "다시 찍어 주세요.");
    state.bus?.send("ocr_preview", { blocked: true, message: ocr.gate?.message });
    return;
  }
  const lines = (ocr.lines || []).map((ln) => `Step ${ln.step}: ${ln.latex}`).join(" · ");
  addChat(`이렇게 읽었어요. ${lines}`);
  state.bus?.send("capture", { upload_id: ocr.upload_id });
  state.bus?.send("ocr_preview", { lines: ocr.lines, confidence: ocr.confidence, upload_id: ocr.upload_id, item_index: state.item.n });
}

function holdTalk(on) {
  $("rec").classList.toggle("hold", on);
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    if (on) addChat("이 브라우저는 음성 인식을 아직 지원하지 않아요.");
    return;
  }
  if (on) {
    state.rec = new SR();
    state.rec.lang = "ko-KR";
    state.rec.interimResults = false;
    state.rec.onresult = (e) => {
      const text = e.results?.[0]?.[0]?.transcript || "";
      if (!text) return;
      addChat(text);
      state.bus?.send("stt_text", { text });
    };
    state.rec.start();
  } else {
    try { state.rec?.stop(); } catch {}
  }
}

async function boot() {
  if (!sessionId) {
    $("permText").textContent = "PC 화면의 QR을 스캔해 주세요.";
    return;
  }
  const cfg = await fetch("/api/config").then((r) => r.json());
  state.bus = createBus({
    sessionId,
    supabaseUrl: cfg.supabaseUrl,
    supabaseAnon: cfg.supabaseAnon,
    role: "phone",
    onEvent(evt) {
      if (evt.from === "phone") return;
      if (evt.type === "item_change") {
        setItem({
          n: evt.payload.item_index,
          stem: evt.payload.stem_preview,
          tag: evt.payload.tag,
        });
      }
      if (evt.type === "choice_select") {
        state.choice = evt.payload.choice;
        setHandMode(state.choice === "hand");
        if (evt.payload.choice === "hand") addChat("노트를 프레임 안에 맞추고 셔터를 눌러 주세요.");
      }
      if (evt.type === "hint" && evt.payload?.message) addChat(evt.payload.message);
      if (evt.type === "ocr_confirm" && evt.payload?.result === "retake") addChat("다시 찍어 주세요.");
    },
  });
  await state.bus.ready;
  state.bus.send("hello", { role: "phone" });
  $("chips").onclick = (e) => {
    const choice = e.target.getAttribute("data-choice");
    if (!choice) return;
    state.choice = choice;
    setHandMode(choice === "hand");
    state.bus.send("choice_select", { choice, item_index: state.item.n });
    if (choice === "hand") addChat("노트를 프레임 안에 맞추고 셔터를 눌러 주세요.");
  };
}

$("visBtn").addEventListener("click", () => {
  const hide = $("overlay").classList.toggle("hide");
  $("visBtn").textContent = hide ? "보이기" : "안보이기";
});
$("shutter").addEventListener("click", capture);
["pointerdown"].forEach((ev) => $("rec").addEventListener(ev, (e) => { e.preventDefault(); holdTalk(true); }));
["pointerup", "pointerleave"].forEach((ev) => $("rec").addEventListener(ev, () => holdTalk(false)));
$("btnCam").addEventListener("click", startCamera);
$("gal").addEventListener("click", () => $("file").click());
$("file").addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = async () => {
      const canvas = document.createElement("canvas");
      const scale = Math.min(1, 1280 / Math.max(img.width, img.height));
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      state.choice = "hand";
      setHandMode(true);
      const ocr = await api("/api/ocr", {
        image_b64: canvas.toDataURL("image/jpeg", 0.82),
        session_id: sessionId,
        item_index: state.item.n || 1,
        text: state.item.stem || "",
      });
      if (!ocr.blocked) {
        state.bus?.send("ocr_preview", { lines: ocr.lines, confidence: ocr.confidence, upload_id: ocr.upload_id, item_index: state.item.n });
        addChat("앨범에서 올린 손풀이를 읽었어요.");
      } else addChat(ocr.gate?.message || "다시 올려 주세요.");
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
});

boot();
startCamera();
