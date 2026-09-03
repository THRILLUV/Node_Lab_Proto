import { createBus } from "./bus.js";
import { companionUrl } from "../lib/core/companion.mjs";

export async function openPair() {
  if (!window.NL.sessionId && window.NL.bindStudySession) {
    await window.NL.bindStudySession("2026");
  }
  const url = companionUrl({ origin: location.origin, sessionId: window.NL.sessionId || "" });
  window.NL.openModal?.(
    `<h2>폰으로 잇기</h2><p>같은 세션이 카메라 위에 떠요. QR을 스캔하거나 링크를 열면 됩니다.</p><canvas id="nl-qr" width="200" height="200"></canvas><p><a href="${url}" target="_blank" rel="noopener">${url}</a></p><div class="modal-actions"><button class="primary-btn" type="button" data-modal="close">닫기</button></div>`
  );
  const canvas = document.getElementById("nl-qr");
  if (canvas && window.QRCode) {
    window.QRCode.toCanvas(canvas, url, { width: 200, margin: 1 });
  }
  const cfg = await fetch("/api/config").then((r) => r.json());
  if (window.NL.sessionId && !window.NL.bus) {
    window.NL.bus = createBus({
      sessionId: window.NL.sessionId,
      supabaseUrl: cfg.supabaseUrl,
      supabaseAnon: cfg.supabaseAnon,
      role: "pc",
      onEvent() {},
    });
  }
}

document.getElementById("pairBtn")?.addEventListener("click", () => {
  openPair();
});
