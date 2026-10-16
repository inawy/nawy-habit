/**
 * The only place that registers the service worker. It refuses in dev,
 * inside iframes, on Lovable preview hosts, and with ?sw=off — and cleans up
 * any stale registration there so previews never serve old cached code.
 */
const SW_URL = "/sw.js";

function isBlockedHost(host: string): boolean {
  const domains = ["lovableproject.com", "lovableproject-dev.com", "beta.lovable.dev"];
  return (
    host.startsWith("id-preview--") ||
    host.startsWith("preview--") ||
    domains.some((d) => host === d || host.endsWith(`.${d}`))
  );
}

async function unregisterAppSw(): Promise<void> {
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(
    regs
      .filter((r) => (r.active ?? r.installing ?? r.waiting)?.scriptURL.endsWith(SW_URL))
      .map((r) => r.unregister()),
  );
}

export async function registerServiceWorker(): Promise<void> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  let inIframe = true;
  try {
    inIframe = window.self !== window.top;
  } catch {
    inIframe = true;
  }
  const off = new URLSearchParams(window.location.search).get("sw") === "off";
  if (!import.meta.env.PROD || inIframe || off || isBlockedHost(window.location.hostname)) {
    await unregisterAppSw();
    return;
  }
  const { registerSW } = await import("virtual:pwa-register");
  registerSW({ immediate: true });
}
