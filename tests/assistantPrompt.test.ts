import { describe, expect, it, vi } from "vitest";
import {
  buildCompanionPrompt,
  copyToClipboard,
} from "../src/features/assistant/AssistantPanel";

describe("StudyApp AI Assistant clipboard payload", () => {
  it("builds a concise payload from the selected goal and material", () => {
    const prompt = buildCompanionPrompt("summarize", "A short chapter.", "en");

    expect(prompt).toBe([
      "STUDYAPP TASK: summarize",
      "RESPONSE LANGUAGE: en",
      "",
      "INSTRUCTIONS:",
      "Summarize the study material using clear headings and concise key points. Include the most important terms and conclusions.",
      "",
      "STUDY MATERIAL:",
      "A short chapter.",
    ].join("\n"));
  });

  it("includes custom instructions and Greek response language", () => {
    const prompt = buildCompanionPrompt(
      "custom",
      "Πρώτη θεωρία και δεύτερη θεωρία.",
      "el",
      "Σύγκρινε τις δύο θεωρίες σε πίνακα.",
    );

    expect(prompt).toContain("STUDYAPP TASK: custom");
    expect(prompt).toContain("RESPONSE LANGUAGE: el");
    expect(prompt).toContain("INSTRUCTIONS:\nΣύγκρινε τις δύο θεωρίες σε πίνακα.");
    expect(prompt).toContain("STUDY MATERIAL:\nΠρώτη θεωρία και δεύτερη θεωρία.");
  });

  it("copies the complete prepared request after the goal is selected", async () => {
    const writeText = vi.fn(async () => undefined);
    const prompt = buildCompanionPrompt(
      "explain",
      "A complete source passage.",
      "en",
    );

    await expect(copyToClipboard(prompt, writeText)).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith(prompt);
    expect(prompt).toContain("STUDYAPP TASK: explain");
    expect(prompt).toContain("RESPONSE LANGUAGE: en");
    expect(prompt).toContain("INSTRUCTIONS:\nExplain the main ideas");
    expect(prompt).toContain("STUDY MATERIAL:\nA complete source passage.");
  });
});
