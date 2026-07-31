import { useEffect, useRef, useState } from "react";

export const ASSISTANT_WELCOME_COPY = {
  en: "Welcome to the StudyApp AI Assistant. Here you can open our dedicated assistant in ChatGPT to understand difficult learning material, create clear summaries, build effective flashcards, prepare multiple-choice quizzes, or complete a custom study request. More AI options, including ChatGPT App / MCP and StudyApp AI, are planned for future versions. Press Start to begin.",
  el: "Καλώς ήρθες στον Βοηθό AI του StudyApp. Από εδώ μπορείς να ανοίξεις τον ειδικό βοηθό μας στο ChatGPT, για να κατανοήσεις δύσκολο υλικό, να δημιουργήσεις σαφείς περιλήψεις, αποτελεσματικές κάρτες μελέτης, κουίζ πολλαπλής επιλογής ή να εκτελέσεις ένα προσαρμοσμένο αίτημα μελέτης. Περισσότερες επιλογές AI, όπως το ChatGPT App / MCP και το StudyApp AI, προγραμματίζονται για μελλοντικές εκδόσεις. Πάτησε «Έναρξη» για να ξεκινήσεις.",
} as const;

export const ASSISTANT_WELCOME_COMPLETE_LABEL = {
  en: "Show complete welcome message",
  el: "Εμφάνιση ολόκληρου του μηνύματος υποδοχής",
} as const;

export interface TypewriterTiming {
  characterDelayMs: number;
  clausePauseMs: number;
  commaPauseMs: number;
  initialDelayMs: number;
  lineBreakPauseMs: number;
  sentencePauseMs: number;
  spaceDelayMs: number;
}

export const DEFAULT_TYPEWRITER_TIMING: TypewriterTiming = {
  characterDelayMs: 50,
  clausePauseMs: 275,
  commaPauseMs: 200,
  initialDelayMs: 300,
  lineBreakPauseMs: 600,
  sentencePauseMs: 500,
  spaceDelayMs: 75,
};

interface TypewriterFrame {
  isTyping: boolean;
  visibleText: string;
}

interface TypewriterTimerApi {
  clearTimeout: (handle: ReturnType<typeof globalThis.setTimeout>) => void;
  setTimeout: (
    callback: () => void,
    delayMs: number,
  ) => ReturnType<typeof globalThis.setTimeout>;
}

export interface TypewriterController {
  complete: () => void;
  dispose: () => void;
  getFrame: () => TypewriterFrame;
  start: (text: string, reducedMotion?: boolean) => void;
}

interface TypewriterWelcomeProps {
  completeLabel: string;
  restartKey: string | number;
  text: string;
  timing?: Partial<TypewriterTiming>;
}

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";
const clausePauseCharacters = new Set([":", ";"]);
const sentenceCharacters = new Set([".", "!", "?"]);

function readsReducedMotionPreference(): boolean {
  return typeof window !== "undefined" &&
    typeof window.matchMedia === "function"
    ? window.matchMedia(reducedMotionQuery).matches
    : false;
}

function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    readsReducedMotionPreference,
  );

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    ) {
      return;
    }

    const mediaQuery = window.matchMedia(reducedMotionQuery);
    const updatePreference = () => {
      setPrefersReducedMotion(mediaQuery.matches);
    };

    updatePreference();
    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", updatePreference);
    } else {
      mediaQuery.addListener(updatePreference);
    }

    return () => {
      if (typeof mediaQuery.removeEventListener === "function") {
        mediaQuery.removeEventListener("change", updatePreference);
      } else {
        mediaQuery.removeListener(updatePreference);
      }
    };
  }, []);

  return prefersReducedMotion;
}

export function getTypewriterDelay(
  text: string,
  characterIndex: number,
  timing: TypewriterTiming = DEFAULT_TYPEWRITER_TIMING,
): number {
  const character = text[characterIndex] ?? "";

  if (character === "\n") {
    return timing.lineBreakPauseMs;
  }

  if (sentenceCharacters.has(character)) {
    return timing.sentencePauseMs;
  }

  if (clausePauseCharacters.has(character)) {
    return timing.clausePauseMs;
  }

  if (character === ",") {
    return timing.commaPauseMs;
  }

  if (character === " ") {
    return timing.spaceDelayMs;
  }

  return timing.characterDelayMs;
}

export function getApproximateTypingDurationMs(
  text: string,
  timing: TypewriterTiming = DEFAULT_TYPEWRITER_TIMING,
): number {
  if (text.length === 0) return 0;

  let durationMs = timing.initialDelayMs;
  for (let index = 0; index < text.length - 1; index += 1) {
    durationMs += getTypewriterDelay(text, index, timing);
  }
  return durationMs;
}

export function createTypewriterController(
  onFrame: (frame: TypewriterFrame) => void,
  timing: TypewriterTiming = DEFAULT_TYPEWRITER_TIMING,
  timerApi: TypewriterTimerApi = {
    clearTimeout: (handle) => globalThis.clearTimeout(handle),
    setTimeout: (callback, delayMs) =>
      globalThis.setTimeout(callback, delayMs),
  },
): TypewriterController {
  let currentFrame: TypewriterFrame = {
    isTyping: false,
    visibleText: "",
  };
  let currentText = "";
  let disposed = false;
  let nextCharacterIndex = 0;
  let timer: ReturnType<typeof globalThis.setTimeout> | undefined;

  function clearTimer() {
    if (timer === undefined) return;
    timerApi.clearTimeout(timer);
    timer = undefined;
  }

  function publish(frame: TypewriterFrame) {
    currentFrame = frame;
    onFrame(frame);
  }

  function scheduleNext(delayMs: number) {
    timer = timerApi.setTimeout(() => {
      timer = undefined;
      if (disposed || !currentFrame.isTyping) return;

      nextCharacterIndex += 1;
      const isComplete = nextCharacterIndex >= currentText.length;
      publish({
        isTyping: !isComplete,
        visibleText: currentText.slice(0, nextCharacterIndex),
      });

      if (!isComplete) {
        scheduleNext(
          getTypewriterDelay(
            currentText,
            nextCharacterIndex - 1,
            timing,
          ),
        );
      }
    }, delayMs);
  }

  function complete() {
    if (disposed || !currentFrame.isTyping) return;
    clearTimer();
    nextCharacterIndex = currentText.length;
    publish({ isTyping: false, visibleText: currentText });
  }

  function start(text: string, reducedMotion = false) {
    if (disposed) return;
    clearTimer();
    currentText = text;
    nextCharacterIndex = 0;

    if (reducedMotion || text.length === 0) {
      nextCharacterIndex = text.length;
      publish({ isTyping: false, visibleText: text });
      return;
    }

    publish({ isTyping: true, visibleText: "" });
    scheduleNext(timing.initialDelayMs);
  }

  return {
    complete,
    dispose: () => {
      clearTimer();
      disposed = true;
    },
    getFrame: () => currentFrame,
    start,
  };
}

export function TypewriterWelcome({
  completeLabel,
  restartKey,
  text,
  timing,
}: TypewriterWelcomeProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const resolvedTiming = {
    ...DEFAULT_TYPEWRITER_TIMING,
    ...timing,
  };
  const [frame, setFrame] = useState<TypewriterFrame>(() =>
    prefersReducedMotion
      ? { isTyping: false, visibleText: text }
      : { isTyping: text.length > 0, visibleText: "" },
  );
  const controllerRef = useRef<TypewriterController | null>(null);

  useEffect(() => {
    const controller = createTypewriterController(setFrame, resolvedTiming);
    controllerRef.current = controller;
    controller.start(text, prefersReducedMotion);

    return () => {
      controller.dispose();
      if (controllerRef.current === controller) {
        controllerRef.current = null;
      }
    };
  }, [
    restartKey,
    text,
    resolvedTiming.characterDelayMs,
    resolvedTiming.clausePauseMs,
    resolvedTiming.commaPauseMs,
    resolvedTiming.initialDelayMs,
    resolvedTiming.lineBreakPauseMs,
    resolvedTiming.sentencePauseMs,
    resolvedTiming.spaceDelayMs,
  ]);

  useEffect(() => {
    if (prefersReducedMotion) {
      controllerRef.current?.complete();
    }
  }, [prefersReducedMotion]);

  return (
    <div className="assistant-intro-copy assistant-typewriter">
      <p className="assistant-typewriter-accessible">{text}</p>
      <button
        aria-label={completeLabel}
        className="assistant-typewriter-skip"
        disabled={!frame.isTyping}
        onClick={() => controllerRef.current?.complete()}
        type="button"
      >
        <span
          aria-hidden="true"
          className="assistant-typewriter-reserve"
        >
          {text}
        </span>
        <span
          aria-hidden="true"
          className="assistant-typewriter-visual"
        >
          {frame.visibleText}
          {frame.isTyping && !prefersReducedMotion ? (
            <span
              aria-hidden="true"
              className="assistant-typewriter-cursor"
            />
          ) : null}
        </span>
      </button>
    </div>
  );
}
