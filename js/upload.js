import { canStartFromHome } from "../lib/core/upload.mjs";

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

  window.NL.canStartFromHome = () => canStartFromHome({ fileName: window.NL.homeFileName || "" });
  window.NL.openHomePicker = openPicker;
}

initUpload();
