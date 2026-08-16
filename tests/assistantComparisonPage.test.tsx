import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import {
  AI_OPTION_COMPARISON_ROWS,
  AssistantComparisonPage,
} from "../src/features/assistant/AssistantComparisonPage";

describe("AI options comparison page", () => {
  it("keeps the user-facing comparison focused and ends with user cost", () => {
    expect(AI_OPTION_COMPARISON_ROWS).toHaveLength(16);
    expect(AI_OPTION_COMPARISON_ROWS[0]?.label).toEqual({
      en: "What is used",
      el: "Τι χρησιμοποιείται",
    });
    expect(AI_OPTION_COMPARISON_ROWS.at(-1)?.label).toEqual({
      en: "Cost for the user",
      el: "Κόστος για τον χρήστη",
    });
  });

  it("renders the three modes with their current availability", () => {
    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <AssistantComparisonPage />
      </MemoryRouter>,
    );

    expect(markup).toContain("Compare AI options");
    expect(markup).toContain("1. Custom GPT");
    expect(markup).toContain("2. ChatGPT App / MCP");
    expect(markup).toContain("3. StudyApp AI");
    expect(markup).toContain("Available");
    expect(markup).toContain("Coming soon");
    expect(markup).toContain("ChatGPT account — Free or Paid");
    expect(markup).toContain("Not active yet — no charges yet");
    expect(markup).toContain('href="/ai-assistant-guide"');
  });

  it("keeps Greek copy for every comparison row", () => {
    for (const row of AI_OPTION_COMPARISON_ROWS) {
      expect(row.label.el.length).toBeGreaterThan(0);
      expect(row.customGpt.el.length).toBeGreaterThan(0);
      expect(row.mcp.el.length).toBeGreaterThan(0);
      expect(row.studyAppAi.el.length).toBeGreaterThan(0);
    }
  });
});
