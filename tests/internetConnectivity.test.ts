import { describe, expect, it } from "vitest";
import { getInternetConnectivityStatus } from "../src/shared/hooks/useInternetConnectivity";

describe("internet connectivity status", () => {
  it("maps the browser online signal to the online state", () => {
    expect(getInternetConnectivityStatus(true)).toBe("online");
  });

  it("maps the browser offline signal to the offline state", () => {
    expect(getInternetConnectivityStatus(false)).toBe("offline");
  });
});
