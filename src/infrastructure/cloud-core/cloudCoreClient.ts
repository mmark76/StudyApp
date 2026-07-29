export type CloudCoreHealthStatus = "ok" | "ready";

export interface CloudCoreHealthCheck {
  name: string;
  status: string;
  latencyMs?: number;
}

export interface CloudCoreHealthResponse {
  status: CloudCoreHealthStatus;
  service: string;
  version: string;
  timestamp: string;
  checks?: CloudCoreHealthCheck[];
}

export interface CloudCoreRequestOptions {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

export class CloudCoreConnectionError extends Error {
  public constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "CloudCoreConnectionError";
  }
}

const defaultTimeoutMs = 5_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isHealthCheck(value: unknown): value is CloudCoreHealthCheck {
  if (!isRecord(value) || typeof value.name !== "string" || typeof value.status !== "string") {
    return false;
  }

  return value.latencyMs === undefined || (typeof value.latencyMs === "number" && Number.isFinite(value.latencyMs));
}

function parseHealthResponse(value: unknown): CloudCoreHealthResponse {
  if (
    !isRecord(value) ||
    (value.status !== "ok" && value.status !== "ready") ||
    typeof value.service !== "string" ||
    typeof value.version !== "string" ||
    typeof value.timestamp !== "string" ||
    (value.checks !== undefined && (!Array.isArray(value.checks) || !value.checks.every(isHealthCheck)))
  ) {
    throw new CloudCoreConnectionError("Cloud Core returned an invalid health response.");
  }

  return {
    status: value.status,
    service: value.service,
    version: value.version,
    timestamp: value.timestamp,
    checks: value.checks,
  };
}

export function normalizeCloudCoreBaseUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new CloudCoreConnectionError("Cloud Core is not configured for this build.");
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch (error) {
    throw new CloudCoreConnectionError("Cloud Core has an invalid URL.", { cause: error });
  }

  const isLocalDevelopment =
    url.protocol === "http:" && (url.hostname === "localhost" || url.hostname === "127.0.0.1");
  if (url.protocol !== "https:" && !isLocalDevelopment) {
    throw new CloudCoreConnectionError("Cloud Core must use HTTPS outside local development.");
  }

  url.hash = "";
  url.search = "";
  url.pathname = url.pathname.replace(/\/+$/, "");

  return url.toString().replace(/\/$/, "");
}

export function getConfiguredCloudCoreUrl(): string {
  return normalizeCloudCoreBaseUrl(import.meta.env.VITE_CLOUD_CORE_URL ?? "");
}

export async function fetchCloudCoreReadiness(
  options: CloudCoreRequestOptions = {},
): Promise<CloudCoreHealthResponse> {
  const baseUrl = normalizeCloudCoreBaseUrl(options.baseUrl ?? import.meta.env.VITE_CLOUD_CORE_URL ?? "");
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? defaultTimeoutMs;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(`${baseUrl}/api/v1/health/ready`, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new CloudCoreConnectionError(`Cloud Core health check failed with HTTP ${response.status}.`);
    }

    const payload: unknown = await response.json();
    return parseHealthResponse(payload);
  } catch (error) {
    if (error instanceof CloudCoreConnectionError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new CloudCoreConnectionError("Cloud Core did not respond in time.", { cause: error });
    }

    throw new CloudCoreConnectionError("Cloud Core could not be reached.", { cause: error });
  } finally {
    window.clearTimeout(timeout);
  }
}
