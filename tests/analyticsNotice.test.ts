import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ANALYTICS_NOTICE_DISMISSAL_KEY,
  dismissAnalyticsNotice,
  isAnalyticsNoticeDismissed,
} from "../src/features/analytics/analyticsNotice";

const originalWindow = globalThis.window;
let values: Map<string, string>;

beforeEach(() => {
  values = new Map();
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { localStorage: { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) } },
  });
});

afterEach(() => {
  Object.defineProperty(globalThis, "window", { configurable: true, value: originalWindow });
});

describe("analytics informational notice", () => {
  it("persists only dismissal", () => {
    expect(isAnalyticsNoticeDismissed()).toBe(false);
    dismissAnalyticsNotice();
    expect(values.get(ANALYTICS_NOTICE_DISMISSAL_KEY)).toBe("true");
    expect(isAnalyticsNoticeDismissed()).toBe(true);
  });

  it("continues safely when storage is unavailable", () => {
    Object.defineProperty(globalThis.window, "localStorage", {
      configurable: true,
      value: { getItem: vi.fn(() => { throw new Error("blocked"); }), setItem: vi.fn(() => { throw new Error("blocked"); }) },
    });
    expect(isAnalyticsNoticeDismissed()).toBe(false);
    expect(() => dismissAnalyticsNotice()).not.toThrow();
  });
});
