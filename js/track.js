import { createTrack } from "../lib/core/track.mjs";

const layer = window.dataLayer || (window.dataLayer = []);
export const track = createTrack(layer, window.gtag);
window.NL = window.NL || {};
window.NL.track = track;
window.NL.dataLayer = layer;
if (document.getElementById("landingScreen")?.classList.contains("on")) {
  track("view_landing", {});
}
