import { renderToStaticMarkup } from "react-dom/server";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  ASSISTANT_AVATAR_ACTIVATION_DURATION_MS,
  ASSISTANT_OPENING_STATE_DURATION_MS,
  ASSISTANT_START_COPY,
  AssistantPanel,
  AssistantStartLink,
  createAssistantOpeningController,
  type AssistantOpeningState,
} from "../src/features/assistant/AssistantPanel";
import {
  getStudyAppAssistantUrl,
  STUDYAPP_AI_ASSISTANT_URL,
} from "../src/features/assistant/assistantDestination";
import {
  ASSISTANT_WELCOME_COMPLETE_LABEL,
  ASSISTANT_WELCOME_COPY,
} from "../src/features/assistant/TypewriterWelcome";

describe("AI Assistant two-screen entry point", () => {
  it("renders the introductory screen and safe external Start link", () => {
    const markup = renderToStaticMarkup(
      <AssistantPanel open onClose={() => undefined} />,
    );

    expect(markup).toContain("Study with ChatGPT");
    expect(markup).toContain(ASSISTANT_WELCOME_COPY.en);
    expect(markup).toContain(ASSISTANT_WELCOME_COMPLETE_LABEL.en);
    expect(markup).toContain("assistant-typewriter-accessible");
    expect(markup).toContain("assistant-typewriter-visual");
    expect(markup).toContain('aria-hidden="true"');
    expect(markup).not.toContain("aria-live");
    expect(markup).not.toContain(
      "StudyApp does not automatically send your local data.",
    );
    expect(markup).not.toContain(
      "Το StudyApp δεν αποστέλλει αυτόματα τα τοπικά δεδομένα σου.",
    );
    expect(markup).not.toContain("assistant-privacy-note");
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

describe("Assistant Start activation presentation", () => {
  it("keeps the normal Start action as the exact native external anchor", () => {
    const markup = renderToStaticMarkup(
      <AssistantStartLink
        assistantUrl={STUDYAPP_AI_ASSISTANT_URL}
        isOpening={false}
        language="en"
        onActivate={() => undefined}
      />,
    );

    expect(markup).toContain("<a");
    expect(markup).toContain(`href="${STUDYAPP_AI_ASSISTANT_URL}"`);
    expect(markup).toContain('target="_blank"');
    expect(markup).toContain('rel="noopener noreferrer"');
    expect(markup).toContain(">Start</span>");
    expect(markup).not.toContain("assistant-start-spinner");
    expect(markup).not.toContain("aria-disabled");
  });

  it.each([
    ["English", "en", ASSISTANT_START_COPY.en],
    ["Greek", "el", ASSISTANT_START_COPY.el],
  ] as const)(
    "renders the localized %s opening state without changing the destination",
    (_name, language, copy) => {
      const markup = renderToStaticMarkup(
        <AssistantStartLink
          assistantUrl={STUDYAPP_AI_ASSISTANT_URL}
          isOpening
          language={language}
          onActivate={() => undefined}
        />,
      );

      expect(markup).toContain(`href="${STUDYAPP_AI_ASSISTANT_URL}"`);
      expect(markup).toContain('target="_blank"');
      expect(markup).toContain('rel="noopener noreferrer"');
      expect(markup).toContain(`aria-label="${copy.openingAccessibleName}"`);
      expect(markup).toContain('aria-disabled="true"');
      expect(markup).toContain('tabindex="-1"');
      expect(markup).toContain("assistant-start-link is-opening");
      expect(markup).toContain(
        '<span aria-hidden="true" class="assistant-start-spinner"></span>',
      );
      expect(markup).toContain(`>${copy.openingLabel}</span>`);
    },
  );
});

describe("Assistant opening-state controller", () => {
  const frames: AssistantOpeningState[] = [];

  beforeEach(() => {
    frames.length = 0;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  function makeOpeningController() {
    return createAssistantOpeningController((state) => {
      frames.push({ ...state });
    });
  }

  it("starts immediately, ends the avatar effect at 500 ms, and resets at 800 ms", () => {
    const controller = makeOpeningController();
    controller.start();

    expect(controller.getState()).toEqual({
      isAvatarActive: true,
      isOpening: true,
    });
    expect(vi.getTimerCount()).toBe(2);

    vi.advanceTimersByTime(ASSISTANT_AVATAR_ACTIVATION_DURATION_MS - 1);
    expect(controller.getState().isAvatarActive).toBe(true);
    vi.advanceTimersByTime(1);
    expect(controller.getState()).toEqual({
      isAvatarActive: false,
      isOpening: true,
    });

    vi.advanceTimersByTime(
      ASSISTANT_OPENING_STATE_DURATION_MS -
        ASSISTANT_AVATAR_ACTIVATION_DURATION_MS -
        1,
    );
    expect(controller.getState().isOpening).toBe(true);
    vi.advanceTimersByTime(1);
    expect(controller.getState()).toEqual({
      isAvatarActive: false,
      isOpening: false,
    });
    expect(vi.getTimerCount()).toBe(0);
  });

  it("replaces existing timers when a new local activation starts", () => {
    const controller = makeOpeningController();
    controller.start();
    vi.advanceTimersByTime(300);

    controller.start();
    expect(vi.getTimerCount()).toBe(2);
    vi.advanceTimersByTime(499);
    expect(controller.getState()).toEqual({
      isAvatarActive: true,
      isOpening: true,
    });
    vi.advanceTimersByTime(1);
    expect(controller.getState()).toEqual({
      isAvatarActive: false,
      isOpening: true,
    });
    vi.advanceTimersByTime(300);
    expect(controller.getState()).toEqual({
      isAvatarActive: false,
      isOpening: false,
    });
  });

  it("clears opening work on close or screen change and reopens in the normal state", () => {
    const controller = makeOpeningController();
    controller.start();
    controller.reset();

    expect(controller.getState()).toEqual({
      isAvatarActive: false,
      isOpening: false,
    });
    expect(vi.getTimerCount()).toBe(0);

    vi.advanceTimersByTime(5_000);
    expect(frames.at(-1)).toEqual({
      isAvatarActive: false,
      isOpening: false,
    });
  });

  it("prevents stale state updates after disposal", () => {
    const controller = makeOpeningController();
    controller.start();
    const frameCount = frames.length;

    controller.dispose();
    vi.advanceTimersByTime(5_000);
    controller.start();

    expect(frames).toHaveLength(frameCount);
    expect(vi.getTimerCount()).toBe(0);
  });
});
