import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { pathToFileURL } from "node:url";
import session from "../api/session.mjs";
import gate from "../api/gate.mjs";
import ocr from "../api/ocr.mjs";
import ocrConfirm from "../api/ocr-confirm.mjs";
import hint from "../api/hint.mjs";
import variant from "../api/variant.mjs";
import config from "../api/config.mjs";

const routes = {
  "/api/session": session,
  "/api/gate": gate,
  "/api/ocr": ocr,
  "/api/ocr-confirm": ocrConfirm,
  "/api/hint": hint,
  "/api/variant": variant,
  "/api/config": config,
};

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

export function mimeFor(ext) {
  return MIME[String(ext || "").toLowerCase()] || "application/octet-stream";
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, "http://127.0.0.1");
  const path = url.pathname === "/m" ? "/m.html" : url.pathname === "/" ? "/index.html" : url.pathname;
  if (routes[path]) return routes[path](req, res);
  try {
    const file = await readFile(join(process.cwd(), path));
    res.setHeader("content-type", mimeFor(extname(path)));
    res.end(file);
  } catch {
    res.statusCode = 404;
    res.end("not found");
  }
});

const port = Number(process.env.PORT || 4173);

function isMain() {
  const entry = process.argv[1];
  return Boolean(entry) && import.meta.url === pathToFileURL(entry).href;
}

if (isMain()) {
  server.listen(port, "127.0.0.1", () => {
    console.log(`NodeLab local http://127.0.0.1:${port}`);
  });
}
