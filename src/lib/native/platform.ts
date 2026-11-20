interface CapacitorGlobal {
  isNativePlatform?: () => boolean;
}

/**
 * True only inside the Android app (the Capacitor WebView). Read from the global the native shell
 * injects before the page loads, so the web build never bundles or loads Capacitor to find out.
 */
export function isNativeApp(): boolean {
  if (typeof window === "undefined") return false;
  const capacitor = (window as unknown as { Capacitor?: CapacitorGlobal }).Capacitor;
  return capacitor?.isNativePlatform?.() === true;
}
