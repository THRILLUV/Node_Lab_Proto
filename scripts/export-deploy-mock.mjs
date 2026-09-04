import { build } from "esbuild";
import { mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "handoff/nodelab-deploy-mock.html");
const TMP_BUNDLE = join(ROOT, "handoff/.full-mock-bundle.js");

function dataUrl(path) {
  const ext = path.endsWith(".png") ? "png" : "octet-stream";
  return `data:image/${ext};base64,${readFileSync(path).toString("base64")}`;
}

await build({
  entryPoints: [join(ROOT, "handoff/full-mock-adapter.js")],
  outfile: TMP_BUNDLE,
  bundle: true,
  format: "iife",
  platform: "browser",
  target: ["chrome110", "safari16"],
  minify: true,
  legalComments: "none",
});

let html = readFileSync(join(ROOT, "index.html"), "utf8");
const motion = readFileSync(join(ROOT, "web/css/motion.css"), "utf8");
const bundle = readFileSync(TMP_BUNDLE, "utf8");
unlinkSync(TMP_BUNDLE);

const assets = {};
for (let n = 1; n <= 30; n += 1) {
  const key = `q${String(n).padStart(2, "0")}`;
  assets[key] = dataUrl(join(ROOT, `items/${key}.png`));
}
assets.page01 = dataUrl(join(ROOT, "items/page-01.png"));

html = html.replace(
  '<link rel="stylesheet" href="/web/css/motion.css"/>',
  `<style>${motion}</style>`,
);
html = html.replaceAll("items/page-01.png", assets.page01);
for (let n = 1; n <= 30; n += 1) {
  const key = `q${String(n).padStart(2, "0")}`;
  html = html.replaceAll(`items/${key}.png`, assets[key]);
}

const scriptsStart = html.indexOf('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>');
if (scriptsStart < 0) throw new Error("module script block not found");
html = html.slice(0, scriptsStart);

const banner = `
<div class="handoff-banner">
  <div><b>NodeLab 더미 인수인계 목업</b><span>API·DB·실제 로그인 없이 화면과 더미 데이터가 작동합니다.</span></div>
  <div class="handoff-actions">
    <button type="button" data-mock-action="landing">처음부터</button>
    <button type="button" data-mock-action="login">로그인</button>
    <button type="button" data-mock-action="signup">신규 가입</button>
    <button type="button" data-mock-action="member">완료 회원</button>
    <button type="button" data-mock-action="guest">게스트</button>
  </div>
</div>
<style>
.handoff-banner{position:fixed;z-index:999;left:14px;right:14px;top:10px;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:9px 12px;border-radius:14px;background:#1d1d1f;color:#fff;box-shadow:0 12px 32px rgba(15,23,42,.24);font-size:12px}
.handoff-banner>div:first-child{display:flex;align-items:center;gap:10px}.handoff-banner span{color:rgba(255,255,255,.66)}
.handoff-actions{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}.handoff-actions button{border:0;border-radius:999px;padding:6px 10px;background:rgba(255,255,255,.13);color:#fff;font:inherit;font-size:11px;font-weight:750;cursor:pointer}.handoff-actions button:hover{background:#fff;color:#1d1d1f}
@media(max-width:760px){.handoff-banner{position:fixed;display:block}.handoff-banner span{display:none}.handoff-actions{margin-top:6px;justify-content:flex-start}.public-shell,.app{padding-top:76px}}
</style>`;

html = html.replace("<body>", `<body>${banner}`);
html += `<script>window.NL_MOCK_ASSETS=${JSON.stringify(assets)};</script>\n<script>${bundle}</script>\n</body>\n</html>\n`;

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, html);
console.log(`wrote ${OUT} (${(Buffer.byteLength(html) / 1024 / 1024).toFixed(2)} MB)`);
