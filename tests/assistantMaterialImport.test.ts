import { describe, expect, it } from "vitest";
import {
  limitAssistantMaterialText,
  MAX_ASSISTANT_MATERIAL_LENGTH,
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
});
