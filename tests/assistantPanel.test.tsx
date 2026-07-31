import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AssistantPanel } from "../src/features/assistant/AssistantPanel";
import {
  getStudyAppAssistantUrl,
  STUDYAPP_AI_ASSISTANT_URL,
} from "../src/features/assistant/assistantDestination";

describe("AI Assistant two-screen entry point", () => {
  it("renders the introductory screen and safe external Start link", () => {
    const markup = renderToStaticMarkup(
      <AssistantPanel open onClose={() => undefined} />,
    );

    expect(markup).toContain("Study with ChatGPT");
    expect(markup).toContain(
      "Open the dedicated StudyApp AI Assistant in ChatGPT to study, summarize, create flashcards or prepare quizzes.",
    );
    expect(markup).toContain(
      "StudyApp does not automatically send your local data.",
    );
    expect(markup).toContain("View other AI options");
    expect(markup).toContain(`href="${STUDYAPP_AI_ASSISTANT_URL}"`);
    expect(markup).toContain('target="_blank"');
    expect(markup).toContain('rel="noopener noreferrer"');
    expect(markup).toContain('role="dialog"');
    expect(markup).toContain('aria-modal="true"');
  });

  it("does not render any part of the removed three-step workflow", () => {
    const markup = renderToStaticMarkup(
      <AssistantPanel open onClose={() => undefined} />,
    );

    expect(markup).not.toContain("Step 1 of 3");
    expect(markup).not.toContain("Add study material");
    expect(markup).not.toContain("Choose a study goal");
    expect(markup).not.toContain("Prepared request");
    expect(markup).not.toContain('type="file"');
    expect(markup).not.toContain("<textarea");
  });

  it("uses the exact production URL and rejects alternate destinations", () => {
    expect(getStudyAppAssistantUrl(STUDYAPP_AI_ASSISTANT_URL)).toBe(
      STUDYAPP_AI_ASSISTANT_URL,
    );
    expect(getStudyAppAssistantUrl("https://chatgpt.com/")).toBe(
      STUDYAPP_AI_ASSISTANT_URL,
    );
    expect(getStudyAppAssistantUrl("https://example.com/assistant")).toBe(
      STUDYAPP_AI_ASSISTANT_URL,
    );
    expect(getStudyAppAssistantUrl("not a URL")).toBe(
      STUDYAPP_AI_ASSISTANT_URL,
    );
  });

  it("renders nothing while closed", () => {
    expect(
      renderToStaticMarkup(
        <AssistantPanel open={false} onClose={() => undefined} />,
      ),
    ).toBe("");
  });
});
