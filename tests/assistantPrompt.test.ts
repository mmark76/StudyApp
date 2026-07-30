import { describe, expect, it } from "vitest";
import { buildCompanionPrompt } from "../src/features/assistant/AssistantPanel";

describe("StudyApp AI Assistant clipboard payload", () => {
  it("builds a concise payload from the selected goal and material", () => {
    const prompt = buildCompanionPrompt("summarize", "A short chapter.", "en");

    expect(prompt).toBe([
      "STUDYAPP TASK: summarize",
      "RESPONSE LANGUAGE: en",
      "",
      "STUDY MATERIAL:",
      "A short chapter.",
    ].join("\n"));
    expect(prompt).not.toContain("Summarize the study material");
  });

  it("includes a custom request and Greek response language", () => {
    const prompt = buildCompanionPrompt(
      "custom",
      "Πρώτη θεωρία και δεύτερη θεωρία.",
      "el",
      "Σύγκρινε τις δύο θεωρίες σε πίνακα.",
    );

    expect(prompt).toContain("STUDYAPP TASK: custom");
    expect(prompt).toContain("RESPONSE LANGUAGE: el");
    expect(prompt).toContain("CUSTOM REQUEST:\nΣύγκρινε τις δύο θεωρίες σε πίνακα.");
    expect(prompt).toContain("STUDY MATERIAL:\nΠρώτη θεωρία και δεύτερη θεωρία.");
  });
});
