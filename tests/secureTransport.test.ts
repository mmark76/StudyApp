import { describe, expect, it, vi } from "vitest";
import {
  enforceSecureTransport,
  getSecureTransportUrl,
} from "../src/app/secureTransport";

describe("secure transport", () => {
  it("upgrades a public HTTP URL without losing its route or query", () => {
    expect(getSecureTransportUrl("http://studyapp.example/library?view=all#/quiz"))
      .toBe("https://studyapp.example/library?view=all#/quiz");
  });

  it("allows HTTPS and local HTTP development URLs", () => {
    expect(getSecureTransportUrl("https://studyapp.example/")).toBeNull();
    expect(getSecureTransportUrl("http://localhost:5173/#/library")).toBeNull();
    expect(getSecureTransportUrl("http://127.0.0.1:4173/#/library")).toBeNull();
  });

  it("replaces an insecure public location before the application starts", () => {
    const replace = vi.fn();

    expect(enforceSecureTransport({
      href: "http://studyapp.example/#/progress",
      replace,
    })).toBe(true);
    expect(replace).toHaveBeenCalledWith("https://studyapp.example/#/progress");
  });
});
