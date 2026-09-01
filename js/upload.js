import { persistStudySession } from "../lib/core/persist.mjs";
import { plateSrc } from "../lib/core/plate.mjs";
import { canStartFromHome, homeGateText, shouldCreateSession } from "../lib/core/upload.mjs";

export function initUpload() {
  const input = document.getElementById("home-file");
  const nameEl = document.querySelector("#fileChip .file-name");
  window.NL = window.NL || {};

  function setFile(file) {
    const fileName = file?.name || "";
    window.NL.homeFile = file || null;
    window.NL.homeFileName = fileName;
    if (nameEl && fileName) nameEl.textContent = fileName;
    window.NL.setAttached?.(Boolean(fileName), fileName);
  }

  function openPicker() {
    input?.click();
  }

  input?.addEventListener("change", () => {
    const file = input.files && input.files[0];
    if (file) setFile(file);
  });

  ["chip-upload", "btn-attach", "lbl-attach"].forEach((id) => {
    document.getElementById(id)?.addEventListener("click", (e) => {
      e.preventDefault();
      openPicker();
    });
  });

  window.NL.plateSrc = plateSrc;
  fetch("/questions.json")
    .then((r) => r.json())
    .then((bank) => {
      window.NL.bank = bank;
    })
    .catch(() => {
      window.NL.bank = [];
    });
  window.NL.canStartFromHome = () => canStartFromHome({ fileName: window.NL.homeFileName || "" });
  window.NL.openHomePicker = openPicker;
  window.NL.shouldCreateSession = shouldCreateSession;
  window.NL.gateHome = async () => {
    const text = homeGateText({
      text: document.getElementById("homeInput")?.value || "",
      fileName: window.NL.homeFileName || "",
    });
    const res = await fetch("/api/gate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ text }),
    });
    return res.json();
  };
  window.NL.bindStudySession = async (examKey) => {
    const res = await fetch("/api/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: "{}",
    });
    const json = await res.json();
    const session_id = json.session_id;
    window.NL.sessionId = session_id;
    const userId = window.NL.sb?.auth
      ? (await window.NL.sb.auth.getUser())?.data?.user?.id
      : null;
    if (window.NL.sb) {
      try {
        await persistStudySession(window.NL.sb, {
          user_id: userId || null,
          exam_key: examKey || "2026",
          session_id,
        });
      } catch (err) {
        console.warn("nl study session", err);
      }
    }
    return session_id;
  };
}

initUpload();
