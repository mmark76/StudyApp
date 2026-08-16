import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import {
  AI_OPTION_COMPARISON_ROWS,
  AssistantComparisonPage,
} from "../src/features/assistant/AssistantComparisonPage";

describe("AI options comparison page", () => {
  it("keeps the user-facing comparison focused and ends with user cost", () => {
    expect(AI_OPTION_COMPARISON_ROWS).toHaveLength(17);
    expect(AI_OPTION_COMPARISON_ROWS[0]?.label).toEqual({
      en: "What is used",
      el: "Τι χρησιμοποιείται",
    });
    expect(AI_OPTION_COMPARISON_ROWS[1]?.label).toEqual({
      en: "AI integration with StudyApp",
      el: "Βαθμός ενσωμάτωσης AI στο StudyApp",
    });
    expect(AI_OPTION_COMPARISON_ROWS[1]?.customGpt.el).toBe("Βασικός · ●○○");
    expect(AI_OPTION_COMPARISON_ROWS[1]?.mcp.el).toBe("Υψηλός · ●●○");
    expect(AI_OPTION_COMPARISON_ROWS[1]?.studyAppAi.el).toBe("Πλήρης · ●●●");
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
    expect(markup).toContain("AI integration with StudyApp");
    expect(markup).toContain("Basic · ●○○");
    expect(markup).toContain("High · ●●○");
    expect(markup).toContain("Full · ●●●");
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