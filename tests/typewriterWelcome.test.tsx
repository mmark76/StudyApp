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

  it("reveals ordinary characters progressively at 23 ms intervals", () => {
    const { controller, latest } = makeController();
    controller.start("ABC");

    expect(latest()).toEqual({ isTyping: true, visibleText: "" });
    expect(vi.getTimerCount()).toBe(1);

    vi.advanceTimersByTime(22);
    expect(latest()?.visibleText).toBe("");

    vi.advanceTimersByTime(1);
    expect(latest()).toEqual({ isTyping: true, visibleText: "A" });

    vi.advanceTimersByTime(DEFAULT_TYPEWRITER_TIMING.characterDelayMs);
    expect(latest()).toEqual({ isTyping: true, visibleText: "AB" });
  });

  it("adds deterministic pauses after supported punctuation", () => {
    const { controller, latest } = makeController();
    controller.start("A, B. C");

    vi.advanceTimersByTime(23);
    expect(latest()?.visibleText).toBe("A");
    vi.advanceTimersByTime(23);
    expect(latest()?.visibleText).toBe("A,");

    vi.advanceTimersByTime(122);
    expect(latest()?.visibleText).toBe("A,");
    vi.advanceTimersByTime(1);
    expect(latest()?.visibleText).toBe("A, ");

    vi.advanceTimersByTime(46);
    expect(latest()?.visibleText).toBe("A, B.");
    vi.advanceTimersByTime(242);
    expect(latest()?.visibleText).toBe("A, B.");
    vi.advanceTimersByTime(1);
    expect(latest()?.visibleText).toBe("A, B. ");

    expect(getTypewriterDelay("A:B", 1)).toBe(123);
    expect(getTypewriterDelay("A;B", 1)).toBe(123);
    expect(getTypewriterDelay('A.” B', 2)).toBe(243);
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
    vi.advanceTimersByTime(69);
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
    vi.advanceTimersByTime(69);
    expect(latest()?.visibleText).toBe("Wel");

    controller.start(ASSISTANT_WELCOME_COPY.en);
    expect(latest()?.visibleText).toBe("");

    controller.start(ASSISTANT_WELCOME_COPY.el);
    vi.advanceTimersByTime(23);
    expect(latest()?.visibleText).toBe("Κ");

    controller.start(ASSISTANT_WELCOME_COPY.en);
    vi.advanceTimersByTime(23);
    expect(latest()?.visibleText).toBe("W");
    expect(vi.getTimerCount()).toBe(1);
  });

  it("reveals the full message immediately through the shared completion action", () => {
    const { controller, latest } = makeController();
    controller.start(ASSISTANT_WELCOME_COPY.en);
    vi.advanceTimersByTime(69);

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
    vi.advanceTimersByTime(69);
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

    expect(englishDuration).toBeGreaterThan(8_000);
    expect(englishDuration).toBeLessThan(12_000);
    expect(greekDuration).toBeGreaterThan(9_000);
    expect(greekDuration).toBeLessThan(13_000);
  });
});
