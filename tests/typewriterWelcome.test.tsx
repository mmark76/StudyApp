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
  ASSISTANT_WELCOME_COMPLETE_LABEL,
  ASSISTANT_WELCOME_COPY,
  createTypewriterController,
  DEFAULT_TYPEWRITER_TIMING,
  getApproximateTypingDurationMs,
  getTypewriterDelay,
  TypewriterWelcome,
} from "../src/features/assistant/TypewriterWelcome";

interface CapturedFrame {
  isTyping: boolean;
  visibleText: string;
}

function makeController() {
  const frames: CapturedFrame[] = [];
  const controller = createTypewriterController((frame) => {
    frames.push({ ...frame });
  });

  return {
    controller,
    frames,
    latest: () => frames.at(-1),
  };
}

describe("TypewriterWelcome presentation", () => {
  it.each([
    ["English", ASSISTANT_WELCOME_COPY.en, ASSISTANT_WELCOME_COMPLETE_LABEL.en],
    ["Greek", ASSISTANT_WELCOME_COPY.el, ASSISTANT_WELCOME_COMPLETE_LABEL.el],
  ])(
    "makes the complete %s message available to screen readers immediately",
    (_language, text, completeLabel) => {
      const markup = renderToStaticMarkup(
        <TypewriterWelcome
          completeLabel={completeLabel}
          restartKey={text}
          text={text}
        />,
      );

      expect(markup).toContain(
        `<p class="assistant-typewriter-accessible">${text}</p>`,
      );
      expect(markup).toContain(`aria-label="${completeLabel}"`);
      expect(markup).toContain('class="assistant-typewriter-visual"');
      expect(markup).toContain('aria-hidden="true"');
      expect(markup).not.toContain("aria-live");
    },
  );

  it("starts with partial visual output and a decorative cursor when motion is allowed", () => {
    const markup = renderToStaticMarkup(
      <TypewriterWelcome
        completeLabel={ASSISTANT_WELCOME_COMPLETE_LABEL.en}
        restartKey="en"
        text={ASSISTANT_WELCOME_COPY.en}
      />,
    );

    expect(markup).toContain('class="assistant-typewriter-visual"');
    expect(markup).toContain('class="assistant-typewriter-cursor"');
    expect(markup).not.toContain("disabled");
  });
});

describe("deterministic typewriter controller", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it("waits before the first character and then uses the slower ordinary delay", () => {
    const { controller, latest } = makeController();
    controller.start("ABC");

    expect(latest()).toEqual({ isTyping: true, visibleText: "" });
    expect(vi.getTimerCount()).toBe(1);

    vi.advanceTimersByTime(DEFAULT_TYPEWRITER_TIMING.initialDelayMs - 1);
    expect(latest()?.visibleText).toBe("");

    vi.advanceTimersByTime(1);
    expect(latest()).toEqual({ isTyping: true, visibleText: "A" });

    vi.advanceTimersByTime(DEFAULT_TYPEWRITER_TIMING.characterDelayMs - 1);
    expect(latest()).toEqual({ isTyping: true, visibleText: "A" });

    vi.advanceTimersByTime(1);
    expect(latest()).toEqual({ isTyping: true, visibleText: "AB" });
  });

  it("uses a slightly longer deterministic delay after a word-boundary space", () => {
    const { controller, latest } = makeController();
    controller.start("A B");

    vi.advanceTimersByTime(DEFAULT_TYPEWRITER_TIMING.initialDelayMs);
    expect(latest()?.visibleText).toBe("A");
    vi.advanceTimersByTime(DEFAULT_TYPEWRITER_TIMING.characterDelayMs);
    expect(latest()?.visibleText).toBe("A ");

    vi.advanceTimersByTime(DEFAULT_TYPEWRITER_TIMING.spaceDelayMs - 1);
    expect(latest()?.visibleText).toBe("A ");
    vi.advanceTimersByTime(1);
    expect(latest()?.visibleText).toBe("A B");
  });

  it("uses a natural phrase pause after a comma", () => {
    const { controller, latest } = makeController();
    controller.start("A,B");

    vi.advanceTimersByTime(DEFAULT_TYPEWRITER_TIMING.initialDelayMs);
    expect(latest()?.visibleText).toBe("A");
    vi.advanceTimersByTime(DEFAULT_TYPEWRITER_TIMING.characterDelayMs);
    expect(latest()?.visibleText).toBe("A,");

    vi.advanceTimersByTime(DEFAULT_TYPEWRITER_TIMING.commaPauseMs - 1);
    expect(latest()?.visibleText).toBe("A,");
    vi.advanceTimersByTime(1);
    expect(latest()?.visibleText).toBe("A,B");
  });

  it("uses longer deterministic clause and sentence pauses", () => {
    expect(getTypewriterDelay("A:B", 1)).toBe(
      DEFAULT_TYPEWRITER_TIMING.clausePauseMs,
    );
    expect(getTypewriterDelay("A;B", 1)).toBe(
      DEFAULT_TYPEWRITER_TIMING.clausePauseMs,
    );
    expect(getTypewriterDelay("A.B", 1)).toBe(
      DEFAULT_TYPEWRITER_TIMING.sentencePauseMs,
    );
    expect(getTypewriterDelay("A!B", 1)).toBe(
      DEFAULT_TYPEWRITER_TIMING.sentencePauseMs,
    );
    expect(getTypewriterDelay("A?B", 1)).toBe(
      DEFAULT_TYPEWRITER_TIMING.sentencePauseMs,
    );
    expect(getTypewriterDelay("A\nB", 1)).toBe(
      DEFAULT_TYPEWRITER_TIMING.lineBreakPauseMs,
    );
  });

  it("does not add a second large pause after closing quotation marks", () => {
    const { controller, latest } = makeController();
    controller.start('A.” B');

    vi.advanceTimersByTime(DEFAULT_TYPEWRITER_TIMING.initialDelayMs);
    vi.advanceTimersByTime(DEFAULT_TYPEWRITER_TIMING.characterDelayMs);
    expect(latest()?.visibleText).toBe("A.");
    vi.advanceTimersByTime(DEFAULT_TYPEWRITER_TIMING.sentencePauseMs);
    expect(latest()?.visibleText).toBe('A.”');

    vi.advanceTimersByTime(DEFAULT_TYPEWRITER_TIMING.characterDelayMs - 1);
    expect(latest()?.visibleText).toBe('A.”');
    vi.advanceTimersByTime(1);
    expect(latest()?.visibleText).toBe('A.” ');
  });

  it("returns the same character-based timing on every call", () => {
    const samples = ["A", " ", ",", ":", ";", ".", "!", "?", "\n"];
    const firstPass = samples.map((character) =>
      getTypewriterDelay(character, 0),
    );
    const secondPass = samples.map((character) =>
      getTypewriterDelay(character, 0),
    );

    expect(secondPass).toEqual(firstPass);
    expect(firstPass).toEqual([
      DEFAULT_TYPEWRITER_TIMING.characterDelayMs,
      DEFAULT_TYPEWRITER_TIMING.spaceDelayMs,
      DEFAULT_TYPEWRITER_TIMING.commaPauseMs,
      DEFAULT_TYPEWRITER_TIMING.clausePauseMs,
      DEFAULT_TYPEWRITER_TIMING.clausePauseMs,
      DEFAULT_TYPEWRITER_TIMING.sentencePauseMs,
      DEFAULT_TYPEWRITER_TIMING.sentencePauseMs,
      DEFAULT_TYPEWRITER_TIMING.sentencePauseMs,
      DEFAULT_TYPEWRITER_TIMING.lineBreakPauseMs,
    ]);
  });

  it.each([
    ["English", ASSISTANT_WELCOME_COPY.en],
    ["Greek", ASSISTANT_WELCOME_COPY.el],
  ])("completes the full %s message and removes its timer", (_language, text) => {
    const { controller, latest } = makeController();
    controller.start(text);

    vi.runAllTimers();

    expect(latest()).toEqual({ isTyping: false, visibleText: text });
    expect(vi.getTimerCount()).toBe(0);
  });

  it("stops after completion and never loops", () => {
    const { controller, frames, latest } = makeController();
    controller.start("Done.");
    vi.runAllTimers();
    const completedFrameCount = frames.length;

    vi.advanceTimersByTime(60_000);

    expect(frames).toHaveLength(completedFrameCount);
    expect(latest()).toEqual({ isTyping: false, visibleText: "Done." });
    expect(vi.getTimerCount()).toBe(0);
  });

  it("restarts from the beginning after a close and reopen lifecycle", () => {
    const firstRun = makeController();
    firstRun.controller.start("Welcome");
    vi.advanceTimersByTime(
      DEFAULT_TYPEWRITER_TIMING.initialDelayMs +
        (2 * DEFAULT_TYPEWRITER_TIMING.characterDelayMs),
    );
    expect(firstRun.latest()?.visibleText).toBe("Wel");
    firstRun.controller.dispose();
    expect(vi.getTimerCount()).toBe(0);

    const reopenedRun = makeController();
    reopenedRun.controller.start("Welcome");
    expect(reopenedRun.latest()?.visibleText).toBe("");
    expect(reopenedRun.latest()?.isTyping).toBe(true);
  });

  it("restarts when returning from options or when either language changes", () => {
    const { controller, latest } = makeController();
    controller.start(ASSISTANT_WELCOME_COPY.en);
    vi.advanceTimersByTime(
      DEFAULT_TYPEWRITER_TIMING.initialDelayMs +
        (2 * DEFAULT_TYPEWRITER_TIMING.characterDelayMs),
    );
    expect(latest()?.visibleText).toBe("Wel");

    controller.start(ASSISTANT_WELCOME_COPY.en);
    expect(latest()?.visibleText).toBe("");

    controller.start(ASSISTANT_WELCOME_COPY.el);
    vi.advanceTimersByTime(DEFAULT_TYPEWRITER_TIMING.initialDelayMs);
    expect(latest()?.visibleText).toBe("Κ");

    controller.start(ASSISTANT_WELCOME_COPY.en);
    vi.advanceTimersByTime(DEFAULT_TYPEWRITER_TIMING.initialDelayMs);
    expect(latest()?.visibleText).toBe("W");
    expect(vi.getTimerCount()).toBe(1);
  });

  it("reveals the full message immediately through the shared completion action", () => {
    const { controller, latest } = makeController();
    controller.start(ASSISTANT_WELCOME_COPY.en);
    vi.advanceTimersByTime(
      DEFAULT_TYPEWRITER_TIMING.initialDelayMs +
        (2 * DEFAULT_TYPEWRITER_TIMING.characterDelayMs),
    );

    controller.complete();

    expect(latest()).toEqual({
      isTyping: false,
      visibleText: ASSISTANT_WELCOME_COPY.en,
    });
    expect(vi.getTimerCount()).toBe(0);
  });

  it("does nothing when completion is requested after the message is complete", () => {
    const { controller, frames } = makeController();
    controller.start("Complete");
    controller.complete();
    const completedFrameCount = frames.length;

    controller.complete();

    expect(frames).toHaveLength(completedFrameCount);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("renders reduced-motion text immediately without creating a timer", () => {
    const { controller, latest } = makeController();
    controller.start(ASSISTANT_WELCOME_COPY.en, true);

    expect(latest()).toEqual({
      isTyping: false,
      visibleText: ASSISTANT_WELCOME_COPY.en,
    });
    expect(vi.getTimerCount()).toBe(0);
  });

  it("completes active typing and clears its timer when reduced motion activates", () => {
    const { controller, latest } = makeController();
    controller.start(ASSISTANT_WELCOME_COPY.el);
    vi.advanceTimersByTime(
      DEFAULT_TYPEWRITER_TIMING.initialDelayMs +
        (2 * DEFAULT_TYPEWRITER_TIMING.characterDelayMs),
    );
    expect(latest()?.isTyping).toBe(true);

    controller.complete();

    expect(latest()).toEqual({
      isTyping: false,
      visibleText: ASSISTANT_WELCOME_COPY.el,
    });
    expect(vi.getTimerCount()).toBe(0);
  });

  it("cleans up pending work and prevents stale updates after disposal", () => {
    const { controller, frames } = makeController();
    controller.start("Unmounted");
    const frameCountBeforeDispose = frames.length;

    controller.dispose();
    vi.advanceTimersByTime(60_000);

    expect(frames).toHaveLength(frameCountBeforeDispose);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("reports a bounded approximate duration for both complete messages", () => {
    const englishDuration = getApproximateTypingDurationMs(
      ASSISTANT_WELCOME_COPY.en,
    );
    const greekDuration = getApproximateTypingDurationMs(
      ASSISTANT_WELCOME_COPY.el,
    );

    expect(englishDuration).toBeGreaterThan(20_000);
    expect(englishDuration).toBeLessThan(28_000);
    expect(greekDuration).toBeGreaterThan(23_000);
    expect(greekDuration).toBeLessThan(32_000);
  });
});
