import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

export const NL_FRONTEND_FILES = [
  "consent.mjs",
  "signup-gate.mjs",
  "legal-texts.mjs",
  "onboarding.mjs",
  "social.mjs",
  "auth-validate.mjs",
  "oauth-shared.mjs",
  "env-names.mjs",
];

export function headerFor(name) {
  return `/* drop-in copy of lib/core/${name} — keep in sync via scripts/sync-nl-frontend-lib.mjs */\n`;
}

export function transformCoreModule(source, name) {
  return headerFor(name) + source.replaceAll(".mjs", ".js");
}

export function pairFor(name) {
  return {
    src: join(ROOT, "lib/core", name),
    dest: join(ROOT, "20_src/frontend/lib/nl", name.replace(/\.mjs$/, ".js")),
  };
}

export function syncNlFrontendLib() {
  mkdirSync(join(ROOT, "20_src/frontend/lib/nl"), { recursive: true });
  for (const name of NL_FRONTEND_FILES) {
    const { src, dest } = pairFor(name);
    writeFileSync(dest, transformCoreModule(readFileSync(src, "utf8"), name));
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  syncNlFrontendLib();
}
