import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { MemoryRouter } from "react-router-dom";
import { renderToStaticMarkup } from "react-dom/server";
import { LocalChatGptPlanPage } from "../src/features/assistant/LocalChatGptPlanPage";
import { WorkspaceLocalChat } from "../src/features/workspace-beta/WorkspaceLocalChat";
import { isStudyAppLocalEdition } from "../src/infrastructure/local-companion/localCompanionClient";

describe("StudyApp Local companion boundary", () => {
  it("allows its connection controls only on the StudyApp Local loopback origin", () => {
    expect(isStudyAppLocalEdition({ protocol: "http:", hostname: "127.0.0.1", port: "8766" })).toBe(true);
    expect(isStudyAppLocalEdition({ protocol: "http:", hostname: "localhost", port: "8766" })).toBe(true);
    expect(isStudyAppLocalEdition({ protocol: "http:", hostname: "127.0.0.1", port: "5173" })).toBe(false);
    expect(isStudyAppLocalEdition({ protocol: "https:", hostname: "studyapp.markellosecosystem.com", port: "" })).toBe(false);
    expect(isStudyAppLocalEdition({ protocol: "http:", hostname: "192.168.1.5", port: "8766" })).toBe(false);
  });
});

describe("StudyApp Local page", () => {
  it("keeps the browser/PWA edition informational and cannot render a question form", () => {
    const markup = renderToStaticMarkup(
      createElement(MemoryRouter, null, createElement(LocalChatGptPlanPage)),
    );

    expect(markup).toContain("Available in StudyApp Local");
    expect(markup).toContain("external-link flow");
    expect(markup).not.toContain("local-chatgpt-plan-question");
    expect(markup).not.toContain("Connect with ChatGPT");
  });
});

describe("StudyApp Local Workspace conversation", () => {
  it("renders an explicit, transient question composer without exposing study material", () => {
    const markup = renderToStaticMarkup(createElement(WorkspaceLocalChat));

    expect(markup).toContain("ChatGPT conversation");
    expect(markup).toContain("StudyApp sends only what you type.");
    expect(markup).toContain("Your local ChatGPT plan is ready.");
    expect(markup).toContain("Message ChatGPT");
    expect(markup).toContain("Answers are not saved to your study data.");
    expect(markup).not.toContain("Library/IndexedDB");
    expect(markup).not.toContain('type="file"');
  });
});
