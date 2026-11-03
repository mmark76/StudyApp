export interface ChatGptPlanConnectionStatus {
  connected: boolean;
  connectionState: "connected" | "disconnected" | "unreadable";
  planUsageAuthorized: boolean;
  scope: "current-windows-user";
  connectionId?: string | null;
  message?: string;
}

export interface ChatGptPlanModel {
  slug: string;
  displayName: string;
}

export interface ChatGptPlanAnswer {
  answer: string;
}

export interface ApprovedStudyPassage {
  sourceId: string;
  documentTitle: string;
  page: number;
  text: string;
}

export interface CompleteSummaryPart extends ApprovedStudyPassage {
  section: string;
  citation: string;
}

export class LocalCompanionError extends Error {
  setupRequired: boolean;
  code?: string;

  constructor(message: string, setupRequired = false, code?: string) {
    super(message);
    this.name = "LocalCompanionError";
    this.setupRequired = setupRequired;
    this.code = code;
  }
}

const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost"]);
const STUDYAPP_LOCAL_PORTS = import.meta.env.MODE === "e2e"
  ? new Set(["4173", "8876"])
  : new Set(["8767"]);

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
    STUDYAPP_LOCAL_PORTS.has(currentLocation.port),
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
    const code = typeof responseBody?.code === "string" ? responseBody.code : undefined;
    throw new LocalCompanionError(
      typeof error === "string" ? error : "The local ChatGPT connection could not be completed.",
      setupRequired,
      code,
    );
  }
  return payload as T;
}

export function getChatGptPlanConnection(): Promise<ChatGptPlanConnectionStatus> {
  return request("/api/chatgpt-plan/connection");
}

export async function getChatGptPlanModels(): Promise<ChatGptPlanModel[]> {
  const payload = await request<unknown>("/api/chatgpt-plan/models");
  if (!payload || typeof payload !== "object" || !("models" in payload) || !Array.isArray(payload.models)
    || !payload.models.every((model: unknown) => model && typeof model === "object"
      && "slug" in model && typeof model.slug === "string" && model.slug.length > 0
      && "displayName" in model && typeof model.displayName === "string" && model.displayName.length > 0)) {
    throw new LocalCompanionError("The local ChatGPT model list is invalid.");
  }
  return payload.models as ChatGptPlanModel[];
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

export function askChatGptPlan(question: string, model?: string): Promise<ChatGptPlanAnswer> {
  return request("/api/chatgpt-plan/ask", {
    method: "POST",
    body: JSON.stringify({ confirmExternalRequest: true, question, ...(model ? { model } : {}) }),
  });
}

export function askChatGptPlanWithPdfPassages(
  question: string,
  passages: readonly ApprovedStudyPassage[],
  model?: string,
): Promise<ChatGptPlanAnswer> {
  return request("/api/chatgpt-plan/ask-with-sources", {
    method: "POST",
    body: JSON.stringify({
      confirmExternalRequest: true,
      question,
      ...(model ? { model } : {}),
      passages: passages.map(({ sourceId, documentTitle, page, text }) => ({ sourceId, documentTitle, page, text })),
    }),
  });
}

export function summarizeCompleteDocumentParts(
  phase: "extract" | "combine",
  parts: readonly CompleteSummaryPart[],
  model: string,
  signal?: AbortSignal,
): Promise<ChatGptPlanAnswer> {
  return request("/api/chatgpt-plan/summarize-parts", {
    method: "POST",
    signal,
    body: JSON.stringify({ confirmExternalRequest: true, phase, parts, model }),
  });
}
