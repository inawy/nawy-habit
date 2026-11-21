import { isNativeApp } from "./platform";

/**
 * - `downloaded`: the browser downloaded the file.
 * - `shared`: the Android share sheet was shown and the person went through it. The phone does not
 *   tell us where the file went, only that the sheet was used.
 * - `cancelled`: the person closed the share sheet without choosing anything.
 */
export type BackupSaveResult = "downloaded" | "shared" | "cancelled";

/**
 * Loads the two plugins only inside the app. They are returned inside a plain object on purpose:
 * plugin objects are proxies that answer to any property, `then` included, so returning one
 * straight from an async function breaks the promise (see reminder-scheduler.ts).
 */
async function loadPlugins() {
  const [filesystem, share] = await Promise.all([
    import("@capacitor/filesystem"),
    import("@capacitor/share"),
  ]);
  return {
    plugins: {
      Filesystem: filesystem.Filesystem,
      Directory: filesystem.Directory,
      Encoding: filesystem.Encoding,
      Share: share.Share,
    },
  };
}

function isCancel(error: unknown): boolean {
  const message =
    typeof error === "object" && error !== null && "message" in error
      ? String((error as { message: unknown }).message)
      : String(error);
  return /cancel/i.test(message);
}

/**
 * Android's WebView ignores `<a download>` on blob URLs and has no Web Share or file-save API, so
 * the file is written to the app's cache folder (the only place the Share plugin may read from by
 * default) and handed to the system share sheet, where the person picks Drive, Files, a chat...
 */
async function shareFile(filename: string, content: string): Promise<BackupSaveResult> {
  const { plugins } = await loadPlugins();
  const { Filesystem, Directory, Encoding, Share } = plugins;
  const { uri } = await Filesystem.writeFile({
    path: filename,
    data: content,
    directory: Directory.Cache,
    encoding: Encoding.UTF8,
  });
  try {
    await Share.share({
      title: "نسخة احتياطية من عادة",
      dialogTitle: "احفظ النسخة الاحتياطية",
      files: [uri],
    });
    return "shared";
  } catch (error) {
    if (isCancel(error)) return "cancelled";
    throw error;
  }
}

function downloadFile(filename: string, content: string): BackupSaveResult {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return "downloaded";
}

/** Gets a backup file out of the app: a download in the browser, the share sheet on Android. */
export async function saveBackupFile(filename: string, content: string): Promise<BackupSaveResult> {
  return isNativeApp() ? shareFile(filename, content) : downloadFile(filename, content);
}
