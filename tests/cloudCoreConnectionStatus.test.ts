import { describe, expect, it } from "vitest";
import {
  getCloudCoreConnectionDescription,
  getCloudCoreConnectionLabel,
  type CloudCoreConnectionState,
} from "../src/infrastructure/cloud-core/useCloudCoreConnection";

const availableState: CloudCoreConnectionState = {
  status: "available",
  checkedAt: "2026-07-30T00:00:00.000Z",
  health: {
    status: "ready",
    service: "markellos-cloud-core",
    version: "0.1.0",
    timestamp: "2026-07-30T00:00:00.000Z",
    checks: [{ name: "database", status: "up", latencyMs: 4 }],
  },
};

describe("Cloud Core connection presentation", () => {
  it("maps connection states to concise assistant labels", () => {
    expect(getCloudCoreConnectionLabel({ status: "checking" })).toBe("Checking");
    expect(getCloudCoreConnectionLabel(availableState)).toBe("Online");
    expect(
      getCloudCoreConnectionLabel({
        status: "unavailable",
        message: "Cloud Core could not be reached.",
        checkedAt: "2026-07-30T00:00:00.000Z",
      }),
    ).toBe("Offline");
  });

  it("keeps the detailed health message for diagnostics", () => {
    expect(getCloudCoreConnectionDescription(availableState)).toBe(
      "Connected to markellos-cloud-core v0.1.0. Database: up (4 ms).",
    );
  });

  it("returns the connection error for an unavailable service", () => {
    expect(
      getCloudCoreConnectionDescription({
        status: "unavailable",
        message: "Cloud Core could not be reached.",
        checkedAt: "2026-07-30T00:00:00.000Z",
      }),
    ).toBe("Cloud Core could not be reached.");
  });
});
