import { afterEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { MemoryRouter } from "react-router-dom";
import { renderToStaticMarkup } from "react-dom/server";
import { LocalChatGptPlanPage } from "../src/features/assistant/LocalChatGptPlanPage";
import { SourcesPage } from "../src/features/sources/SourcesPage";
import { WorkspaceLocalChat } from "../src/features/workspace-beta/WorkspaceLocalChat";
import { askChatGptPlan, getChatGptPlanModels, isStudyAppLocalEdition, STUDYAPP_LOCAL_PROTOCOL_URL } from "../src/infrastructure/local-companion/localCompanionClient";

afterEach(() => vi.unstubAllGlobals());

describe("StudyApp Local companion boundary", () => {
  it("allows its connection controls only on the StudyApp Local loopback origin", () => {
    expect(isStudyAppLocalEdition({ protocol: "http:", hostname: "127.0.0.1", port: "8767" })).toBe(true);
    expect(isStudyAppLocalEdition({ protocol: "http:", hostname: "localhost", port: "8767" })).toBe(true);
    expect(isStudyAppLocalEdition({ protocol: "http:", hostname: "127.0.0.1", port: "8766" })).toBe(false);
    expect(isStudyAppLocalEdition({ protocol: "http:", hostname: "127.0.0.1", port: "5173" })).toBe(false);
    expect(isStudyAppLocalEdition({ protocol: "https:", hostname: "studyapp.markellosecosystem.com", port: "" })).toBe(false);
    expect(isStudyAppLocalEdition({ protocol: "http:", hostname: "192.168.1.5", port: "8766" })).toBe(false);
  });

  it("uses the soft yellow structuring warning only in the web edition", () => {
    vi.stubGlobal("window", {
      name: "studyapp-workspace-sources",
      location: { protocol: "https:", hostname: "studyapp.markellosecosystem.com", port: "" },
    });
    const webMarkup = renderToStaticMarkup(
      createElement(MemoryRouter, null, createElement(SourcesPage)),
    );

    expect(webMarkup).toContain("workspace-beta-ai-structuring-unavailable--web");
    expect(webMarkup).not.toContain("workspace-beta-ai-structuring-unavailable--local");

    vi.stubGlobal("window", {
      name: "studyapp-workspace-sources",
      location: { protocol: "http:", hostname: "127.0.0.1", port: "8767" },
    });
    const localMarkup = renderToStaticMarkup(
      createElement(MemoryRouter, null, createElement(SourcesPage)),
    );

    expect(localMarkup).toContain("workspace-beta-ai-structuring-unavailable--local");
    expect(localMarkup).not.toContain("workspace-beta-ai-structuring-unavailable--web");
  });

  it("reads account-specific models and sends the selected model", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ models: [{ slug: "model-b", displayName: "Model B" }] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ answer: "Answer" }) });
    vi.stubGlobal("fetch", fetchMock);

    await expect(getChatGptPlanModels()).resolves.toEqual([{ slug: "model-b", displayName: "Model B" }]);
    await askChatGptPlan("Question", "model-b");

    expect(fetchMock.mock.calls[0][0]).toBe("/api/chatgpt-plan/models");
    expect(JSON.parse(String((fetchMock.mock.calls[1][1] as RequestInit).body))).toEqual({
      confirmExternalRequest: true, question: "Question", model: "model-b",
    });
  });

  it("rejects an invalid model catalog", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ models: [{ slug: "model-b" }] }) }));
    await expect(getChatGptPlanModels()).rejects.toThrow("model list is invalid");
  });
});

describe("StudyApp Local page", () => {
  it("keeps the browser/PWA edition informational and cannot render a question form", () => {
    const markup = renderToStaticMarkup(
      createElement(MemoryRouter, null, createElement(LocalChatGptPlanPage)),
    );

    expect(markup).toContain("Available in StudyApp Local");
    expect(markup).toContain("external-link flow");
    expect(markup).toContain(`href="${STUDYAPP_LOCAL_PROTOCOL_URL}"`);
    expect(markup).toContain("Click to open only if already installed");
    expect(markup).not.toContain("local-chatgpt-plan-question");
    expect(markup).not.toContain("Connect with ChatGPT");
  });
});

describe("StudyApp Local Workspace conversation", () => {
  it("offers a transient direct-question composer while RAG is unavailable", () => {
    const markup = renderToStaticMarkup(createElement(WorkspaceLocalChat));

    expect(markup).toContain("ChatGPT conversation");
    expect(markup).toContain("Only the question you submit is sent.");
    expect(markup).toContain("RAG is still under construction and not available.");
    expect(markup).toContain("Ask ChatGPT.");
    expect(markup).toContain("Message ChatGPT");
    expect(markup).toContain("workspace-local-chat-input-bar");
    expect(markup).toContain("Model");
    expect(markup).toContain("Refresh models");
    expect(markup).toContain('placeholder="Ask ChatGPT"');
    expect(markup).toContain('class="workspace-local-chat-send"');
    expect(markup).not.toContain("Attach study files");
    expect(markup).not.toContain("Find excerpts");
    expect(markup).not.toContain("Library/IndexedDB");
    expect(markup).not.toContain('accept=".pdf,.docx,.pptx,.txt,.md,.csv"');
  });
});
