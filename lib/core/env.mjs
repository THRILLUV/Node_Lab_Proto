import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

function stripQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

export function loadEnvFile(path, env = process.env) {
  if (!path || !existsSync(path)) return [];
  const loaded = [];
  const text = readFileSync(path, "utf8");
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    const value = stripQuotes(line.slice(eq + 1).trim());
    if (!key) continue;
    if (env[key] !== undefined && env[key] !== "") continue;
    env[key] = value;
    loaded.push(key);
  }
  return loaded;
}

export function loadLocalEnv(cwd = process.cwd(), env = process.env) {
  const loaded = [];
  loaded.push(...loadEnvFile(join(cwd, ".env"), env));
  loaded.push(...loadEnvFile(join(cwd, ".env.local"), env));
  return loaded;
}
