import { afterEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { MemoryRouter } from "react-router-dom";
import { renderToStaticMarkup } from "react-dom/server";
import { LocalChatGptPlanPage } from "../src/features/assistant/LocalChatGptPlanPage";
import { WorkspaceLocalChat } from "../src/features/workspace-beta/WorkspaceLocalChat";
import { askChatGptPlanWithPdfPassages, isStudyAppLocalEdition, STUDYAPP_LOCAL_PROTOCOL_URL } from "../src/infrastructure/local-companion/localCompanionClient";

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

  it("sends only the explicitly supplied question and passages after approval", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ answer: "Grounded answer" }) });
    vi.stubGlobal("fetch", fetchMock);
    const passages = [{ sourceId: "S1", documentId: "doc-1", documentTitle: "Biology.pdf", page: 4, text: "Approved excerpt" }];

    await expect(askChatGptPlanWithPdfPassages("What is described?", passages)).resolves.toEqual({ answer: "Grounded answer" });

    const [path, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(path).toBe("/api/chatgpt-plan/ask-with-sources");
    expect(JSON.parse(String(init.body))).toEqual({
      confirmExternalRequest: true,
      question: "What is described?",
      passages: [{ sourceId: "S1", documentTitle: "Biology.pdf", page: 4, text: "Approved excerpt" }],
    });
    expect(String(init.body)).not.toContain("unselected");
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
    expect(markup).toContain("Open StudyApp Local");
    expect(markup).not.toContain("local-chatgpt-plan-question");
    expect(markup).not.toContain("Connect with ChatGPT");
  });
});

describe("StudyApp Local Workspace conversation", () => {
  it("offers a transient question composer and approved local file attachments", () => {
    const markup = renderToStaticMarkup(createElement(WorkspaceLocalChat));

    expect(markup).toContain("ChatGPT conversation");
    expect(markup).toContain("Only your question and expressly approved excerpts are sent.");
    expect(markup).toContain("Ask ChatGPT or add study files with +.");
    expect(markup).toContain("Message ChatGPT");
    expect(markup).toContain("Attach study files");
    expect(markup).not.toContain("Library/IndexedDB");
    expect(markup).toContain('accept=".pdf,.txt,.md,.csv"');
  });
});
