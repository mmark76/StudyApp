import { describe, expect, it } from "vitest";
import {
  disposePdfLoadingTask,
  limitAssistantMaterialText,
  MAX_ASSISTANT_MATERIAL_LENGTH,
  unwrapStudyAppPreparedInstructions,
} from "../src/features/assistant/assistantMaterialImport";

describe("assistant material import", () => {
  it("normalizes imported text before showing it for review", () => {
    expect(limitAssistantMaterialText("  First\r\nSecond\u0000  ")).toEqual({
      text: "First\nSecond",
      truncated: false,
    });
  });

  it("limits imported content to the editable assistant material boundary", () => {
    const result = limitAssistantMaterialText("x".repeat(MAX_ASSISTANT_MATERIAL_LENGTH + 5));

    expect(result.text).toHaveLength(MAX_ASSISTANT_MATERIAL_LENGTH);
    expect(result.truncated).toBe(true);
  });

  it("keeps only the study material from an imported English StudyApp prompt", () => {
    const result = unwrapStudyAppPreparedInstructions([
      "Create 10 concise study flashcards from the material.",
      "Answer in English.",
      "Use only the study material below. If it does not contain enough information, say so clearly.",
      "STUDY MATERIAL:",
      "Actual imported chapter text",
    ].join("\n\n"));

    expect(result).toEqual({
      text: "Actual imported chapter text",
      removed: true,
    });
  });

  it("keeps only the study material from an imported Greek StudyApp prompt", () => {
    const result = unwrapStudyAppPreparedInstructions([
      "Δημιούργησε περίληψη του υλικού.",
      "Απάντησε στα ελληνικά.",
      "Χρησιμοποίησε μόνο το παρακάτω υλικό.",
      "ΥΛΙΚΟ ΜΕΛΕΤΗΣ:",
      "Το πραγματικό κείμενο του κεφαλαίου",
    ].join("\n\n"));

    expect(result).toEqual({
      text: "Το πραγματικό κείμενο του κεφαλαίου",
      removed: true,
    });
  });

  it("does not strip ordinary material that merely contains a study-material heading", () => {
    const text = "Course notes\n\nSTUDY MATERIAL:\nA definition and an example.";

    expect(unwrapStudyAppPreparedInstructions(text)).toEqual({
      text,
      removed: false,
    });
  });

  it("does not let a PDF cleanup failure replace extracted study text", async () => {
    await expect(disposePdfLoadingTask({
      destroy() {
        throw new TypeError("destroy is not a function");
      },
    })).resolves.toBeUndefined();
  });

  it("allows PDF cleanup when no destroy function is available", async () => {
    await expect(disposePdfLoadingTask({})).resolves.toBeUndefined();
  });
});
