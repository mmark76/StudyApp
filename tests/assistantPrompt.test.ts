import { describe, expect, it } from "vitest";
import { buildCompanionPrompt } from "../src/features/assistant/AssistantPanel";

describe("ChatGPT Companion instructions", () => {
  it("builds an English study prompt from the selected goal and material", () => {
    const prompt = buildCompanionPrompt("summarize", "A short chapter.", "en");

    expect(prompt).toContain("Summarize the study material");
    expect(prompt).toContain("Answer in English.");
    expect(prompt).toContain("STUDY MATERIAL:\nA short chapter.");
  });

  it("uses the custom request and Greek response language", () => {
    const prompt = buildCompanionPrompt(
      "custom",
      "Πρώτη θεωρία και δεύτερη θεωρία.",
      "el",
      "Σύγκρινε τις δύο θεωρίες σε πίνακα.",
    );

    expect(prompt).toContain("Σύγκρινε τις δύο θεωρίες σε πίνακα.");
    expect(prompt).toContain("Απάντησε στα ελληνικά.");
    expect(prompt).toContain("ΥΛΙΚΟ ΜΕΛΕΤΗΣ:\nΠρώτη θεωρία και δεύτερη θεωρία.");
  });
});
