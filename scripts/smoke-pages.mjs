#!/usr/bin/env node

const target = process.env.PAGES_URL || "https://ada.nawy.app/";
const root = new URL("/", target);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function get(path, { allowNotFound = false } = {}) {
  const url = new URL(path, root);
  const response = await fetch(url, {
    redirect: "follow",
    headers: { "user-agent": "Nawy-Habit-Pages-Smoke-Test" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok && !(allowNotFound && response.status === 404)) {
    throw new Error(`GET ${url.pathname} returned HTTP ${response.status}`);
  }
  return { response, body: await response.arrayBuffer(), url };
}

async function retry(operation, label) {
  let lastError;
  for (let attempt = 1; attempt <= 8; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt < 8) await new Promise((resolve) => setTimeout(resolve, 5_000));
    }
  }
  throw new Error(`${label} failed after 8 attempts: ${lastError?.message || lastError}`);
}

function isPng(buffer, expectedSize) {
  const bytes = Buffer.from(buffer);
  return (
    bytes.length > 24 &&
    bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) &&
    bytes.readUInt32BE(16) === expectedSize &&
    bytes.readUInt32BE(20) === expectedSize
  );
}

const deployed = await retry(() => get("/"), "deployed homepage");
const html = Buffer.from(deployed.body).toString("utf8");
assert(html.toLowerCase().includes("<html"), "Homepage does not contain an HTML document");
assert(html.includes("/manifest.webmanifest"), "Homepage does not link the PWA manifest");

const manifestResult = await retry(() => get("/manifest.webmanifest"), "PWA manifest");
const manifest = JSON.parse(Buffer.from(manifestResult.body).toString("utf8"));
assert(
  manifest.start_url === "/" && manifest.scope === "/",
  "Manifest start_url/scope must target the domain root",
);
assert(manifest.display === "standalone", "Manifest display mode must be standalone");
assert(Array.isArray(manifest.icons), "Manifest icons are missing");

for (const size of [192, 512]) {
  const icon = manifest.icons.find((item) => item.sizes === `${size}x${size}`);
  assert(icon, `Manifest is missing its ${size}px icon`);
  const iconUrl = new URL(icon.src, manifestResult.url);
  const iconResponse = await retry(() => get(iconUrl.href), `${size}px PWA icon`);
  assert(isPng(iconResponse.body, size), `PWA icon ${icon.src} is not a valid ${size}x${size} PNG`);
}

const shellResult = await retry(() => get("/_shell.html"), "offline app shell");
const shell = Buffer.from(shellResult.body).toString("utf8");
const swResult = await retry(() => get("/sw.js"), "service worker");
const sw = Buffer.from(swResult.body).toString("utf8");
assert(sw.includes("precacheAndRoute"), "Deployed service worker has no Workbox precache handler");
assert(
  sw.includes("_shell.html"),
  "Deployed service worker does not precache the offline app shell",
);

const rootAssetPattern = new RegExp('(?:src|href)="(/assets/[^"]+)"', "g");
const assetPaths = [...shell.matchAll(rootAssetPattern)].map((match) => match[1]);
assert(assetPaths.length > 0, "Offline shell has no root-relative built assets");
for (const path of [...new Set(assetPaths)].slice(0, 3)) {
  await retry(() => get(path), `built asset ${path}`);
}

// GitHub Pages serves 404.html for client-side routes. The HTTP status may remain 404;
// the important check is that the returned document is the app shell, not a hosting error.
const deepLink = await retry(() => get("/settings", { allowNotFound: true }), "settings deep link");
const deepLinkHtml = Buffer.from(deepLink.body).toString("utf8");
assert(
  deepLinkHtml.includes("/assets/") && deepLinkHtml.includes("/manifest.webmanifest"),
  "The /settings deep link did not receive the application shell",
);

console.log(
  `PAGES_SMOKE_OK: ${root.origin} — homepage, manifest, 192/512px PNG icons, service worker, app shell, built assets, and /settings deep link.`,
);
