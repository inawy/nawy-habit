import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { saveBackupFile } from "./backup-file";

const mocks = vi.hoisted(() => ({
  writeFile: vi.fn(),
  share: vi.fn(),
}));

// Like the real ones, these are proxies that answer to ANY property; `then` throws so returning a
// plugin from an async function (which would break the promise) fails here instead of on a phone.
vi.mock("@capacitor/filesystem", () => ({
  Filesystem: new Proxy(
    { writeFile: mocks.writeFile },
    {
      get(target, prop: string) {
        if (prop === "then") throw new Error("Filesystem.then() is not implemented on android");
        return target[prop as "writeFile"];
      },
    },
  ),
  Directory: { Cache: "CACHE" },
  Encoding: { UTF8: "utf8" },
}));
vi.mock("@capacitor/share", () => ({
  Share: new Proxy(
    { share: mocks.share },
    {
      get(target, prop: string) {
        if (prop === "then") throw new Error("Share.then() is not implemented on android");
        return target[prop as "share"];
      },
    },
  ),
}));

const setNative = (native: boolean) => {
  (window as unknown as { Capacitor?: unknown }).Capacitor = native
    ? { isNativePlatform: () => true }
    : undefined;
};

describe("saveBackupFile", () => {
  beforeEach(() => {
    mocks.writeFile.mockReset().mockResolvedValue({ uri: "file:///cache/nawy.json" });
    mocks.share.mockReset().mockResolvedValue({ activityType: "x" });
  });
  afterEach(() => {
    setNative(false);
    vi.restoreAllMocks();
  });

  describe("inside the Android app", () => {
    beforeEach(() => setNative(true));

    it("writes the file to the cache folder and hands that file to the share sheet", async () => {
      await expect(saveBackupFile("nawy.json", '{"a":1}')).resolves.toBe("shared");
      expect(mocks.writeFile).toHaveBeenCalledWith({
        path: "nawy.json",
        data: '{"a":1}',
        directory: "CACHE",
        encoding: "utf8",
      });
      expect(mocks.share).toHaveBeenCalledWith(
        expect.objectContaining({ files: ["file:///cache/nawy.json"] }),
      );
    });

    it("reports a closed share sheet as cancelled, not as saved", async () => {
      mocks.share.mockRejectedValue(new Error("Share canceled"));
      await expect(saveBackupFile("nawy.json", "{}")).resolves.toBe("cancelled");
    });

    it("does not hide real failures", async () => {
      mocks.share.mockRejectedValue(new Error("no activity found"));
      await expect(saveBackupFile("nawy.json", "{}")).rejects.toThrow("no activity found");
    });

    it("does not share anything if the file could not be written", async () => {
      mocks.writeFile.mockRejectedValue(new Error("disk full"));
      await expect(saveBackupFile("nawy.json", "{}")).rejects.toThrow("disk full");
      expect(mocks.share).not.toHaveBeenCalled();
    });
  });

  describe("in a browser", () => {
    it("downloads through a link and never touches the native plugins", async () => {
      const create = vi.fn(() => "blob:test");
      const revoke = vi.fn();
      Object.assign(URL, { createObjectURL: create, revokeObjectURL: revoke });
      const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

      await expect(saveBackupFile("nawy.json", "{}")).resolves.toBe("downloaded");
      expect(create).toHaveBeenCalledTimes(1);
      expect(click).toHaveBeenCalledTimes(1);
      expect(mocks.writeFile).not.toHaveBeenCalled();
      expect(mocks.share).not.toHaveBeenCalled();
    });
  });
});
