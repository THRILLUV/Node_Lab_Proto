import puppeteer from "puppeteer-core";
import { writeFile } from "node:fs/promises";

const BASE = process.env.BASE || "http://127.0.0.1:4178";
const EMAIL = "nodelab.p23.1788256594@gmail.com";
const PASS = "secret12";

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME || "/usr/bin/google-chrome-stable",
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu", "--window-size=1400,900"],
});
const page = await browser.newPage();
page.setDefaultTimeout(45000);
await page.setViewport({ width: 1400, height: 900 });

try {
  await page.goto(BASE + "/", { waitUntil: "networkidle0" });
  await page.evaluate(() => {
    document.getElementById("btn-landing-login")?.click();
  });
  await page.waitForSelector("#login-email", { visible: true });
  await page.type("#login-email", EMAIL);
  await page.type("#login-password", PASS);
  await page.click("#btn-email-login");
  await page.waitForSelector("#appShell", { visible: true });
  await page.evaluate(() => {
    document.querySelector("[data-modal='close']")?.click();
  });
  await page.waitForSelector("#home-file");
  await page.evaluate(async () => {
    const buf = await fetch("/tests/fixtures/exam-mini.pdf").then((r) => r.arrayBuffer());
    const file = new File([buf], "편입수학_연습.pdf", { type: "application/pdf" });
    const dt = new DataTransfer();
    dt.items.add(file);
    const input = document.getElementById("home-file");
    input.files = dt.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.waitForFunction(() => (document.querySelector("#fileChip .file-name")?.textContent || "").includes("편입"));
  await page.click("#btn-home-send");
  await page.waitForFunction(
    () => {
      const items = window.NL?.sessionItems || [];
      const body = document.body.innerText;
      return items.some((it) => /2x\+5=17/.test(it.stem || "")) || body.includes("2x+5=17");
    },
    { timeout: 40000 },
  );
  const info = await page.evaluate(() => {
    const items = window.NL?.sessionItems || [];
    return {
      text: document.body.innerText,
      stems: items.map((it) => it.stem),
      source: window.NL?.sessionSource,
      count: items.length,
    };
  });
  const shot = await page.screenshot({ type: "webp", encoding: "binary", fullPage: true });
  await writeFile("/opt/cursor/artifacts/p15_session_live_pdf.webp", shot);
  const hasLive = (info.stems || []).some((s) => /2x\+5=17/.test(s)) || info.text.includes("2x+5=17");
  const tabs = (info.text.match(/문항 1–(\d+)/) || [])[1] || "";
  console.log(JSON.stringify({
    ok: hasLive,
    tabs,
    count: info.count,
    source: info.source,
    stems: info.stems,
    railHasCanned: info.text.includes("9^{1/4}×3^{-1/2}"),
  }, null, 2));
  if (!hasLive) process.exit(2);
} finally {
  await browser.close();
}
