import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { MemoryRouter } from "react-router-dom";
import { renderToStaticMarkup } from "react-dom/server";
import { LocalChatGptPlanPage } from "../src/features/assistant/LocalChatGptPlanPage";
import { isStudyAppLocalEdition } from "../src/infrastructure/local-companion/localCompanionClient";

describe("StudyApp Local companion boundary", () => {
  it("allows its connection controls only on an HTTP loopback origin", () => {
    expect(isStudyAppLocalEdition({ protocol: "http:", hostname: "127.0.0.1" })).toBe(true);
    expect(isStudyAppLocalEdition({ protocol: "http:", hostname: "localhost" })).toBe(true);
    expect(isStudyAppLocalEdition({ protocol: "https:", hostname: "studyapp.markellosecosystem.com" })).toBe(false);
    expect(isStudyAppLocalEdition({ protocol: "http:", hostname: "192.168.1.5" })).toBe(false);
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
