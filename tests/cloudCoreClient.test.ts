import { describe, expect, it } from "vitest";
import {
  fetchCloudCoreReadiness,
  normalizeCloudCoreBaseUrl,
} from "../src/infrastructure/cloud-core/cloudCoreClient";

describe("normalizeCloudCoreBaseUrl", () => {
  it("normalizes an HTTPS endpoint", () => {
    expect(normalizeCloudCoreBaseUrl(" https://api-test.example.com/ ")).toBe(
      "https://api-test.example.com",
    );
  });

  it("allows HTTP only for local development", () => {
    expect(normalizeCloudCoreBaseUrl("http://localhost:3000/")).toBe(
      "http://localhost:3000",
    );
    expect(() => normalizeCloudCoreBaseUrl("http://api.example.com")).toThrow(
      "Cloud Core must use HTTPS outside local development.",
    );
  });

  it("rejects an empty configuration", () => {
    expect(() => normalizeCloudCoreBaseUrl("  ")).toThrow(
      "Cloud Core is not configured for this build.",
    );
  });
});

describe("fetchCloudCoreReadiness", () => {
  it("requests and validates the readiness endpoint", async () => {
    const requestedUrls: string[] = [];
    const fetchImpl = (async (input: RequestInfo | URL) => {
      requestedUrls.push(String(input));
      return new Response(
        JSON.stringify({
          status: "ready",
          service: "markellos-cloud-core",
          version: "0.1.0",
          timestamp: "2026-07-29T19:35:55.619Z",
          checks: [{ name: "database", status: "up", latencyMs: 18 }],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }) as typeof fetch;

    const health = await fetchCloudCoreReadiness({
      baseUrl: "https://api-test.example.com/",
      fetchImpl,
      timeoutMs: 100,
    });

    expect(requestedUrls).toEqual([
      "https://api-test.example.com/api/v1/health/ready",
    ]);
    expect(health.status).toBe("ready");
    expect(health.checks?.[0]).toEqual({
      name: "database",
      status: "up",
      latencyMs: 18,
    });
  });

  it("rejects invalid health data", async () => {
    const fetchImpl = (async () =>
      new Response(JSON.stringify({ status: "ready" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })) as typeof fetch;

    await expect(
      fetchCloudCoreReadiness({
        baseUrl: "https://api-test.example.com",
        fetchImpl,
      }),
    ).rejects.toThrow("Cloud Core returned an invalid health response.");
  });

  it("reports non-success HTTP responses", async () => {
    const fetchImpl = (async () => new Response(null, { status: 503 })) as typeof fetch;

    await expect(
      fetchCloudCoreReadiness({
        baseUrl: "https://api-test.example.com",
        fetchImpl,
      }),
    ).rejects.toMatchObject({
      name: "CloudCoreConnectionError",
      message: "Cloud Core health check failed with HTTP 503.",
    });
  });
});
