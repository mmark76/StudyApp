import { expect, type Page, test } from "@playwright/test";

interface StoredStudyState {
  progress: Array<{
    cardId: string;
    repetitions: number;
  }>;
  sessions: Array<{
    mode: string;
    reviewedCards: number;
    correctAnswers: number;
  }>;
  operations: Array<{
    mode: string;
    cardId?: string;
  }>;
}

const assistantUrl =
  "https://chatgpt.com/g/g-6a6b687029608191af7b26717f0a2072-studyapp-ai-assistant";

const englishWelcome =
  "Welcome to the StudyApp AI Assistant. Here you can open our dedicated assistant in ChatGPT to understand difficult learning material, create clear summaries, build effective flashcards, prepare multiple-choice quizzes, or complete a custom study request. More AI options, including ChatGPT App / MCP and StudyApp AI, are planned for future versions. Press Start to begin.";

const greekWelcome =
  "Καλώς ήρθες στον Βοηθό AI του StudyApp. Από εδώ μπορείς να ανοίξεις τον ειδικό βοηθό μας στο ChatGPT, για να κατανοήσεις δύσκολο υλικό, να δημιουργήσεις σαφείς περιλήψεις, αποτελεσματικές κάρτες μελέτης, κουίζ πολλαπλής επιλογής ή να εκτελέσεις ένα προσαρμοσμένο αίτημα μελέτης. Περισσότερες επιλογές AI, όπως το ChatGPT App / MCP και το StudyApp AI, προγραμματίζονται για μελλοντικές εκδόσεις. Πάτησε «Έναρξη» για να ξεκινήσεις.";

const cards = [
  {
    id: "e2e-card-1",
    unitId: "e2e-unit",
    number: 1,
    question: "E2E question one?",
    answer: "E2E answer one",
    tags: ["e2e"],
  },
  {
    id: "e2e-card-2",
    unitId: "e2e-unit",
    number: 2,
    question: "E2E question two?",
    answer: "E2E answer two",
    tags: ["e2e"],
  },
  {
    id: "e2e-card-3",
    unitId: "e2e-unit",
    number: 3,
    question: "E2E question three?",
    answer: "E2E answer three",
    tags: ["e2e"],
  },
  {
    id: "e2e-card-4",
    unitId: "e2e-unit",
    number: 4,
    question: "E2E question four?",
    answer: "E2E answer four",
    tags: ["e2e"],
  },
];

function watchForApplicationErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  return () => {
    expect(errors, "uncaught page or console errors").toEqual([]);
  };
}

async function seedStudyData(page: Page, reviewCardCount = 0) {
  await page.goto("/");
  await page.evaluate(
    async ({ seededCards, dueCount }) => {
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.open("generic-study-app");
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const database = request.result;
          const transaction = database.transaction(
            ["settings", "cardProgress"],
            "readwrite",
          );
          transaction.onerror = () => reject(transaction.error);
          transaction.oncomplete = () => {
            database.close();
            resolve();
          };

          transaction.objectStore("settings").put({
            key: "imported-study-units",
            value: [
              {
                id: "e2e-unit",
                number: 1,
                title: "E2E unit",
                objectives: [],
                summary: [],
                keyTerms: [],
              },
            ],
          });
          transaction.objectStore("settings").put({
            key: "imported-flashcards",
            value: seededCards,
          });

          const progressStore = transaction.objectStore("cardProgress");
          const dueAt = "2026-01-01T00:00:00.000Z";
          const reviewedAt = "2025-12-31T00:00:00.000Z";
          for (const card of seededCards.slice(0, dueCount)) {
            progressStore.put({
              cardId: card.id,
              score: 1,
              repetitions: 1,
              intervalDays: 1,
              nextReviewAt: dueAt,
              lastReviewedAt: reviewedAt,
              lapses: 0,
            });
          }
        };
      });
    },
    { seededCards: cards, dueCount: reviewCardCount },
  );
}

async function readStudyState(page: Page): Promise<StoredStudyState> {
  return page.evaluate(async () => {
    return new Promise<StoredStudyState>((resolve, reject) => {
      const request = indexedDB.open("generic-study-app");
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const database = request.result;
        const transaction = database.transaction(
          ["cardProgress", "studySessions", "studyOperations"],
          "readonly",
        );
        transaction.onerror = () => reject(transaction.error);

        const progressRequest = transaction
          .objectStore("cardProgress")
          .getAll();
        const sessionRequest = transaction
          .objectStore("studySessions")
          .getAll();
        const operationRequest = transaction
          .objectStore("studyOperations")
          .getAll();
        transaction.oncomplete = () => {
          database.close();
          resolve({
            progress: progressRequest.result,
            sessions: sessionRequest.result,
            operations: operationRequest.result,
          });
        };
      };
    });
  });
}

async function openAssistant(page: Page, language: "en" | "el" = "en") {
  const launcher = page.getByRole("button", {
    name:
      language === "el"
        ? "Άνοιγμα Βοηθού AI του StudyApp"
        : "Open StudyApp AI Assistant",
  });
  await launcher.click();
  await expect(
    page.getByRole("dialog", {
      name: language === "el" ? "Βοηθός AI" : "AI Assistant",
    }),
  ).toBeVisible();
  return launcher;
}

async function showPwaUpdate(
  page: Page,
  mode: "failure" | "pending" | "success",
) {
  await expect.poll(() =>
    page.evaluate(() => Boolean(window.__STUDYAPP_E2E_PWA_UPDATE__)),
  ).toBe(true);
  await page.evaluate((simulationMode) => {
    const control = window.__STUDYAPP_E2E_PWA_UPDATE__;
    if (!control) throw new Error("PWA update E2E control is unavailable.");
    control.show(simulationMode);
  }, mode);
}

test("PWA update toast is compact, localized, responsive, and user-controlled", async ({
  page,
}) => {
  const assertNoApplicationErrors = watchForApplicationErrors(page);
  await page.goto("/");

  const settings = page.getByRole("link", { name: "Settings", exact: true });
  await settings.focus();
  await showPwaUpdate(page, "success");

  const toast = page.locator(".pwa-update-toast");
  await expect(toast).toBeVisible();
  await expect(settings).toBeFocused();
  await expect(
    toast.getByRole("heading", { name: "Update available" }),
  ).toBeVisible();
  await expect(toast.getByRole("status")).toHaveText(
    "A newer version of StudyApp is available.",
  );
  await expect(
    toast.getByText("Update when you finish your current work."),
  ).toHaveCount(0);

  const desktopBox = await toast.boundingBox();
  const footerBox = await page.locator(".app-footer").boundingBox();
  expect(desktopBox).not.toBeNull();
  expect(desktopBox?.width).toBeGreaterThanOrEqual(340);
  expect(desktopBox?.width).toBeLessThanOrEqual(410);
  expect(desktopBox?.width).toBeLessThan(640);
  expect((desktopBox?.x ?? 0) + (desktopBox?.width ?? 0))
    .toBeLessThanOrEqual(1270);
  expect((desktopBox?.y ?? 0) + (desktopBox?.height ?? 0))
    .toBeLessThanOrEqual(footerBox?.y ?? 720);

  const primary = toast.locator(".pwa-update-toast-actions .button.primary");
  const secondary = toast.locator(
    ".pwa-update-toast-actions .button.secondary",
  );
  await primary.focus();
  await page.keyboard.press("Enter");
  await expect(toast).toHaveCount(0);
  await expect.poll(() =>
    page.evaluate(
      () => window.__STUDYAPP_E2E_PWA_UPDATE__?.attempts ?? 0,
    ),
  ).toBe(1);

  await showPwaUpdate(page, "success");
  await toast.getByRole("button", { name: "Later" }).click();
  await expect(toast).toHaveCount(0);
  await expect.poll(() =>
    page.evaluate(
      () => window.__STUDYAPP_E2E_PWA_UPDATE__?.getState().isAvailable,
    ),
  ).toBe(false);

  await showPwaUpdate(page, "pending");
  await primary.click();
  await expect(primary).toHaveText("Updating...");
  await expect(primary).toBeDisabled();
  await expect(secondary).toBeDisabled();
  await primary.evaluate((button) => button.click());
  await expect.poll(() =>
    page.evaluate(
      () => window.__STUDYAPP_E2E_PWA_UPDATE__?.attempts ?? 0,
    ),
  ).toBe(1);
  await page.evaluate(() => {
    window.__STUDYAPP_E2E_PWA_UPDATE__?.releasePending?.();
  });
  await expect(toast).toHaveCount(0);

  await showPwaUpdate(page, "failure");
  await primary.click();
  await expect(toast.getByRole("status")).toHaveText(
    "The update could not be completed. Try again.",
  );
  await expect(primary).toBeEnabled();
  await expect(
    toast.getByText("E2E service worker update failure"),
  ).toHaveCount(0);

  await page.getByRole("button", { name: "GR" }).click();
  await expect(
    toast.getByRole("heading", { name: "Διαθέσιμη ενημέρωση" }),
  ).toBeVisible();
  await expect(toast.getByRole("status")).toHaveText(
    "Η ενημέρωση δεν ολοκληρώθηκε. Δοκίμασε ξανά.",
  );
  await expect(
    toast.getByText("The update could not be completed. Try again."),
  ).toHaveCount(0);

  await toast.getByRole("button", { name: "Αργότερα" }).click();
  await showPwaUpdate(page, "success");
  await expect(toast.getByRole("status")).toHaveText(
    "Υπάρχει νεότερη έκδοση του StudyApp.",
  );
  await expect(
    toast.getByRole("button", { name: "Ενημέρωση", exact: true }),
  ).toBeVisible();
  await toast.getByRole("button", { name: "Αργότερα" }).click();

  await page.setViewportSize({ width: 375, height: 667 });
  await page.getByRole("button", { name: "EN" }).click();
  await showPwaUpdate(page, "success");
  const mobileBox = await toast.boundingBox();
  expect(mobileBox).not.toBeNull();
  expect(mobileBox?.x).toBeGreaterThanOrEqual(12);
  expect((mobileBox?.x ?? 0) + (mobileBox?.width ?? 0))
    .toBeLessThanOrEqual(363);
  expect(mobileBox?.width).toBeGreaterThanOrEqual(300);
  expect(mobileBox?.width).toBeLessThanOrEqual(355);
  expect((mobileBox?.y ?? 0) + (mobileBox?.height ?? 0))
    .toBeLessThanOrEqual(667);
  await expect(
    toast.evaluate((element) => getComputedStyle(element).position),
  ).resolves.toBe("fixed");

  const actionBoxes = await toast
    .locator(".pwa-update-toast-actions .button")
    .evaluateAll((buttons) =>
      buttons.map((button) => {
        const box = button.getBoundingClientRect();
        return {
          left: box.left,
          right: box.right,
        };
      }),
    );
  expect(
    actionBoxes.every(
      (box) =>
        box.left >= (mobileBox?.x ?? 0) &&
        box.right <= (mobileBox?.x ?? 0) + (mobileBox?.width ?? 0),
    ),
  ).toBe(true);

  await toast.getByRole("button", { name: "Later" }).focus();
  await page.keyboard.press("Space");
  await expect(toast).toHaveCount(0);
  assertNoApplicationErrors();
});

test("Assistant intro has the exact safe link and no old workflow", async ({
  page,
}) => {
  const assertNoApplicationErrors = watchForApplicationErrors(page);
  await page.goto("/");
  await openAssistant(page);

  const dialog = page.getByRole("dialog", { name: "AI Assistant" });
  await expect(
    dialog.getByRole("heading", { name: "Study with ChatGPT" }),
  ).toBeVisible();

  const start = dialog.getByRole("link", { name: "Start" });
  await expect(start).toHaveAttribute("href", assistantUrl);
  await expect(start).toHaveAttribute("target", "_blank");
  await expect(start).toHaveAttribute("rel", "noopener noreferrer");
  await expect(dialog.getByRole("button", { name: "View other AI options" }))
    .toBeVisible();
  await expect(dialog.locator(".assistant-typewriter-accessible"))
    .toHaveText(englishWelcome);
  await expect(
    dialog.getByText("StudyApp does not automatically send your local data."),
  ).toHaveCount(0);
  await expect(dialog.locator(".assistant-privacy-note")).toHaveCount(0);

  await expect(dialog.getByText("Step 1 of 3")).toHaveCount(0);
  await expect(dialog.getByText("Add study material")).toHaveCount(0);
  await expect(dialog.getByText("Choose a study goal")).toHaveCount(0);
  await expect(dialog.locator("textarea")).toHaveCount(0);
  await expect(dialog.locator('input[type="file"]')).toHaveCount(0);
  assertNoApplicationErrors();
});

test("Assistant welcome types accessibly without moving its actions", async ({
  page,
}) => {
  const assertNoApplicationErrors = watchForApplicationErrors(page);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await openAssistant(page);

  const panel = page.locator(".assistant-panel");
  const visual = panel.locator(".assistant-typewriter-visual");
  const actions = panel.locator(".assistant-actions");
  const englishSkip = panel.getByRole("button", {
    name: "Show complete welcome message",
  });

  await expect.poll(async () => (await visual.textContent())?.length ?? 0)
    .toBeGreaterThan(0);
  const firstVisibleLength = (await visual.textContent())?.length ?? 0;
  expect(firstVisibleLength).toBeLessThan(englishWelcome.length);
  await expect(panel.locator(".assistant-typewriter-cursor")).toHaveCount(1);

  const initialActionsBox = await actions.boundingBox();
  expect(initialActionsBox).not.toBeNull();
  await expect.poll(async () => (await visual.textContent())?.length ?? 0)
    .toBeGreaterThan(firstVisibleLength);
  const typingActionsBox = await actions.boundingBox();
  expect(typingActionsBox?.y).toBeCloseTo(initialActionsBox?.y ?? 0, 0);

  await englishSkip.click();
  await expect(visual).toHaveText(englishWelcome);
  await expect(englishSkip).toBeDisabled();
  await expect(panel.locator(".assistant-typewriter-cursor")).toHaveCount(0);
  const completedActionsBox = await actions.boundingBox();
  expect(completedActionsBox?.y).toBeCloseTo(initialActionsBox?.y ?? 0, 0);

  const start = panel.getByRole("link", { name: "Start", exact: true });
  await expect(start).toBeVisible();
  await expect(start).toHaveAttribute("href", assistantUrl);
  await expect(start).toHaveAttribute("target", "_blank");
  await expect(start).toHaveAttribute("rel", "noopener noreferrer");

  await panel
    .getByRole("button", { name: "View other AI options" })
    .click();
  await expect(
    panel.getByRole("heading", { name: "Other AI options" }),
  ).toBeVisible();
  await panel
    .getByRole("button", { name: "Back to Study with ChatGPT" })
    .click();
  const restartedEnglishLength = (await visual.textContent())?.length ?? 0;
  expect(restartedEnglishLength).toBeLessThan(englishWelcome.length);

  await englishSkip.focus();
  await page.keyboard.press("Enter");
  await expect(visual).toHaveText(englishWelcome);

  await page.locator(".language-switcher button", { hasText: "GR" })
    .evaluate((button) => {
      button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
  const greekSkip = panel.getByRole("button", {
    name: "Εμφάνιση ολόκληρου του μηνύματος υποδοχής",
  });
  await expect(panel.locator(".assistant-typewriter-accessible"))
    .toHaveText(greekWelcome);
  await expect.poll(async () => (await visual.textContent())?.length ?? 0)
    .toBeGreaterThan(0);
  expect((await visual.textContent())?.length ?? 0)
    .toBeLessThan(greekWelcome.length);

  await greekSkip.focus();
  await page.keyboard.press("Space");
  await expect(visual).toHaveText(greekWelcome);

  await page.locator(".language-switcher button", { hasText: "EN" })
    .evaluate((button) => {
      button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
  await expect.poll(async () => (await visual.textContent())?.length ?? 0)
    .toBeGreaterThan(0);
  expect((await visual.textContent())?.length ?? 0)
    .toBeLessThan(englishWelcome.length);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(visual).toHaveText(englishWelcome);
  await expect(panel.locator(".assistant-typewriter-cursor")).toHaveCount(0);
  await expect(
    panel.getByRole("button", { name: "Show complete welcome message" }),
  ).toBeDisabled();

  await panel.getByRole("button", { name: "Close AI Assistant" }).click();
  await expect(panel).toHaveCount(0);
  assertNoApplicationErrors();
});

test("Other AI options and Back provide exactly two Assistant screens", async ({
  page,
}) => {
  const assertNoApplicationErrors = watchForApplicationErrors(page);
  await page.goto("/");
  await openAssistant(page);

  const dialog = page.getByRole("dialog", { name: "AI Assistant" });
  await dialog.getByRole("button", { name: "View other AI options" }).click();
  await expect(
    dialog.getByRole("heading", { name: "Other AI options" }),
  ).toBeVisible();
  const availableOption = dialog.getByRole("link", {
    name: "Open StudyApp AI Assistant in ChatGPT",
  });
  await expect(availableOption).toContainText("StudyApp AI Assistant");
  await expect(availableOption).toContainText(
    "Open the dedicated assistant in ChatGPT and provide your study material directly.",
  );
  await expect(availableOption).toHaveAttribute("href", assistantUrl);
  await expect(availableOption).toHaveAttribute("target", "_blank");
  await expect(availableOption).toHaveAttribute(
    "rel",
    "noopener noreferrer",
  );
  await expect(dialog.getByText("ChatGPT Companion")).toHaveCount(0);
  await expect(
    dialog.getByText(
      "Follow guided steps to prepare your study session in ChatGPT.",
    ),
  ).toHaveCount(0);
  await expect(dialog.getByText("ChatGPT App / MCP")).toBeVisible();
  await expect(dialog.getByText("StudyApp AI", { exact: true })).toBeVisible();
  await expect(dialog.locator(".assistant-mode-status.available")).toHaveText(
    "Available",
  );
  await expect(dialog.locator(".assistant-mode-status.soon")).toHaveCount(2);
  const comingSoonOptions = dialog.locator("button.assistant-mode-card");
  await expect(comingSoonOptions).toHaveCount(2);
  await expect(comingSoonOptions.nth(0)).not.toHaveAttribute("href");
  await expect(comingSoonOptions.nth(1)).not.toHaveAttribute("href");

  await dialog
    .getByRole("button", { name: "Back to Study with ChatGPT" })
    .click();
  await expect(
    dialog.getByRole("heading", { name: "Study with ChatGPT" }),
  ).toBeVisible();
  await expect(
    dialog.getByRole("heading", { name: "Other AI options" }),
  ).toHaveCount(0);
  assertNoApplicationErrors();
});

test("Escape closes the Assistant and restores focus to its launcher", async ({
  page,
}) => {
  const assertNoApplicationErrors = watchForApplicationErrors(page);
  await page.goto("/");
  const launcher = await openAssistant(page);

  await expect(page.getByRole("button", { name: "Close AI Assistant" }))
    .toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(launcher).toBeFocused();
  assertNoApplicationErrors();
});

test("Assistant traps forward and reverse focus and makes the background inert", async ({
  page,
}) => {
  const assertNoApplicationErrors = watchForApplicationErrors(page);
  await page.goto("/");
  await openAssistant(page);

  const dialog = page.getByRole("dialog", { name: "AI Assistant" });
  const close = dialog.getByRole("button", { name: "Close AI Assistant" });
  const lastControl = dialog.getByRole("button", {
    name: "View other AI options",
  });
  await expect(
    page.locator(".app-header").evaluate((element) => element.inert),
  ).resolves.toBe(true);

  await lastControl.focus();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();

  await page.keyboard.press("Shift+Tab");
  await expect(lastControl).toBeFocused();

  await close.click();
  await expect(
    page.locator(".app-header").evaluate((element) => element.inert),
  ).resolves.toBe(false);
  assertNoApplicationErrors();
});

test("Assistant links do not use the clipboard or scripted popup positioning", async ({
  page,
}) => {
  const assertNoApplicationErrors = watchForApplicationErrors(page);
  await page.addInitScript(() => {
    const trackedWindow = window as Window & {
      assistantClipboardAccesses?: number;
      assistantWindowOpenCalls?: number;
    };
    trackedWindow.assistantClipboardAccesses = 0;
    trackedWindow.assistantWindowOpenCalls = 0;

    window.open = () => {
      trackedWindow.assistantWindowOpenCalls =
        (trackedWindow.assistantWindowOpenCalls ?? 0) + 1;
      return null;
    };
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      get() {
        trackedWindow.assistantClipboardAccesses =
          (trackedWindow.assistantClipboardAccesses ?? 0) + 1;
        return { writeText: async () => undefined };
      },
    });
  });
  await page.goto("/");
  await openAssistant(page);

  const start = page.getByRole("link", { name: "Start", exact: true });
  await start.evaluate((element) => {
    element.addEventListener("click", (event) => event.preventDefault(), {
      once: true,
    });
  });
  await start.click();

  await page
    .getByRole("button", { name: "View other AI options" })
    .click();
  const availableOption = page.getByRole("link", {
    name: "Open StudyApp AI Assistant in ChatGPT",
  });
  await availableOption.evaluate((element) => {
    element.addEventListener("click", (event) => event.preventDefault(), {
      once: true,
    });
  });
  await availableOption.click();

  await expect.poll(() =>
    page.evaluate(() => {
      const trackedWindow = window as Window & {
        assistantClipboardAccesses?: number;
        assistantWindowOpenCalls?: number;
      };
      return {
        clipboard: trackedWindow.assistantClipboardAccesses,
        popup: trackedWindow.assistantWindowOpenCalls,
      };
    }),
  ).toEqual({ clipboard: 0, popup: 0 });
  assertNoApplicationErrors();
});

test("Assistant provides equivalent English and Greek screens", async ({
  page,
}) => {
  const assertNoApplicationErrors = watchForApplicationErrors(page);
  await page.goto("/");
  await openAssistant(page);
  await expect(
    page.getByRole("heading", { name: "Study with ChatGPT" }),
  ).toBeVisible();
  await expect(
    page.locator(".assistant-typewriter-accessible"),
  ).toHaveText(englishWelcome);
  await page
    .getByRole("button", { name: "Show complete welcome message" })
    .click();
  await expect(page.locator(".assistant-typewriter-visual"))
    .toHaveText(englishWelcome);
  await expect(
    page.getByText("StudyApp does not automatically send your local data."),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Close AI Assistant" }).click();

  await page.getByRole("button", { name: "GR" }).click();
  await openAssistant(page, "el");
  const greekDialog = page.getByRole("dialog", { name: "Βοηθός AI" });
  await expect(
    greekDialog.getByRole("heading", { name: "Μελέτη με το ChatGPT" }),
  ).toBeVisible();
  await expect(
    greekDialog.locator(".assistant-typewriter-accessible"),
  ).toHaveText(greekWelcome);
  await greekDialog
    .getByRole("button", {
      name: "Εμφάνιση ολόκληρου του μηνύματος υποδοχής",
    })
    .click();
  await expect(greekDialog.locator(".assistant-typewriter-visual"))
    .toHaveText(greekWelcome);
  await expect(
    greekDialog.getByText(
      "Το StudyApp δεν αποστέλλει αυτόματα τα τοπικά δεδομένα σου.",
    ),
  ).toHaveCount(0);
  await expect(greekDialog.getByRole("link", { name: "Έναρξη" }))
    .toHaveAttribute("href", assistantUrl);
  await greekDialog
    .getByRole("button", { name: "Προβολή άλλων επιλογών AI" })
    .click();
  await expect(
    greekDialog.getByRole("heading", { name: "Άλλες επιλογές AI" }),
  ).toBeVisible();
  const greekAvailableOption = greekDialog.getByRole("link", {
    name: "Άνοιγμα του Βοηθού AI του StudyApp στο ChatGPT",
  });
  await expect(greekAvailableOption).toContainText("Βοηθός AI του StudyApp");
  await expect(greekAvailableOption).toContainText(
    "Άνοιξε τον ειδικό βοηθό στο ChatGPT και πρόσθεσε απευθείας το υλικό μελέτης σου.",
  );
  await expect(greekAvailableOption).toHaveAttribute("href", assistantUrl);
  await expect(
    greekDialog.getByRole("button", {
      name: "Πίσω στη Μελέτη με το ChatGPT",
    }),
  ).toBeVisible();
  await expect(greekDialog.getByText("Διαθέσιμο")).toBeVisible();
  await expect(greekDialog.getByText("Σύντομα")).toHaveCount(2);
  assertNoApplicationErrors();
});

test("chapter writes disable pending controls, reject duplicates, and retain failed input", async ({
  page,
}) => {
  const assertNoApplicationErrors = watchForApplicationErrors(page);
  await page.goto("/#/import");

  const chapterSection = page
    .getByRole("heading", { name: "Add one chapter" })
    .locator("..");
  const chapterForm = chapterSection.locator("form");
  const title = chapterSection.getByLabel("Chapter title");

  await page.evaluate(() => {
    window.__STUDYAPP_E2E_LOCAL_WRITE__ = {
      attempts: {},
      pauseNext: "chapter",
    };
  });
  await title.fill("Pending chapter");
  await chapterForm.evaluate((element) => {
    const form = element as HTMLFormElement;
    form.requestSubmit();
    form.requestSubmit();
  });

  await expect(chapterForm).toHaveAttribute("aria-busy", "true");
  await expect(title).toBeDisabled();
  await expect(
    chapterSection.getByRole("button", { name: "Saving chapter…" }),
  ).toBeDisabled();
  await expect.poll(() =>
    page.evaluate(
      () =>
        window.__STUDYAPP_E2E_LOCAL_WRITE__?.attempts?.chapter ?? 0,
    ),
  ).toBe(1);

  await page.evaluate(() => {
    window.__STUDYAPP_E2E_LOCAL_WRITE__?.releasePending?.();
  });
  await expect(page.locator(".status-banner")).toHaveText("Chapter added.");
  await expect(title).toHaveValue("");
  await expect(page.locator(".stats-grid .stat-card").first()).toContainText(
    "1",
  );

  await page.evaluate(() => {
    const control = window.__STUDYAPP_E2E_LOCAL_WRITE__ ??= {};
    control.failNext = "chapter";
  });
  await title.fill("Retained after failure");
  await chapterSection.getByLabel("Learning goals").fill("Keep this goal");
  await chapterSection
    .getByRole("button", { name: "Add chapter" })
    .click();

  await expect(page.locator(".status-banner")).toHaveText(
    "The chapter could not be saved on this device. Your entries are still here. Try again.",
  );
  await expect(title).toHaveValue("Retained after failure");
  await expect(chapterSection.getByLabel("Learning goals")).toHaveValue(
    "Keep this goal",
  );
  await expect(page.locator(".stats-grid .stat-card").first()).toContainText(
    "1",
  );
  assertNoApplicationErrors();
});

test("flashcard write failure never shows success and preserves the form for retry", async ({
  page,
}) => {
  const assertNoApplicationErrors = watchForApplicationErrors(page);
  await page.goto("/#/import");

  const chapterSection = page
    .getByRole("heading", { name: "Add one chapter" })
    .locator("..");
  await chapterSection
    .getByLabel("Chapter title")
    .fill("Flashcard test chapter");
  await chapterSection.getByRole("button", { name: "Add chapter" }).click();
  await expect(page.locator(".status-banner")).toHaveText("Chapter added.");

  const flashcardSection = page
    .getByRole("heading", { name: "Add one flashcard" })
    .locator("..");
  const chapter = flashcardSection.getByLabel("Chapter");
  await expect.poll(() => chapter.locator("option").count()).toBeGreaterThan(1);

  await chapter.selectOption({ index: 1 });
  await flashcardSection.getByLabel("Question").fill("Retained question?");
  await flashcardSection.getByLabel("Answer").fill("Retained answer.");
  await page.evaluate(() => {
    window.__STUDYAPP_E2E_LOCAL_WRITE__ = {
      attempts: {},
      failNext: "flashcard",
    };
  });
  await flashcardSection
    .getByRole("button", { name: "Add flashcard" })
    .click();

  await expect(page.locator(".status-banner")).toHaveText(
    "The flashcard could not be saved on this device. Your entries are still here. Try again.",
  );
  await expect(flashcardSection.getByLabel("Question")).toHaveValue(
    "Retained question?",
  );
  await expect(flashcardSection.getByLabel("Answer")).toHaveValue(
    "Retained answer.",
  );
  await expect(page.getByText("Flashcard added.")).toHaveCount(0);

  await flashcardSection
    .getByRole("button", { name: "Add flashcard" })
    .click();
  await expect(page.locator(".status-banner")).toHaveText("Flashcard added.");
  await expect(flashcardSection.getByLabel("Question")).toHaveValue("");
  await expect(flashcardSection.getByLabel("Answer")).toHaveValue("");
  await expect(page.locator(".stats-grid .stat-card").nth(1)).toContainText(
    "1",
  );
  assertNoApplicationErrors();
});

test("appearance writes expose pending, success, and truthful failure states", async ({
  page,
}) => {
  const assertNoApplicationErrors = watchForApplicationErrors(page);
  await page.goto("/#/appearance");

  const accent = page.getByLabel("Accent colour");
  const reset = page.getByRole("button", { name: "Reset appearance" });
  await expect(accent).toBeEnabled();
  await page.evaluate(() => {
    window.__STUDYAPP_E2E_LOCAL_WRITE__ = {
      attempts: {},
      pauseNext: "appearance",
    };
  });

  await accent.evaluate((element) => {
    const select = element as HTMLSelectElement;
    select.value = "blue";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    select.value = "purple";
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });

  await expect(page.getByRole("status").filter({ hasText: "Saving changes…" }))
    .toBeVisible();
  await expect(accent).toBeDisabled();
  await expect(reset).toBeDisabled();
  await expect.poll(() =>
    page.evaluate(
      () =>
        window.__STUDYAPP_E2E_LOCAL_WRITE__?.attempts?.appearance ?? 0,
    ),
  ).toBe(1);

  await page.evaluate(() => {
    window.__STUDYAPP_E2E_LOCAL_WRITE__?.releasePending?.();
  });
  await expect(page.getByText("Changes saved on this device.")).toBeVisible();
  await expect(accent).toHaveValue("blue");

  await page.evaluate(() => {
    const control = window.__STUDYAPP_E2E_LOCAL_WRITE__ ??= {};
    control.failNext = "appearance";
  });
  await accent.selectOption("purple");
  await expect(
    page.getByText(
      "Changes could not be saved. Your latest selection is still shown. Try again.",
    ),
  ).toBeVisible();
  await expect(accent).toHaveValue("purple");
  await expect(
    page.getByRole("button", { name: "Retry saving" }),
  ).toBeVisible();
  await expect(page.getByText("Changes are saved automatically.")).toHaveCount(
    0,
  );

  await page.reload();
  await expect(accent).toBeEnabled();
  await expect(accent).toHaveValue("blue");
  assertNoApplicationErrors();
});

test("flashcard final-write failure rolls back and retry commits once", async ({
  page,
}) => {
  const assertNoApplicationErrors = watchForApplicationErrors(page);
  await seedStudyData(page);
  await page.goto("/#/flashcards");

  for (let index = 0; index < cards.length - 1; index += 1) {
    await page.getByRole("button", { name: "Show answer" }).click();
    await page.getByRole("button", { name: /Known/ }).click();
    await expect(page.locator(".session-progress")).toContainText(
      `${index + 2} / ${cards.length}`,
    );
  }

  await page.getByRole("button", { name: "Show answer" }).click();
  await page.getByRole("button", { name: /Known/ }).click();
  await expect(
    page.getByText("Progress could not be saved."),
  ).toBeVisible();

  const failedState = await readStudyState(page);
  expect(failedState.progress).toHaveLength(cards.length - 1);
  expect(failedState.sessions).toHaveLength(1);
  expect(failedState.sessions[0]).toMatchObject({
    mode: "flashcards",
    reviewedCards: cards.length - 1,
  });
  expect(failedState.operations).toHaveLength(cards.length - 1);
  await expect(page.locator(".session-progress")).toContainText(
    `${cards.length} / ${cards.length}`,
  );

  await page.getByRole("button", { name: "Retry saving" }).click();
  await expect(
    page.getByRole("heading", { name: "The session is complete" }),
  ).toBeVisible();

  const committedState = await readStudyState(page);
  expect(committedState.progress).toHaveLength(cards.length);
  expect(committedState.sessions).toHaveLength(1);
  expect(committedState.operations).toHaveLength(cards.length);
  assertNoApplicationErrors();
});

test("quiz final-answer retry completes once with valid counters", async ({
  page,
}) => {
  const assertNoApplicationErrors = watchForApplicationErrors(page);
  await seedStudyData(page);
  await page.goto("/#/quiz");

  for (let index = 0; index < cards.length; index += 1) {
    await expect(page.locator(".option-button").first()).toBeVisible();
    await page.locator(".option-button").first().click();
  }

  await expect(
    page.getByText("The result could not be saved."),
  ).toBeVisible();
  let state = await readStudyState(page);
  expect(state.sessions).toHaveLength(0);
  expect(state.operations).toHaveLength(0);

  await page.getByRole("button", { name: "Retry saving result" }).click();
  await expect(page.getByRole("heading", { name: /Result:/ })).toBeVisible();

  state = await readStudyState(page);
  expect(state.sessions).toHaveLength(1);
  expect(state.operations).toHaveLength(1);
  expect(state.sessions[0].correctAnswers).toBeLessThanOrEqual(
    state.sessions[0].reviewedCards,
  );
  assertNoApplicationErrors();
});

test("review completion appears only after transactional retry", async ({
  page,
}) => {
  const assertNoApplicationErrors = watchForApplicationErrors(page);
  await seedStudyData(page, 2);
  await page.goto("/#/review");

  await page.getByRole("button", { name: "Show answer" }).click();
  await page.getByRole("button", { name: /Known/ }).click();
  await expect(page.locator(".session-progress")).toContainText("2 / 2");
  await page.getByRole("button", { name: "Show answer" }).click();
  await page.getByRole("button", { name: /Known/ }).click();
  await expect(
    page.getByText("Review progress could not be saved."),
  ).toBeVisible();

  let state = await readStudyState(page);
  expect(state.progress.find((item) => item.cardId === "e2e-card-2"))
    .toMatchObject({ repetitions: 1 });
  expect(state.sessions).toHaveLength(1);
  expect(state.sessions[0]).toMatchObject({
    mode: "review",
    reviewedCards: 1,
  });
  expect(state.operations).toHaveLength(1);

  await page.getByRole("button", { name: "Retry saving" }).click();
  await expect(
    page.getByRole("heading", { name: "Review complete" }),
  ).toBeVisible();

  state = await readStudyState(page);
  expect(state.progress.find((item) => item.cardId === "e2e-card-2"))
    .toMatchObject({ repetitions: 2 });
  expect(state.sessions).toHaveLength(1);
  expect(state.sessions[0]).toMatchObject({
    mode: "review",
    reviewedCards: 2,
  });
  expect(state.operations).toHaveLength(2);
  assertNoApplicationErrors();
});
