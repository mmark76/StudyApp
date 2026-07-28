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
      errorMessage: null,
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

  it("keeps the prompt available when applying an update fails", async () => {
    setPwaUpdateHandler(async () => {
      throw new Error("service worker failure");
    });
    announcePwaUpdate();

    await applyPwaUpdate();

    expect(getPwaUpdateState()).toEqual({
      isAvailable: true,
      isApplying: false,
      errorMessage: "The update could not be applied. Your work is unchanged; try again when convenient.",
    });
  });
});
