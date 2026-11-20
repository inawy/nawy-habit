// Drives the app inside the emulator through its WebView (Chrome DevTools protocol, plain
// WebSocket), the way a person would: add a habit, open Settings, read the reminder diagnostics and
// press the test button, then ask the phone whether the notification was posted.
//
// Reminder slots are fixed (10:00, 16:00, 20:30), so the test cannot wait for a real slot. It proves
// the whole path instead: permission, notification channel, scheduling, pending count, and display.
import { execSync } from "node:child_process";

const out = process.argv[2] ?? "emulator-out";
const log = (...a) => console.log("[e2e]", ...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const targets = await (await fetch("http://127.0.0.1:9222/json")).json();
const target = targets.find((t) => t.type === "page") ?? targets[0];
if (!target) throw new Error("no WebView page found");
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((res, rej) => {
  ws.onopen = res;
  ws.onerror = () => rej(new Error("websocket failed"));
});
let id = 0;
const pending = new Map();
ws.onmessage = (m) => {
  const msg = JSON.parse(m.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
  } else if (msg.method === "Runtime.exceptionThrown") {
    log("page exception:", JSON.stringify(msg.params.exceptionDetails?.exception?.description));
  }
};
const send = (method, params = {}) =>
  new Promise((res) => {
    id += 1;
    pending.set(id, res);
    ws.send(JSON.stringify({ id, method, params }));
  });
await send("Runtime.enable");
/** Runs `code` in the page and returns its value. */
async function ev(code) {
  const r = await send("Runtime.evaluate", {
    expression: `(async () => { ${code} })()`,
    awaitPromise: true,
    returnByValue: true,
  });
  if (r.result?.exceptionDetails) {
    throw new Error(r.result.exceptionDetails.exception?.description ?? "page error");
  }
  return r.result?.result?.value;
}

const HELPERS = `
  const q = (s, root = document) => root.querySelector(s);
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const waitFor = async (fn, ms = 20000) => {
    const end = Date.now() + ms;
    while (Date.now() < end) { const v = fn(); if (v) return v; await wait(250); }
    return null;
  };
  const setInput = (el, v) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  };
`;

const fail = (reason) => {
  log("FAILED:", reason);
  try {
    execSync(`adb exec-out screencap -p > ${out}/failed.png`);
  } catch {
    /* the screenshot is a bonus */
  }
  ws.close();
  process.exit(1);
};

await sleep(3000);
const env = await ev(`return {
  cap: window.Capacitor?.isNativePlatform?.(), platform: window.Capacitor?.getPlatform?.(),
  lang: navigator.language, title: document.title, path: location.pathname };`);
log("native?", JSON.stringify(env));
if (!env?.cap) fail("the app is not running inside Capacitor");

// 1) Add one habit through the real form, so there is something to remind about.
const added = await ev(`${HELPERS}
  const fab = await waitFor(() => q('button[aria-label="إضافة عادة"]'));
  if (!fab) return 'no add button';
  fab.click();
  const name = await waitFor(() => q('#habit-name'));
  if (!name) return 'no name field';
  setInput(name, 'Emulator habit');
  await wait(300);
  const submit = q('form button[type=submit]');
  if (!submit) return 'no submit button';
  submit.click();
  await wait(2500);
  return 'ok';`);
log("add habit:", added);
if (added !== "ok") fail(`could not add a habit (${added})`);
execSync(`adb exec-out screencap -p > ${out}/after-add.png`);

// 2) Open Settings the way the router would, then read the reminder diagnostics.
const opened = await ev(`${HELPERS}
  const link = q('a[href="/settings"]');
  if (link) link.click();
  else { history.pushState(null, '', '/settings'); window.dispatchEvent(new PopStateEvent('popstate')); }
  const card = await waitFor(() => q('[data-testid="reminder-diag"]'));
  return card ? 'ok' : 'diagnostics card not found on ' + location.pathname;`);
log("settings:", opened);
if (opened !== "ok") fail(opened);

const diag = await ev(`${HELPERS}
  await wait(3000); // let the sync finish scheduling
  const card = q('[data-testid="reminder-diag"]');
  return {
    permission: card.getAttribute('data-permission'),
    pending: Number(card.getAttribute('data-pending')),
    build: card.getAttribute('data-build'),
    text: card.textContent,
  };`);
log("diagnostics:", JSON.stringify(diag));
if (diag.permission !== "granted") fail(`notification permission is ${diag.permission}`);
if (!(diag.pending > 0)) fail(`no reminders are pending (${diag.pending}) after adding a habit`);
execSync(`adb exec-out screencap -p > ${out}/settings.png`);

// 3) The test notification, as the person presses it.
const pressed = await ev(`${HELPERS}
  const btn = q('[data-testid="reminder-test"]');
  if (!btn) return false;
  btn.click(); await wait(1000); return true;`);
log("test button pressed:", pressed);
if (!pressed) fail("test button not found");
await sleep(15_000);
const dump = execSync("adb shell dumpsys notification --noredact").toString();
const shown = /android\.title=String \(تجربة عادة\)/.test(dump);
log("test notification posted:", shown);

ws.close();
if (!shown) fail("the test notification was not posted");
log(`OK: permission granted, ${diag.pending} reminders pending, test notification posted`);
