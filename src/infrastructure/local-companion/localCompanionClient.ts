export interface ChatGptPlanConnectionStatus {
  connected: boolean;
  connectionState: "connected" | "disconnected" | "unreadable";
  planUsageAuthorized: boolean;
  scope: "current-windows-user";
  message?: string;
}

export interface ChatGptPlanAnswer {
  answer: string;
}

export class LocalCompanionError extends Error {
  setupRequired: boolean;

  constructor(message: string, setupRequired = false) {
    super(message);
    this.name = "LocalCompanionError";
    this.setupRequired = setupRequired;
  }
}

const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost"]);
const STUDYAPP_LOCAL_PORT = "8766";

export const STUDYAPP_LOCAL_PROTOCOL_URL = "studyapp-local://open";

export function isStudyAppLocalEdition(
  locationValue?: Pick<Location, "hostname" | "port" | "protocol">,
): boolean {
  const currentLocation = locationValue ?? (
    typeof window === "undefined" ? undefined : window.location
  );
  return Boolean(
    currentLocation &&
    currentLocation.protocol === "http:" &&
    LOCAL_HOSTS.has(currentLocation.hostname) &&
    currentLocation.port === STUDYAPP_LOCAL_PORT,
  );
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  const response = await fetch(path, {
    ...init,
    cache: "no-store",
    headers,
  });
  const payload: unknown = await response.json();
  if (!response.ok || !payload || typeof payload !== "object") {
    const responseBody = payload as Record<string, unknown> | null;
    const error = responseBody && "error" in responseBody
      ? responseBody.error
      : "The local ChatGPT connection could not be completed.";
    const setupRequired = responseBody?.setupRequired === true;
    throw new LocalCompanionError(
      typeof error === "string" ? error : "The local ChatGPT connection could not be completed.",
      setupRequired,
    );
  }
  return payload as T;
}

export function getChatGptPlanConnection(): Promise<ChatGptPlanConnectionStatus> {
  return request("/api/chatgpt-plan/connection");
}

export function startChatGptPlanConnection(): Promise<ChatGptPlanConnectionStatus> {
  return request("/api/chatgpt-plan/connection", {
    method: "POST",
    body: JSON.stringify({ confirmConnection: true }),
  });
}

export function prepareChatGptPlanConnection(): Promise<{ state: "SETUP_STARTED" }> {
  return request("/api/chatgpt-plan/setup", {
    method: "POST",
    body: JSON.stringify({ confirmSetup: true }),
  });
}

export function removeChatGptPlanConnection(): Promise<ChatGptPlanConnectionStatus> {
  return request("/api/chatgpt-plan/connection", {
    method: "DELETE",
    body: JSON.stringify({ confirmRemoval: true }),
  });
}

export function askChatGptPlan(question: string): Promise<ChatGptPlanAnswer> {
  return request("/api/chatgpt-plan/ask", {
    method: "POST",
    body: JSON.stringify({ confirmExternalRequest: true, question }),
  });
}
