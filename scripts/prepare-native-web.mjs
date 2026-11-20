#!/usr/bin/env node
// Prepares the folder Capacitor copies into the Android app (`webDir` in capacitor.config.json).
// Run after `GH_PAGES=1 bun run build`, which writes the static single-page app to .output/public.
//
// Inside the app the files are bundled, so there is no service worker: it would only add a second
// cache that could serve stale code after an update.
import { copyFileSync, cpSync, existsSync, readdirSync, rmSync, statSync } from "node:fs";

const SRC = ".output/public";
const OUT = "dist-native";

if (!existsSync(`${SRC}/_shell.html`)) {
  console.error(`Missing ${SRC}/_shell.html. Run \`GH_PAGES=1 bun run build\` first.`);
  process.exit(1);
}

rmSync(OUT, { recursive: true, force: true });
cpSync(SRC, OUT, { recursive: true });
// Capacitor opens index.html; the static shell is the same single-page app GitHub Pages serves.
copyFileSync(`${OUT}/_shell.html`, `${OUT}/index.html`);

const removed = [];
for (const name of readdirSync(OUT)) {
  if (name === "sw.js" || (name.startsWith("workbox-") && name.endsWith(".js"))) {
    rmSync(`${OUT}/${name}`);
    removed.push(name);
  }
}

if (!existsSync(`${OUT}/assets`) || statSync(`${OUT}/index.html`).size === 0) {
  console.error("The native web folder is incomplete: index.html or assets/ is missing.");
  process.exit(1);
}

console.log(`${OUT} ready (removed: ${removed.join(", ") || "nothing"}).`);
