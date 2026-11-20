/** Which build is running. CI sets VITE_BUILD_SHA; local development shows "dev". */
export const BUILD_INFO = {
  sha: String(import.meta.env["VITE_BUILD_SHA"] ?? "dev").slice(0, 7),
} as const;
