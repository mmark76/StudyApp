import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  announcePwaUpdate,
  applyPwaUpdate,
  dismissPwaUpdate,
  getPwaUpdateState,
  setPwaUpdateHandler,
  subscribeToPwaUpdate,
} from "../src/app/pwaUpdate";

describe("PWA update state", () => {
  beforeEach(() => {
    dismissPwaUpdate();
    setPwaUpdateHandler(null);
  });

  it("announces an update without applying or reloading it", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToPwaUpdate(listener);

    announcePwaUpdate();

    expect(getPwaUpdateState()).toEqual({
      isAvailable: true,
      isApplying: false,
      errorCode: null,
    });
    expect(listener).toHaveBeenCalledOnce();
    unsubscribe();
  });

  it("applies an update only after the explicit action", async () => {
    const handler = vi.fn(async () => undefined);
    setPwaUpdateHandler(handler);
    announcePwaUpdate();

    expect(handler).not.toHaveBeenCalled();
    await applyPwaUpdate();

    expect(handler).toHaveBeenCalledOnce();
    expect(getPwaUpdateState().isAvailable).toBe(false);
  });

  it("dismisses an available update without applying it", () => {
    const handler = vi.fn(async () => undefined);
    setPwaUpdateHandler(handler);
    announcePwaUpdate();

    dismissPwaUpdate();

    expect(handler).not.toHaveBeenCalled();
    expect(getPwaUpdateState()).toEqual({
      isAvailable: false,
      isApplying: false,
      errorCode: null,
    });
  });

  it("prevents duplicate update requests while applying", async () => {
    let releaseUpdate: (() => void) | undefined;
    const handler = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          releaseUpdate = resolve;
        }),
    );
    setPwaUpdateHandler(handler);
    announcePwaUpdate();

    const firstRequest = applyPwaUpdate();
    const duplicateRequest = applyPwaUpdate();

    expect(handler).toHaveBeenCalledOnce();
    expect(getPwaUpdateState()).toEqual({
      isAvailable: true,
      isApplying: true,
      errorCode: null,
    });

    releaseUpdate?.();
    await Promise.all([firstRequest, duplicateRequest]);
    expect(getPwaUpdateState().isAvailable).toBe(false);
  });

  it("keeps the prompt available when applying an update fails", async () => {
    setPwaUpdateHandler(async () => {
      throw new Error("service worker failure");
    });
    announcePwaUpdate();

    await applyPwaUpdate();

    expect(getPwaUpdateState()).toEqual({
      isAvailable: true,
      isApplying: false,
      errorCode: "apply-failed",
    });
    expect(JSON.stringify(getPwaUpdateState())).not.toContain(
      "service worker failure",
    );
    expect(JSON.stringify(getPwaUpdateState())).not.toContain(
      "The update could not",
    );
  });
});
