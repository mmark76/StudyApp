import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AssistantFileButton,
  AssistantPanel,
  AssistantReviewStep,
  copyToClipboard,
  getAssistantClipboardStatusMessage,
  getAssistantImportStatusMessage,
  getAssistantPopupStatusMessage,
  moveCompanionStep,
  type CompanionStepScreen,
} from "../src/features/assistant/AssistantPanel";

const englishText = (english: string) => english;
const greekText = (_english: string, greek: string) => greek;
const preparedPrompt = "STUDYAPP TASK: summarize\n\nSTUDY MATERIAL:\nChapter";

describe("ChatGPT Companion step flow", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("moves forward and back through all three steps without changing other data", () => {
    const studyData = {
      material: "Material that must remain available.",
      taskId: "summarize",
    };
    let screen: CompanionStepScreen = "material";

    screen = moveCompanionStep(screen, "next");
    expect(screen).toBe("goal");
    screen = moveCompanionStep(screen, "next");
    expect(screen).toBe("review");
    screen = moveCompanionStep(screen, "back");
    expect(screen).toBe("goal");
    screen = moveCompanionStep(screen, "back");
    expect(screen).toBe("material");
    expect(studyData).toEqual({
      material: "Material that must remain available.",
      taskId: "summarize",
    });
  });

  it("supports repeated Step 2 to Step 3 transitions", () => {
    let screen: CompanionStepScreen = "goal";

    for (let index = 0; index < 5; index += 1) {
      screen = moveCompanionStep(screen, "next");
      expect(screen).toBe("review");
      screen = moveCompanionStep(screen, "back");
      expect(screen).toBe("goal");
    }
  });

  it("reports successful clipboard writes without changing the prompt", async () => {
    const writeText = vi.fn(async () => undefined);

    await expect(copyToClipboard(`  ${preparedPrompt}  `, writeText)).resolves.toBe(
      true,
    );
    expect(writeText).toHaveBeenCalledWith(preparedPrompt);
  });

  it("keeps the flow available when clipboard writing rejects", async () => {
    const writeText = vi.fn(async () => {
      throw new Error("Clipboard denied");
    });

    await expect(copyToClipboard(preparedPrompt, writeText)).resolves.toBe(
      false,
    );
    expect(writeText).toHaveBeenCalledOnce();
  });

  it("renders clipboard success and a blocked popup independently", () => {
    const markup = renderToStaticMarkup(
      <AssistantReviewStep
        clipboardOutcome="copied"
        onBack={() => undefined}
        popupResult={{ status: "blocked", url: "https://chatgpt.com/" }}
        preparedPrompt={preparedPrompt}
        text={englishText}
      />,
    );

    expect(markup).toContain("Back to previous step");
    expect(markup.match(/Continue in the StudyApp AI Assistant/g)).toHaveLength(
      2,
    );
    expect(markup).toContain("assistant-popup-fallback");
    expect(markup).toContain("assistant popup was blocked");
    expect(markup).toContain("The request was copied");
    expect(markup).toContain("STUDYAPP TASK: summarize");
  });

  it("renders popup success and clipboard failure independently", () => {
    const markup = renderToStaticMarkup(
      <AssistantReviewStep
        clipboardOutcome="failed"
        onBack={() => undefined}
        popupResult={{ status: "opened", url: "https://chatgpt.com/" }}
        preparedPrompt={preparedPrompt}
        text={englishText}
      />,
    );

    expect(markup).toContain("popup opened");
    expect(markup).toContain("Clipboard access failed");
    expect(markup).toContain("Prepared request");
    expect(markup).not.toContain("assistant-popup-fallback");
  });

  it("keeps a safe fallback link and manual prompt for an invalid URL", () => {
    const markup = renderToStaticMarkup(
      <AssistantReviewStep
        clipboardOutcome="failed"
        onBack={() => undefined}
        popupResult={{ status: "invalid-url", url: "https://chatgpt.com/" }}
        preparedPrompt={preparedPrompt}
        text={englishText}
      />,
    );

    expect(markup).toContain("configured assistant link is not allowed");
    expect(markup).toContain('href="https://chatgpt.com/"');
    expect(markup).toContain("assistant-popup-fallback");
    expect(markup).toContain("STUDYAPP TASK: summarize");
  });

  it("uses independent localized messages for popup and clipboard outcomes", () => {
    expect(
      getAssistantPopupStatusMessage(
        { status: "blocked", url: "https://chatgpt.com/" },
        englishText,
      ),
    ).toContain("popup was blocked");
    expect(
      getAssistantPopupStatusMessage(
        { status: "invalid-url", url: "https://chatgpt.com/" },
        englishText,
      ),
    ).toContain("not allowed");
    expect(getAssistantClipboardStatusMessage("copied", englishText)).toContain(
      "copied",
    );
    expect(getAssistantClipboardStatusMessage("failed", englishText)).toContain(
      "failed",
    );
  });

  it("uses the assistant secondary-action variant without changing primary actions", () => {
    const panelMarkup = renderToStaticMarkup(
      <AssistantPanel open onClose={() => undefined} />,
    );
    const fileButtonMarkup = renderToStaticMarkup(
      <AssistantFileButton
        action="choose"
        isImporting={false}
        onChange={() => undefined}
        text={englishText}
      />,
    );

    expect(panelMarkup).toContain(
      'class="button secondary assistant-secondary-action"',
    );
    expect(panelMarkup).toContain('class="button primary"');
    expect(fileButtonMarkup).toContain(
      'class="button secondary assistant-secondary-action assistant-file-button"',
    );
    expect(fileButtonMarkup).toContain('type="file"');
    expect(fileButtonMarkup).not.toContain("assistant-imported-file-icon");
  });

  it("exposes a disabled file-action state without making it look active", () => {
    const markup = renderToStaticMarkup(
      <AssistantFileButton
        action="replace"
        isImporting
        onChange={() => undefined}
        text={englishText}
      />,
    );

    expect(markup).toContain('aria-disabled="true"');
    expect(markup).toContain('aria-busy="true"');
    expect(markup).toContain("disabled");
    expect(markup).toContain("Reading...");
  });

  it("uses filename-free localized import and clipboard messages", () => {
    const fileName = "Synopsi_Kefalaiou_1_Gnostiki_Psychologia.pdf";
    const englishSuccess = getAssistantImportStatusMessage(
      true,
      false,
      englishText,
    );
    const greekSuccess = getAssistantImportStatusMessage(
      true,
      false,
      greekText,
    );
    const englishFailure = getAssistantImportStatusMessage(
      false,
      false,
      englishText,
    );

    expect(englishSuccess).toBe(
      "The extracted text was copied to the clipboard.",
    );
    expect(greekSuccess).toBe(
      "Το εξαγόμενο κείμενο αντιγράφηκε στο πρόχειρο.",
    );
    expect(englishFailure).toContain("Clipboard access was unavailable.");
    expect(englishFailure).not.toContain("copied to the clipboard");
    expect([englishSuccess, greekSuccess, englishFailure]).not.toContain(
      expect.stringContaining(fileName),
    );
    expect([englishSuccess, greekSuccess, englishFailure].join(" ")).not.toContain(
      "Imported",
    );
  });

  it("keeps truncation information in the clipboard failure state", () => {
    expect(
      getAssistantImportStatusMessage(false, true, englishText),
    ).toContain("first 12,000 extracted characters");
    expect(
      getAssistantImportStatusMessage(false, true, greekText),
    ).toContain("πρώτοι 12.000 χαρακτήρες");
  });
});
