import { expect, type Locator, type Page, test } from "@playwright/test";

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

async function openAssistantAtStepThree(page: Page) {
  await openAssistantAtStepOne(page);
  await page.getByLabel("Study text").fill("Deterministic E2E study material.");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: /Create a summary/ }).click();
  await page.getByRole("button", { name: "Continue: Create summary" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Continue in the StudyApp AI Assistant",
    }),
  ).toBeVisible();
}

async function openAssistantAtStepOne(
  page: Page,
  language: "en" | "el" = "en",
) {
  await page.getByRole("button", {
    name:
      language === "el"
        ? "Άνοιγμα Βοηθού AI του StudyApp"
        : "Open StudyApp AI Assistant",
  }).click();
  await page
    .getByRole("button", {
      name: language === "el" ? "Έναρξη" : "Start",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("heading", {
      name:
        language === "el"
          ? "Πρόσθεσε υλικό μελέτης"
          : "Add study material",
    }),
  ).toBeVisible();
}

async function visibleTextOccurrences(
  locator: Locator,
  value: string,
): Promise<number> {
  return locator.evaluate(
    (element, expectedValue) =>
      ((element as HTMLElement).innerText.match(
        new RegExp(
          expectedValue.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"),
          "gu",
        ),
      ) ?? []).length,
    value,
  );
}

function cssContrastRatio(
  foreground: string,
  background: string,
): number {
  function relativeLuminance(cssColor: string): number {
    const channels = cssColor.match(/\d+(?:\.\d+)?/gu)?.slice(0, 3);
    if (!channels || channels.length !== 3) {
      throw new Error(`Expected an RGB color, received "${cssColor}".`);
    }

    const [red, green, blue] = channels.map((channel) => {
      const normalized = Number(channel) / 255;
      return normalized <= 0.04045
        ? normalized / 12.92
        : ((normalized + 0.055) / 1.055) ** 2.4;
    });

    return (0.2126 * red) + (0.7152 * green) + (0.0722 * blue);
  }

  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

test("Assistant secondary actions use the teal palette and retain keyboard focus", async ({
  page,
}) => {
  const assertNoApplicationErrors = watchForApplicationErrors(page);
  await page.goto("/");
  await page
    .getByRole("button", { name: "Open StudyApp AI Assistant" })
    .click();

  const viewOtherOptions = page.getByRole("button", {
    name: "View other AI options",
  });
  await expect(viewOtherOptions).toHaveClass(/assistant-secondary-action/u);
  await expect(viewOtherOptions).toHaveCSS(
    "background-color",
    "rgb(167, 221, 213)",
  );
  await expect(viewOtherOptions).toHaveCSS("color", "rgb(22, 78, 74)");

  await viewOtherOptions.hover();
  await expect(viewOtherOptions).toHaveCSS(
    "background-color",
    "rgb(140, 207, 197)",
  );

  const buttonBox = await viewOtherOptions.boundingBox();
  expect(buttonBox).not.toBeNull();
  if (buttonBox) {
    await page.mouse.move(
      buttonBox.x + buttonBox.width / 2,
      buttonBox.y + buttonBox.height / 2,
    );
    await page.mouse.down();
    await expect(viewOtherOptions).toHaveCSS(
      "background-color",
      "rgb(116, 191, 180)",
    );
    await expect(viewOtherOptions).toHaveCSS("color", "rgb(21, 73, 68)");
    const activeColors = await viewOtherOptions.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        background: style.backgroundColor,
        foreground: style.color,
      };
    });
    expect(
      cssContrastRatio(activeColors.foreground, activeColors.background),
    ).toBeGreaterThanOrEqual(4.5);
    await page.mouse.move(0, 0);
    await page.mouse.up();
  }

  await page.getByRole("button", { name: "Start", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "AI Assistant" });
  const chooseInput = dialog.getByLabel("Choose file", { exact: true });
  const chooseAction = chooseInput.locator("..");
  const continueButton = dialog.getByRole("button", {
    name: "Continue",
    exact: true,
  });

  await expect(chooseAction).toHaveClass(/assistant-secondary-action/u);
  await expect(chooseAction).toHaveCSS(
    "background-color",
    "rgb(167, 221, 213)",
  );
  await expect(chooseAction).toHaveAttribute("for", "assistant-choose-file");
  await expect(chooseInput).toHaveAttribute("id", "assistant-choose-file");
  await expect(continueButton).toHaveClass("button primary");
  await expect(continueButton).not.toHaveClass(/assistant-secondary-action/u);
  await expect(continueButton).toHaveCSS(
    "background-color",
    "rgb(217, 119, 6)",
  );

  await dialog.getByLabel("Study text").focus();
  await page.keyboard.press("Tab");
  await expect(chooseInput).toBeFocused();
  await expect(chooseAction).toHaveCSS("outline-style", "solid");
  const computedOutlineWidth = await chooseAction.evaluate((element) =>
    Number.parseFloat(getComputedStyle(element).outlineWidth),
  );
  expect(computedOutlineWidth).toBeGreaterThanOrEqual(2.5);
  await expect(chooseAction).toHaveCSS(
    "outline-color",
    "rgb(35, 127, 120)",
  );

  await page.setViewportSize({ width: 390, height: 844 });
  const narrowButtonBox = await chooseAction.boundingBox();
  expect(narrowButtonBox).not.toBeNull();
  if (narrowButtonBox) {
    expect(narrowButtonBox.x).toBeGreaterThanOrEqual(0);
    expect(narrowButtonBox.x + narrowButtonBox.width).toBeLessThanOrEqual(390);
  }
  assertNoApplicationErrors();
});

test("file import, replacement, and removal show each filename exactly once", async ({
  page,
}) => {
  const assertNoApplicationErrors = watchForApplicationErrors(page);
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async () => undefined },
    });
  });
  await page.goto("/");
  await openAssistantAtStepOne(page);

  const dialog = page.getByRole("dialog", { name: "AI Assistant" });
  const firstFileName = "chapter-notes.txt";
  await dialog.getByLabel("Choose file", { exact: true }).setInputFiles({
    name: firstFileName,
    mimeType: "text/plain",
    buffer: Buffer.from("Chapter notes for the assistant."),
  });

  const firstAttachment = dialog.getByRole("group", {
    name: firstFileName,
  });
  await expect(firstAttachment).toBeVisible();
  const importStatus = dialog.getByRole("status");
  await expect(importStatus).toHaveText(
    "The extracted text was copied to the clipboard.",
  );
  await expect(importStatus).not.toHaveClass(/assistant-secondary-action/u);
  expect(await visibleTextOccurrences(dialog, firstFileName)).toBe(1);
  await expect(dialog.getByRole("status")).not.toContainText(firstFileName);
  await expect(dialog.getByText("Imported", { exact: true })).toHaveCount(0);

  const fileBadge = firstAttachment.getByText("FILE", { exact: true });
  await expect(fileBadge).not.toHaveClass(/assistant-secondary-action/u);
  await expect(fileBadge).toHaveCSS(
    "background-color",
    "rgb(255, 243, 209)",
  );

  const replaceInput = dialog.getByLabel("Replace file", { exact: true });
  const replaceAction = replaceInput.locator("..");
  await expect(replaceAction).toHaveClass(/assistant-secondary-action/u);

  const replacementFileName = "revision-points.csv";
  await replaceInput.setInputFiles({
    name: replacementFileName,
    mimeType: "text/csv",
    buffer: Buffer.from("topic,detail\nmemory,encoding"),
  });

  await expect(
    dialog.getByRole("group", { name: replacementFileName }),
  ).toBeVisible();
  await expect(dialog.getByRole("group", { name: firstFileName })).toHaveCount(
    0,
  );
  expect(await visibleTextOccurrences(dialog, firstFileName)).toBe(0);
  expect(await visibleTextOccurrences(dialog, replacementFileName)).toBe(1);
  await expect(dialog.getByRole("status")).toHaveText(
    "The extracted text was copied to the clipboard.",
  );
  await expect(dialog.getByRole("status")).not.toContainText(
    replacementFileName,
  );

  await dialog
    .getByRole("button", { name: `Remove ${replacementFileName}` })
    .click();
  await expect(
    dialog.getByRole("group", { name: replacementFileName }),
  ).toHaveCount(0);
  expect(await visibleTextOccurrences(dialog, replacementFileName)).toBe(0);
  await expect(dialog.getByRole("status")).toHaveCount(0);
  await expect(
    dialog.getByLabel("Choose file", { exact: true }),
  ).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "Continue", exact: true }),
  ).toBeDisabled();
  assertNoApplicationErrors();
});

test("clipboard failure keeps the imported attachment and manual flow available", async ({
  page,
}) => {
  const assertNoApplicationErrors = watchForApplicationErrors(page);
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async () => {
          throw new DOMException("Clipboard denied", "NotAllowedError");
        },
      },
    });
  });
  await page.goto("/");
  await openAssistantAtStepOne(page);

  const dialog = page.getByRole("dialog", { name: "AI Assistant" });
  const fileName = "clipboard-failure.txt";
  await dialog.getByLabel("Choose file", { exact: true }).setInputFiles({
    name: fileName,
    mimeType: "text/plain",
    buffer: Buffer.from("The extracted text remains usable."),
  });

  await expect(dialog.getByRole("group", { name: fileName })).toBeVisible();
  expect(await visibleTextOccurrences(dialog, fileName)).toBe(1);
  await expect(dialog.getByRole("status")).toContainText(
    "Clipboard access was unavailable.",
  );
  await expect(dialog.getByRole("status")).not.toContainText(
    "copied to the clipboard",
  );
  await expect(
    dialog.getByRole("button", { name: "Continue", exact: true }),
  ).toBeEnabled();
  assertNoApplicationErrors();
});

test("Greek import success is localized and does not repeat the filename", async ({
  page,
}) => {
  const assertNoApplicationErrors = watchForApplicationErrors(page);
  await page.addInitScript(() => {
    window.localStorage.setItem("studyapp.language.v1", "el");
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async () => undefined },
    });
  });
  await page.goto("/");
  await openAssistantAtStepOne(page, "el");

  const dialog = page.getByRole("dialog", { name: "Βοηθός AI" });
  const fileName = "σημειώσεις.txt";
  await dialog.getByLabel("Επιλογή αρχείου", { exact: true }).setInputFiles({
    name: fileName,
    mimeType: "text/plain",
    buffer: Buffer.from("Greek interface test content."),
  });

  await expect(dialog.getByRole("group", { name: fileName })).toBeVisible();
  expect(await visibleTextOccurrences(dialog, fileName)).toBe(1);
  await expect(dialog.getByRole("status")).toHaveText(
    "Το εξαγόμενο κείμενο αντιγράφηκε στο πρόχειρο.",
  );
  await expect(dialog.getByRole("status")).not.toContainText(fileName);
  await expect(dialog.getByText("Έγινε εισαγωγή", { exact: false })).toHaveCount(
    0,
  );
  await expect(
    dialog.getByRole("button", { name: `Αφαίρεση ${fileName}` }),
  ).toBeVisible();
  assertNoApplicationErrors();
});

test("file action shows a muted disabled state while clipboard work is pending", async ({
  page,
}) => {
  const assertNoApplicationErrors = watchForApplicationErrors(page);
  await page.addInitScript(() => {
    let resolveClipboardWrite: (() => void) | undefined;
    (
      window as Window & {
        resolveAssistantClipboardWrite?: () => void;
      }
    ).resolveAssistantClipboardWrite = () => resolveClipboardWrite?.();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: () =>
          new Promise<void>((resolve) => {
            resolveClipboardWrite = resolve;
          }),
      },
    });
  });
  await page.goto("/");
  await openAssistantAtStepOne(page);

  const dialog = page.getByRole("dialog", { name: "AI Assistant" });
  await dialog.getByLabel("Choose file", { exact: true }).setInputFiles({
    name: "pending-copy.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("Pending clipboard state."),
  });

  const pendingAction = dialog.locator("label.assistant-file-button", {
    hasText: "Reading...",
  });
  await expect(pendingAction).toHaveAttribute("aria-disabled", "true");
  await expect(pendingAction.locator('input[type="file"]')).toBeDisabled();
  await expect(pendingAction).toHaveCSS(
    "background-color",
    "rgb(213, 232, 228)",
  );
  await expect(pendingAction).toHaveCSS("color", "rgb(85, 112, 108)");
  await expect(pendingAction).toHaveCSS("cursor", "not-allowed");

  await dialog
    .getByRole("button", { name: "Remove pending-copy.txt" })
    .click();
  await page.evaluate(() => {
    (
      window as Window & {
        resolveAssistantClipboardWrite?: () => void;
      }
    ).resolveAssistantClipboardWrite?.();
  });
  await expect(dialog.getByRole("status")).toHaveCount(0);
  await expect(
    dialog.getByText("pending-copy.txt", { exact: true }),
  ).toHaveCount(0);
  await expect(
    dialog.getByRole("button", { name: "Continue", exact: true }),
  ).toBeDisabled();
  assertNoApplicationErrors();
});

test("Assistant can move repeatedly between Step 2 and Step 3 without a DOM crash", async ({
  page,
}) => {
  const assertNoApplicationErrors = watchForApplicationErrors(page);
  await page.addInitScript(() => {
    window.open = () => ({}) as Window;
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async () => undefined },
    });
  });
  await page.goto("/");
  await openAssistantAtStepThree(page);

  for (let attempt = 0; attempt < 4; attempt += 1) {
    await page.getByRole("button", { name: "Back to previous step" }).click();
    await expect(
      page.getByRole("heading", { name: "Choose a study goal" }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Continue: Create summary" })
      .click();
    await expect(
      page.getByRole("heading", {
        name: "Continue in the StudyApp AI Assistant",
      }),
    ).toBeVisible();
  }

  await expect(page.getByText("The request was copied.")).toBeVisible();
  await expect(page.locator("body")).not.toContainText("NotFoundError");
  await expect(page.locator("body")).not.toContainText("removeChild");
  assertNoApplicationErrors();
});

test("blocked popup keeps the fallback link and copied prompt visible", async ({
  page,
}) => {
  const assertNoApplicationErrors = watchForApplicationErrors(page);
  await page.addInitScript(() => {
    window.open = () => null;
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async () => undefined },
    });
  });
  await page.goto("/");
  await openAssistantAtStepThree(page);

  await expect(page.getByText("The assistant popup was blocked.")).toBeVisible();
  await expect(
    page.getByRole("link", {
      name: "Continue in the StudyApp AI Assistant",
    }),
  ).toBeVisible();
  await expect(page.getByText("The request was copied.")).toBeVisible();
  await expect(page.getByLabel("Prepared request")).toContainText(
    "STUDYAPP TASK: summarize",
  );
  assertNoApplicationErrors();
});

test("clipboard failure preserves manual copy while the popup succeeds", async ({
  page,
}) => {
  const assertNoApplicationErrors = watchForApplicationErrors(page);
  await page.addInitScript(() => {
    window.open = () => ({}) as Window;
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async () => {
          throw new DOMException("Clipboard denied", "NotAllowedError");
        },
      },
    });
  });
  await page.goto("/");
  await openAssistantAtStepThree(page);

  await expect(
    page.getByText("The StudyApp AI Assistant popup opened."),
  ).toBeVisible();
  await expect(page.getByText("Clipboard access failed.")).toBeVisible();
  await expect(page.getByLabel("Prepared request")).toContainText(
    "STUDYAPP TASK: summarize",
  );
  await expect(page.getByText("The request was copied.")).toHaveCount(0);
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
