#!/usr/bin/env node
// Runs a worker build with local-only env files hidden, so their values can't
// end up in the deployed worker.
//
// Why: OpenNext copies every .env* file Next reads (.env.local,
// .env.development, ...) into .open-next/cloudflare/next-env.mjs, which ships
// inside the worker code. Staging/prod secrets belong in .env.*.secrets
// (uploaded as Worker secrets), never in the bundle.
//
// Usage: node scripts/build-without-local-env.mjs <command> [args...]
// After the command, the bundled env file is checked: anything other than
// NEXT_PUBLIC_* and a few flags fails the build.

import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, renameSync } from "node:fs";
import { pathToFileURL } from "node:url";
import path from "node:path";

const LOCAL_ONLY = /^\.env(\.local|\.development(\.local)?|\.test(\.local)?)$/;
const SUFFIX = ".hidden-during-deploy";
const ALLOWED = new Set(["PRODUCTION", "STAGING"]);
const root = process.cwd();

// Put back anything a killed earlier run left hidden.
function restore() {
  for (const f of readdirSync(root)) {
    if (f.endsWith(SUFFIX)) renameSync(path.join(root, f), path.join(root, f.slice(0, -SUFFIX.length)));
  }
}

restore();
const hidden = readdirSync(root).filter((f) => LOCAL_ONLY.test(f));
for (const f of hidden) renameSync(path.join(root, f), path.join(root, f + SUFFIX));
for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => { restore(); process.exit(130); });
if (hidden.length) console.log(`[build] hiding ${hidden.join(", ")} during the build`);

let status = 1;
try {
  const [cmd, ...args] = process.argv.slice(2);
  if (!cmd) throw new Error("usage: build-without-local-env.mjs <command> [args...]");
  status = spawnSync(cmd, args, { stdio: "inherit", shell: process.platform === "win32" }).status ?? 1;
} finally {
  restore();
}
if (status !== 0) process.exit(status);

const bundled = path.join(root, ".open-next/cloudflare/next-env.mjs");
if (existsSync(bundled)) {
  const mod = await import(pathToFileURL(bundled).href + `?t=${Date.now()}`);
  const leaked = ["production", "development", "test"].flatMap((mode) =>
    Object.keys(mod[mode] ?? {})
      .filter((k) => !k.startsWith("NEXT_PUBLIC_") && !ALLOWED.has(k))
      .map((k) => `${mode}:${k}`),
  );
  if (leaked.length) {
    console.error(`[build] refusing to deploy: these env vars would ship inside the worker code: ${leaked.join(", ")}`);
    console.error("[build] move them to .env.staging.secrets / .env.production.secrets (Worker secrets).");
    process.exit(1);
  }
  console.log("[build] bundled env check passed (NEXT_PUBLIC_* only)");
}
