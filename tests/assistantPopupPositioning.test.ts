import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ASSISTANT_POPUP_HEIGHT,
  ASSISTANT_POPUP_WIDTH,
  calculateCenteredPopupFeatures,
  openStudyAppAssistant,
  SAFE_COMPANION_FALLBACK_URL,
  validateCompanionUrl,
  type AssistantPopupScreen,
} from "../src/features/assistant/assistantPopupPositioning";

const desktopScreen: AssistantPopupScreen = {
  availHeight: 900,
  availLeft: 100,
  availTop: 40,
  availWidth: 1_440,
};

describe("StudyApp AI Assistant popup", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("uses one centered, bounded popup size with the reduced height", () => {
    expect(ASSISTANT_POPUP_WIDTH).toBe(460);
    expect(ASSISTANT_POPUP_HEIGHT).toBe(600);
    expect(calculateCenteredPopupFeatures(desktopScreen)).toBe(
      [
        "popup=yes",
        "width=460",
        "height=600",
        "left=590",
        "top=190",
        "noopener",
        "noreferrer",
      ].join(","),
    );
  });

  it("uses the current window position when screen offsets are unavailable", () => {
    expect(
      calculateCenteredPopupFeatures({
        availHeight: 500,
        availWidth: 400,
        windowLeft: -400,
        windowTop: 20,
      }),
    ).toContain("width=360,height=460,left=-380,top=20");
  });

  it("allows only approved HTTPS ChatGPT URLs without credentials or ports", () => {
    expect(
      validateCompanionUrl(
        "https://chatgpt.com/g/g-studyapp-ai-assistant",
      ),
    ).toBe("https://chatgpt.com/g/g-studyapp-ai-assistant");
    expect(validateCompanionUrl("http://chatgpt.com/g/example")).toBeNull();
    expect(validateCompanionUrl("https://evil.example/g/example")).toBeNull();
    expect(validateCompanionUrl("https://openai.com/g/example")).toBeNull();
    expect(validateCompanionUrl("https://user:pass@chatgpt.com/")).toBeNull();
    expect(validateCompanionUrl("https://chatgpt.com:444/")).toBeNull();
    expect(validateCompanionUrl("javascript:alert(1)")).toBeNull();
    expect(validateCompanionUrl("data:text/html,unsafe")).toBeNull();
    expect(validateCompanionUrl("file:///tmp/unsafe")).toBeNull();
  });

  it("reports a blocked popup when window.open returns null", () => {
    const openPopup = vi.fn(() => null);

    expect(
      openStudyAppAssistant(
        "https://chatgpt.com/",
        openPopup,
        desktopScreen,
      ),
    ).toEqual({ status: "blocked", url: "https://chatgpt.com/" });
    expect(openPopup).toHaveBeenCalledOnce();
  });

  it("reports success when window.open returns a Window-like object", () => {
    const popup = {} as WindowProxy;
    const openPopup = vi.fn(() => popup);

    expect(
      openStudyAppAssistant(
        "https://chatgpt.com/",
        openPopup,
        desktopScreen,
      ),
    ).toEqual({ status: "opened", url: "https://chatgpt.com/" });
    expect(openPopup).toHaveBeenCalledWith(
      "https://chatgpt.com/",
      "studyapp-ai-assistant",
      expect.stringContaining("height=600"),
    );
  });

  it("does not call window.open for an invalid configured URL", () => {
    const openPopup = vi.fn(() => ({} as WindowProxy));

    expect(
      openStudyAppAssistant(
        "https://user:pass@evil.example/",
        openPopup,
        desktopScreen,
      ),
    ).toEqual({
      status: "invalid-url",
      url: SAFE_COMPANION_FALLBACK_URL,
    });
    expect(openPopup).not.toHaveBeenCalled();
  });

  it("does not contain DOM deletion, a MutationObserver, or a window.open override", () => {
    const positioningSource = readFileSync(
      new URL(
        "../src/features/assistant/assistantPopupPositioning.ts",
        import.meta.url,
      ),
      "utf8",
    );
    const panelSource = readFileSync(
      new URL("../src/features/assistant/AssistantPanel.tsx", import.meta.url),
      "utf8",
    );
    const mainSource = readFileSync(
      new URL("../src/main.tsx", import.meta.url),
      "utf8",
    );
    const assistantSource = `${positioningSource}\n${panelSource}\n${mainSource}`;

    expect(assistantSource).not.toContain("MutationObserver");
    expect(assistantSource).not.toContain("installAssistantPopupPositioning");
    expect(assistantSource).not.toMatch(/window\.open\s*=/);
    expect(assistantSource).not.toMatch(/\.(?:removeChild|replaceChild)\(/);
    expect(assistantSource).not.toMatch(
      /querySelector(?:All)?[\s\S]{0,120}\.remove\(/,
    );
    expect(assistantSource).not.toContain("innerHTML");
  });
});
