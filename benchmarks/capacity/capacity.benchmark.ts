import "fake-indexeddb/auto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { cpus, freemem, platform, release, totalmem } from "node:os";
import { join } from "node:path";
import { performance as nodePerformance } from "node:perf_hooks";
import {
  expect,
  test,
  type Browser,
  type BrowserContext,
  type CDPSession,
  type Page,
} from "@playwright/test";
import {
  exportBackup,
  serializeBackup,
} from "../../src/infrastructure/backup/backup";
import { StudyDatabase } from "../../src/infrastructure/database/studyDatabase";
import {
  IMPORTED_FLASHCARDS_SETTING_KEY,
  IMPORTED_UNITS_SETTING_KEY,
  MAX_IMPORTED_FLASHCARDS,
  MAX_IMPORTED_UNITS,
  parseStoredFlashcards,
  parseStoredUnits,
} from "../../src/features/content-import/importedContent";
import {
  createCapacityFixture,
  createCapacityFixtureCsv,
  getCapacityFixturePlan,
  PERSONAL_USE_CALIBRATION,
  type CapacityFixturePlan,
  type CapacityFixtureRequest,
} from "./capacityFixture";
import {
  CAPACITY_BENCHMARK_VERSION,
  parseCapacityBenchmarkArtifact,
  summarizeTimings,
  type CapacityBenchmarkArtifact,
  type CapacityMetricStatus,
  type CapacityScenarioResult,
} from "./capacityResult";

interface BenchmarkProfile {
  cpuThrottle: number;
  deviceScaleFactor: number;
  hasTouch: boolean;
  id: "desktop-reference" | "constrained-mobile-emulation";
  isMobile: boolean;
  note: string;
  viewport: { height: number; width: number };
}

interface ManagerSample {
  accessibilityTree: Record<string, number | string> | null;
  dom: Record<string, number> | null;
  error?: string;
  firstActionMs?: number;
  firstManagerRenderMs?: number;
  finalTtiMs?: number;
  keyboard: Record<string, number | boolean | string> | null;
  longTasks: Record<string, number | string> | null;
  memory: Record<string, number | string> | null;
  pagination: Record<string, unknown> | null;
  persistenceMs?: number;
  status: CapacityMetricStatus;
}

const profiles: readonly BenchmarkProfile[] = [
  {
    id: "desktop-reference",
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
    cpuThrottle: 1,
    hasTouch: false,
    isMobile: false,
    note: "Headless desktop Chromium on the named host; no CPU throttling.",
  },
  {
    id: "constrained-mobile-emulation",
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    cpuThrottle: 4,
    hasTouch: true,
    isMobile: true,
    note: "Emulated constrained profile; physical-device validation remains separate.",
  },
];

const watchdogMs = readPositiveIntegerEnvironment(
  "CAPACITY_BENCHMARK_WATCHDOG_MS",
  30_000,
);
const resultsDirectory = join("test-results", "capacity-benchmark");

function readPositiveIntegerEnvironment(name: string, fallback: number): number {
  const parsed = Number(process.env[name]);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function describeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.length > 500 ? `${message.slice(0, 497)}...` : message;
}

class BenchmarkWatchdogError extends Error {
  constructor(milliseconds: number) {
    super(`TIMEOUT / NOT PRACTICALLY INTERACTIVE after ${milliseconds} ms`);
    this.name = "BenchmarkWatchdogError";
  }
}

async function withWatchdog<T>(promise: Promise<T>, milliseconds: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_resolve, reject) => {
        timer = setTimeout(
          () => reject(new BenchmarkWatchdogError(milliseconds)),
          milliseconds,
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function closeContext(context: BrowserContext): Promise<void> {
  await Promise.race([
    context.close().catch(() => undefined),
    new Promise<void>((resolve) => setTimeout(resolve, 5_000)),
  ]);
}

async function createProfilePage(
  browser: Browser,
  profile: BenchmarkProfile,
  language: "en" | "el",
): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext({
    viewport: profile.viewport,
    deviceScaleFactor: profile.deviceScaleFactor,
    hasTouch: profile.hasTouch,
    isMobile: profile.isMobile,
    locale: language === "el" ? "el-GR" : "en-GB",
    serviceWorkers: "allow",
  });
  await context.addInitScript((selectedLanguage) => {
    window.localStorage.setItem("studyapp.language.v1", selectedLanguage);
  }, language);
  const page = await context.newPage();
  return { context, page };
}

async function setCpuThrottle(
  context: BrowserContext,
  page: Page,
  rate: number,
): Promise<CDPSession> {
  const session = await context.newCDPSession(page);
  await session.send("Emulation.setCPUThrottlingRate", { rate });
  await session.send("Performance.enable");
  return session;
}

async function seedFixtureInBrowser(
  page: Page,
  plan: Pick<CapacityFixturePlan, "chapterCount" | "flashcardCount">,
): Promise<number> {
  return page.evaluate(async ({ chapterCount, flashcardCount }) => {
    const startedAt = performance.now();
    const units = Array.from({ length: chapterCount }, (_, index) => {
      const number = index + 1;
      return {
        id: `benchmark-unit-${number}`,
        number,
        title: `Benchmark chapter ${number}`,
        objectives: [`Objective ${number}`],
        summary: [`Summary ${number}`],
        keyTerms: [`term-${number}`],
      };
    });
    const flashcards = Array.from({ length: flashcardCount }, (_, index) => {
      const sequence = index + 1;
      const unitIndex = index % units.length;
      return {
        id: `benchmark-card-${sequence}`,
        unitId: units[unitIndex].id,
        number: Math.floor(index / units.length) + 1,
        question: `Benchmark question ${sequence}?`,
        answer: `Benchmark answer ${sequence}.`,
        tags: ["benchmark"],
      };
    });

    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open("generic-study-app");
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains("settings")) {
          database.close();
          reject(new Error("StudyApp settings store is unavailable."));
          return;
        }
        const transaction = database.transaction("settings", "readwrite");
        transaction.onerror = () => reject(transaction.error);
        transaction.oncomplete = () => {
          database.close();
          resolve();
        };
        const settings = transaction.objectStore("settings");
        settings.put({ key: "imported-study-units", value: units });
        settings.put({ key: "imported-flashcards", value: flashcards });
      };
    });
    return performance.now() - startedAt;
  }, plan);
}

async function readMemoryMetrics(
  session: CDPSession,
): Promise<Record<string, number | string>> {
  try {
    const response = await session.send("Performance.getMetrics") as {
      metrics: Array<{ name: string; value: number }>;
    };
    const values = new Map(
      response.metrics.map((metric) => [metric.name, metric.value] as const),
    );
    return {
      source: "Chromium CDP Performance.getMetrics",
      jsHeapUsedBytes: Math.round(values.get("JSHeapUsedSize") ?? 0),
      jsHeapTotalBytes: Math.round(values.get("JSHeapTotalSize") ?? 0),
      domNodes: Math.round(values.get("Nodes") ?? 0),
      documents: Math.round(values.get("Documents") ?? 0),
    };
  } catch {
    return { status: "unsupported", source: "UNSUPPORTED" };
  }
}

async function installRouteObservers(page: Page): Promise<void> {
  await page.evaluate(() => {
    interface CapacityWindow extends Window {
      __capacityMutationObserver?: MutationObserver;
      __capacityLongTaskObserver?: PerformanceObserver;
      __capacityState?: {
        actionAt?: number;
        longTaskSupported: boolean;
        longTasks: number[];
        managerAt?: number;
        start: number;
      };
    }
    const capacityWindow = window as CapacityWindow;
    capacityWindow.__capacityMutationObserver?.disconnect();
    capacityWindow.__capacityLongTaskObserver?.disconnect();
    const state: NonNullable<CapacityWindow["__capacityState"]> = {
      longTaskSupported: PerformanceObserver.supportedEntryTypes.includes("longtask"),
      longTasks: [] as number[],
      start: performance.now(),
    };
    capacityWindow.__capacityState = state;
    if (state.longTaskSupported) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.startTime >= state.start) state.longTasks.push(entry.duration);
        }
      });
      observer.observe({ type: "longtask", buffered: true });
      capacityWindow.__capacityLongTaskObserver = observer;
    }
    const mutationObserver = new MutationObserver(() => {
      const manager = document.querySelector("#practice-content");
      if (manager && state.managerAt === undefined) {
        state.managerAt = performance.now();
      }
      const action = manager?.querySelector<HTMLButtonElement>(
        ".practice-content-options button:not(:disabled)",
      );
      if (action && state.actionAt === undefined) {
        state.actionAt = performance.now();
      }
    });
    mutationObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
    capacityWindow.__capacityMutationObserver = mutationObserver;
  });
}

async function startLearnNavigation(page: Page): Promise<void> {
  await page.evaluate(() => {
    const capacityWindow = window as Window & {
      __capacityState?: {
        actionAt?: number;
        longTaskSupported: boolean;
        longTasks: number[];
        managerAt?: number;
        start: number;
      };
    };
    if (!capacityWindow.__capacityState) {
      throw new Error("Capacity route observer is not installed.");
    }
    capacityWindow.__capacityState.start = performance.now();
    capacityWindow.__capacityState.longTasks = [];
    window.location.hash = "#/learn";
  });
}

async function waitForManager(
  page: Page,
  plan: Pick<CapacityFixturePlan, "chapterCount" | "flashcardCount">,
): Promise<void> {
  await Promise.all([
    page.locator("#practice-content .practice-content-options button:not(:disabled)").first().waitFor({
      state: "visible",
      timeout: watchdogMs,
    }),
    page.waitForFunction(
      ({ chapterCount, flashcardCount }) => {
        const chapterHeading = document.querySelector(
          "#imported-practice-chapters-title",
        )?.textContent ?? "";
        const cardHeading = document.querySelector(
          "#imported-flashcards-title",
        )?.textContent ?? "";
        return chapterHeading.endsWith(`(${chapterCount})`)
          && cardHeading.endsWith(`(${flashcardCount})`);
      },
      plan,
      { timeout: watchdogMs },
    ),
  ]);
  await page.evaluate(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  }));
}

async function readAccessibilityTree(
  session: CDPSession,
): Promise<Record<string, number | string>> {
  try {
    const documentResponse = await session.send("DOM.getDocument", { depth: 0 }) as {
      root: { nodeId: number };
    };
    const queryResponse = await session.send("DOM.querySelector", {
      nodeId: documentResponse.root.nodeId,
      selector: "#practice-content",
    }) as { nodeId: number };
    const description = await session.send("DOM.describeNode", {
      nodeId: queryResponse.nodeId,
    }) as { node: { backendNodeId?: number } };
    if (description.node.backendNodeId === undefined) {
      return { status: "unsupported" };
    }
    const response = await session.send("Accessibility.queryAXTree", {
      backendNodeId: description.node.backendNodeId,
    }) as {
      nodes: Array<{
        ignored?: boolean;
        nodeId: string;
        parentId?: string;
        role?: { value?: string };
      }>;
    };
    const nodes = response.nodes.filter((node) => !node.ignored);
    const actionableRoles = new Set([
      "button",
      "link",
      "textbox",
      "combobox",
      "checkbox",
      "radio",
    ]);
    const byId = new Map(nodes.map((node) => [node.nodeId, node] as const));
    let maximumDepth = 0;
    for (const node of nodes) {
      let depth = 1;
      let parentId = node.parentId;
      const visited = new Set<string>();
      while (parentId && byId.has(parentId) && !visited.has(parentId)) {
        visited.add(parentId);
        depth += 1;
        parentId = byId.get(parentId)?.parentId;
      }
      maximumDepth = Math.max(maximumDepth, depth);
    }
    return {
      source: "Chromium CDP Accessibility.queryAXTree",
      nodeCount: nodes.length,
      actionableNodeCount: nodes.filter((node) =>
        actionableRoles.has(node.role?.value ?? "")
      ).length,
      maximumTreeDepth: maximumDepth,
    };
  } catch (error) {
    return { status: "unsupported", detail: describeError(error) };
  }
}

async function collectManagerMetrics(
  page: Page,
  session: CDPSession,
  memoryBefore: Record<string, number | string>,
): Promise<Omit<ManagerSample, "status" | "persistenceMs">> {
  const browserMetrics = await page.evaluate(() => {
    interface CapacityWindow extends Window {
      __capacityState?: {
        actionAt?: number;
        longTaskSupported: boolean;
        longTasks: number[];
        managerAt?: number;
        start: number;
      };
    }
    const state = (window as CapacityWindow).__capacityState;
    const manager = document.querySelector<HTMLElement>("#practice-content");
    if (!state || !manager) throw new Error("Capacity manager metrics are unavailable.");
    const panels = manager.querySelectorAll(".practice-content-list-panel");
    const focusableSelector = [
      "a[href]",
      "button:not([disabled])",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      "[tabindex]:not([tabindex='-1'])",
    ].join(",");
    const focusable = [...manager.querySelectorAll<HTMLElement>(focusableSelector)]
      .filter((element) => {
        const style = getComputedStyle(element);
        return !element.hidden
          && style.display !== "none"
          && style.visibility !== "hidden";
      });
    const earlyAction = manager.querySelector<HTMLButtonElement>(
      ".practice-content-options button:not(:disabled)",
    );
    const longTasks = state.longTasks;
    const finalAt = performance.now();
    const longTasksResult: Record<string, number | string> = state.longTaskSupported
      ? {
          status: "measured",
          count: longTasks.length,
          longestMs: Math.round(Math.max(0, ...longTasks)),
          cumulativeMs: Math.round(longTasks.reduce((sum, duration) => sum + duration, 0)),
          observationWindowMs: Math.round(finalAt - state.start),
        }
      : { status: "unsupported" };
    return {
      dom: {
        managerDomNodes: manager.querySelectorAll("*").length + 1,
        chapterRows: panels[0]?.querySelectorAll(".practice-content-item").length ?? 0,
        flashcardRows: panels[1]?.querySelectorAll(".practice-content-item").length ?? 0,
        focusableControls: focusable.length,
        horizontalOverflowPixels: Math.max(
          0,
          document.documentElement.scrollWidth - document.documentElement.clientWidth,
        ),
        managerHeightPixels: Math.round(manager.getBoundingClientRect().height),
        viewportHeightPixels: window.innerHeight,
      },
      keyboard: {
        earlyActionIndex: earlyAction ? focusable.indexOf(earlyAction) + 1 : -1,
        lateActionIndex: focusable.length,
        deepActionPractical: focusable.length <= 200,
      },
      firstManagerRenderMs: (state.managerAt ?? finalAt) - state.start,
      firstActionMs: (state.actionAt ?? finalAt) - state.start,
      finalTtiMs: finalAt - state.start,
      longTasks: longTasksResult,
    };
  });

  const firstAction = page.locator(
    "#practice-content .practice-content-options button:not(:disabled)",
  ).first();
  await firstAction.focus();
  for (let index = 0; index < 5; index += 1) await page.keyboard.press("Tab");
  const boundedTabSampleStayedInManager = await page.evaluate(() => {
    const manager = document.querySelector("#practice-content");
    return Boolean(manager && document.activeElement && manager.contains(document.activeElement));
  });
  const keyboard = {
    ...browserMetrics.keyboard,
    boundedTabSampleSize: 5,
    boundedTabSampleStayedInManager,
  };

  const memoryAfter = await readMemoryMetrics(session);
  const memory: Record<string, number | string> = {
    ...memoryAfter,
    beforeJsHeapUsedBytes: Number(memoryBefore.jsHeapUsedBytes ?? 0),
  };
  if (
    typeof memoryAfter.jsHeapUsedBytes === "number"
    && typeof memoryBefore.jsHeapUsedBytes === "number"
  ) {
    memory.deltaJsHeapUsedBytes = memoryAfter.jsHeapUsedBytes
      - memoryBefore.jsHeapUsedBytes;
  }

  return {
    ...browserMetrics,
    accessibilityTree: await readAccessibilityTree(session),
    keyboard,
    memory,
  };
}

async function verifyManagerPagination(page: Page): Promise<Record<string, unknown>> {
  const results: Record<string, unknown> = {};
  for (const [kind, headingSelector, listSelector] of [
    ["chapters", "#imported-practice-chapters-title", "#imported-practice-chapters-list"],
    ["flashcards", "#imported-flashcards-title", "#imported-flashcards-list"],
  ] as const) {
    const nextButton = page.locator(
      `${listSelector} + .practice-content-pagination button[data-page-direction="next"]`,
    );
    if (await nextButton.isDisabled()) {
      results[kind] = { status: "not-applicable", reason: "single page" };
      continue;
    }
    const firstItemBefore = await page.locator(`${listSelector} .practice-content-item`)
      .first()
      .textContent();
    await nextButton.click();
    await withWatchdog(page.waitForFunction(
      ({ before, selector }) =>
        document.querySelector(`${selector} .practice-content-item`)?.textContent !== before,
      { before: firstItemBefore, selector: listSelector },
    ), watchdogMs);
    await withWatchdog(page.waitForFunction(
      (selector) => document.activeElement === document.querySelector(selector),
      headingSelector,
    ), watchdogMs);
    results[kind] = await page.evaluate(
      ({ headingSelector: heading, listSelector: list }) => ({
        currentPage: document.querySelector(
          `${list} + .practice-content-pagination [aria-current="page"]`,
        )?.textContent ?? "",
        focusMovedToHeading: document.activeElement === document.querySelector(heading),
        mountedRows: document.querySelectorAll(`${list} .practice-content-item`).length,
        status: "pass",
      }),
      { headingSelector, listSelector },
    );
  }
  return { status: "pass", ...results };
}

async function measureManagerSample(
  browser: Browser,
  profile: BenchmarkProfile,
  plan: Pick<CapacityFixturePlan, "chapterCount" | "flashcardCount">,
  language: "en" | "el",
): Promise<ManagerSample> {
  const { context, page } = await createProfilePage(browser, profile, language);
  try {
    await page.goto("/");
    await page.waitForFunction(async () => (await indexedDB.databases()).some(
      (database) => database.name === "generic-study-app",
    ));
    const persistenceMs = await seedFixtureInBrowser(page, plan);
    const session = await setCpuThrottle(context, page, profile.cpuThrottle);
    const memoryBefore = await readMemoryMetrics(session);
    await installRouteObservers(page);
    await startLearnNavigation(page);
    await withWatchdog(waitForManager(page, plan), watchdogMs);
    const managerMetrics = await collectManagerMetrics(page, session, memoryBefore);
    return {
      status: "measured",
      persistenceMs: Math.round(persistenceMs),
      ...managerMetrics,
      pagination: await verifyManagerPagination(page),
    };
  } catch (error) {
    return {
      status: error instanceof BenchmarkWatchdogError
        || describeError(error).includes("Timeout")
        ? "timeout"
        : "failed",
      error: describeError(error),
      accessibilityTree: null,
      dom: null,
      keyboard: null,
      longTasks: null,
      memory: null,
      pagination: null,
    };
  } finally {
    await closeContext(context);
  }
}

function medianNumber(values: readonly number[]): number {
  return summarizeTimings(values)?.medianMs ?? 0;
}

function aggregateNumericRecord(
  samples: readonly ManagerSample[],
  key: "dom" | "keyboard" | "longTasks" | "memory" | "accessibilityTree",
): Record<string, number | string> | null {
  const records = samples
    .map((sample) => sample[key])
    .filter((record): record is Record<string, number | string> => record !== null);
  if (records.length === 0) return null;
  const keys = new Set(records.flatMap((record) => Object.keys(record)));
  const result: Record<string, number | string> = { sampleCount: records.length };
  for (const recordKey of keys) {
    const numericValues = records
      .map((record) => record[recordKey])
      .filter((value): value is number => typeof value === "number");
    if (numericValues.length > 0) result[`${recordKey}Median`] = medianNumber(numericValues);
    const textValue = records.map((record) => record[recordKey]).find(
      (value): value is string => typeof value === "string",
    );
    if (textValue !== undefined) result[recordKey] = textValue;
  }
  return result;
}

async function measureManagerScenario(
  browser: Browser,
  profile: BenchmarkProfile,
  request: CapacityFixtureRequest,
  language: "en" | "el",
  sampleCount: number,
): Promise<CapacityScenarioResult> {
  const plan = getCapacityFixturePlan(request);
  const samples: ManagerSample[] = [];
  for (let index = 0; index < sampleCount; index += 1) {
    samples.push(await measureManagerSample(browser, profile, plan, language));
  }
  const measured = samples.filter((sample) => sample.status === "measured");
  const errors = samples.flatMap((sample) => sample.error ? [sample.error] : []);
  const status: CapacityMetricStatus = measured.length > 0
    ? "measured"
    : samples.some((sample) => sample.status === "timeout")
      ? "timeout"
      : "failed";

  return {
    accessibilityTree: aggregateNumericRecord(measured, "accessibilityTree"),
    chapterCount: plan.chapterCount,
    dom: aggregateNumericRecord(measured, "dom") as Record<string, number> | null,
    errors,
    fixture: request.shape,
    flashcardCount: plan.flashcardCount,
    keyboard: aggregateNumericRecord(measured, "keyboard"),
    language,
    longTasks: aggregateNumericRecord(measured, "longTasks"),
    memory: aggregateNumericRecord(measured, "memory"),
    milestones: {
      routeStartMs: measured.length > 0 ? summarizeTimings(measured.map(() => 0)) : null,
      firstMeaningfulManagerRenderMs: summarizeTimings(
        measured.flatMap((sample) => sample.firstManagerRenderMs ?? []),
      ),
      firstActionDomInsertionMs: summarizeTimings(
        measured.flatMap((sample) => sample.firstActionMs ?? []),
      ),
      firstUsableManagerActionMs: summarizeTimings(
        measured.flatMap((sample) => sample.finalTtiMs ?? []),
      ),
      finalTimeToInteractionMs: summarizeTimings(
        measured.flatMap((sample) => sample.finalTtiMs ?? []),
      ),
    },
    percentage: request.percentage,
    profile: profile.id,
    sampleMetrics: samples.map((sample) => ({ ...sample })),
    status,
    timeToInteraction: summarizeTimings(
      measured.flatMap((sample) => sample.finalTtiMs ?? []),
    ),
    watchdogMs,
  };
}

async function warmProfile(browser: Browser, profile: BenchmarkProfile): Promise<void> {
  await measureManagerSample(
    browser,
    profile,
    { chapterCount: 10, flashcardCount: 100 },
    "en",
  );
}

async function waitForImportedCount(
  page: Page,
  headingSelector: string,
  count: number,
): Promise<void> {
  await page.waitForFunction(
    ({ count: expectedCount, headingSelector: selector }) =>
      (document.querySelector(selector)?.textContent ?? "").endsWith(`(${expectedCount})`),
    { count, headingSelector },
    { timeout: watchdogMs },
  );
}

async function measureImportSample(
  browser: Browser,
  profile: BenchmarkProfile,
  request: CapacityFixtureRequest,
): Promise<Record<string, unknown>> {
  const fixture = createCapacityFixture(request);
  const csv = createCapacityFixtureCsv(fixture);
  const { context, page } = await createProfilePage(browser, profile, "en");
  try {
    await page.goto("/#/learn");
    const session = await setCpuThrottle(context, page, profile.cpuThrottle);
    await session.send("Performance.enable");

    const chapterStartedAt = nodePerformance.now();
    await page.locator('input[name="chapters-csv"]').setInputFiles({
      name: "capacity-chapters.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(csv.chapters, "utf8"),
    });
    await withWatchdog(
      Promise.all([
        waitForImportedCount(
          page,
          "#imported-practice-chapters-title",
          fixture.units.length,
        ),
        page.getByRole("status").filter({
          hasText: `${fixture.units.length} practice chapter`,
        }).waitFor({ state: "visible", timeout: watchdogMs }),
      ]),
      watchdogMs,
    );
    const chapterImportMs = Math.round(nodePerformance.now() - chapterStartedAt);

    const cardStartedAt = nodePerformance.now();
    await page.locator('input[name="flashcards-csv"]').setInputFiles({
      name: "capacity-flashcards.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(csv.flashcards, "utf8"),
    });
    await withWatchdog(
      Promise.all([
        waitForImportedCount(
          page,
          "#imported-flashcards-title",
          fixture.flashcards.length,
        ),
        page.getByRole("status").filter({
          hasText: `${fixture.flashcards.length} flashcard`,
        }).waitFor({ state: "visible", timeout: watchdogMs }),
      ]),
      watchdogMs,
    );
    return {
      status: "measured",
      profile: profile.id,
      fixture: request.shape,
      percentage: request.percentage,
      chapterCount: fixture.units.length,
      flashcardCount: fixture.flashcards.length,
      chapterImportMs,
      flashcardImportMs: Math.round(nodePerformance.now() - cardStartedAt),
      timingBoundary: "file input activation through committed status and rendered count",
    };
  } catch (error) {
    return {
      status: error instanceof BenchmarkWatchdogError
        || describeError(error).includes("Timeout")
        ? "timeout"
        : "failed",
      profile: profile.id,
      fixture: request.shape,
      percentage: request.percentage,
      error: describeError(error),
    };
  } finally {
    await closeContext(context);
  }
}

async function verifyBackupRoundTrip(
  request: CapacityFixtureRequest,
): Promise<Record<string, unknown>> {
  const fixture = createCapacityFixture(request);
  const database = new StudyDatabase(`capacity-correctness-${process.pid}`);
  const result: Record<string, unknown> = {
    chapterCount: fixture.units.length,
    flashcardCount: fixture.flashcards.length,
    fingerprint: fixture.manifest.fingerprint,
  };
  try {
    const parsedUnits = parseStoredUnits(fixture.units);
    const parsedFlashcards = parseStoredFlashcards(fixture.flashcards);
    result.parse = parsedUnits.length === fixture.units.length
      && parsedFlashcards.length === fixture.flashcards.length
      ? "pass"
      : "fail";
    await database.settings.bulkPut([
      { key: IMPORTED_UNITS_SETTING_KEY, value: fixture.units },
      { key: IMPORTED_FLASHCARDS_SETTING_KEY, value: fixture.flashcards },
    ]);
    const [readUnits, readFlashcards] = await Promise.all([
      database.settings.get(IMPORTED_UNITS_SETTING_KEY),
      database.settings.get(IMPORTED_FLASHCARDS_SETTING_KEY),
    ]);
    result.read = parseStoredUnits(readUnits?.value).length === fixture.units.length
      && parseStoredFlashcards(readFlashcards?.value).length === fixture.flashcards.length
      ? "pass"
      : "fail";
    const backup = await exportBackup(database);
    result.backupExport = "pass";
    result.backupSettingCount = backup.settings.length;
    try {
      const serialized = serializeBackup(backup);
      result.serialization = "pass";
      result.serializedBytes = new TextEncoder().encode(serialized).byteLength;
    } catch (error) {
      result.serialization = "fail";
      result.serializationError = describeError(error);
      result.compactJsonBytes = new TextEncoder().encode(
        JSON.stringify(backup),
      ).byteLength;
    }
  } catch (error) {
    result.status = "fail";
    result.error = describeError(error);
  } finally {
    database.close();
    await database.delete();
  }
  return result;
}

async function verifyOfflineCachedRoute(
  browser: Browser,
  plan: Pick<CapacityFixturePlan, "chapterCount" | "flashcardCount"> = {
    chapterCount: 10,
    flashcardCount: 100,
  },
): Promise<Record<string, unknown>> {
  const profile = profiles[0];
  const { context, page } = await createProfilePage(browser, profile, "en");
  try {
    await page.goto("/");
    const workerReady = await page.evaluate(async () => {
      if (!("serviceWorker" in navigator)) return false;
      await navigator.serviceWorker.ready;
      return true;
    });
    if (!workerReady) {
      return { status: "environment-limited", reason: "Service workers unsupported." };
    }
    await page.reload();
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
    await seedFixtureInBrowser(page, plan);
    await page.goto("/#/learn");
    await waitForImportedCount(page, "#imported-flashcards-title", plan.flashcardCount);
    await context.setOffline(true);
    await page.reload({ waitUntil: "domcontentloaded" });
    await waitForImportedCount(page, "#imported-flashcards-title", plan.flashcardCount);
    const localCounts = await page.evaluate(async () => new Promise<{
      chapters: number;
      flashcards: number;
    }>((resolve, reject) => {
      const request = indexedDB.open("generic-study-app");
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const database = request.result;
        const transaction = database.transaction("settings", "readonly");
        const settings = transaction.objectStore("settings");
        const chapters = settings.get("imported-study-units");
        const flashcards = settings.get("imported-flashcards");
        transaction.onerror = () => reject(transaction.error);
        transaction.oncomplete = () => {
          resolve({
            chapters: Array.isArray(chapters.result?.value)
              ? chapters.result.value.length
              : 0,
            flashcards: Array.isArray(flashcards.result?.value)
              ? flashcards.result.value.length
              : 0,
          });
          database.close();
        };
      };
    }));
    return {
      status: localCounts.chapters === plan.chapterCount
          && localCounts.flashcards === plan.flashcardCount
        ? "pass"
        : "fail",
      serviceWorkerControlled: true,
      cachedRoute: "/#/learn",
      localCounts,
      procedure: "online install/control and route entry, then offline reload",
    };
  } catch (error) {
    return { status: "environment-limited", reason: describeError(error) };
  } finally {
    await context.setOffline(false).catch(() => undefined);
    await closeContext(context);
  }
}

function commandOutput(command: string, args: string[]): string {
  return execFileSync(command, args, { encoding: "utf8" }).trim();
}

async function environmentMetadata(browser: Browser): Promise<Record<string, unknown>> {
  const playwrightPackage = JSON.parse(
    await readFile(join("node_modules", "@playwright", "test", "package.json"), "utf8"),
  ) as { version: string };
  const processors = cpus();
  const npmVersion = process.env.npm_execpath
    ? commandOutput(process.execPath, [process.env.npm_execpath, "--version"])
    : "unavailable";
  return {
    host: {
      os: `${platform()} ${release()}`,
      cpu: processors[0]?.model ?? "unknown",
      logicalProcessors: processors.length,
      totalRamBytes: totalmem(),
      freeRamBytesAtStart: freemem(),
    },
    runtime: {
      node: process.version,
      npm: npmVersion,
      playwright: playwrightPackage.version,
      chromium: browser.version(),
      headless: true,
    },
    profiles,
    watchdogMs,
    caveat: "These results describe this named host and emulation only, not universal device capacity.",
  };
}

async function createArtifact(
  browser: Browser,
  mode: "smoke" | "baseline" | "calibration" | "safety-smoke",
): Promise<CapacityBenchmarkArtifact> {
  const scenarios: CapacityScenarioResult[] = [];
  const importMeasurements: Array<Record<string, unknown>> = [];

  if (mode === "smoke") {
    await warmProfile(browser, profiles[0]);
    scenarios.push(await measureManagerScenario(
      browser,
      profiles[0],
      { percentage: 25, shape: "mixed" },
      "en",
      1,
    ));
    await warmProfile(browser, profiles[1]);
    scenarios.push(await measureManagerScenario(
      browser,
      profiles[1],
      { percentage: 25, shape: "mixed" },
      "el",
      1,
    ));
    importMeasurements.push(await measureImportSample(
      browser,
      profiles[0],
      { percentage: 25, shape: "chapter-heavy" },
    ));
  } else if (mode === "baseline") {
    for (const profile of profiles) {
      await warmProfile(browser, profile);
      for (const percentage of [25, 50, 100] as const) {
        scenarios.push(await measureManagerScenario(
          browser,
          profile,
          { percentage, shape: "mixed" },
          "en",
          percentage === 100 ? 1 : 3,
        ));
      }
      for (const shape of ["chapter-heavy", "flashcard-heavy"] as const) {
        scenarios.push(await measureManagerScenario(
          browser,
          profile,
          { percentage: 25, shape },
          "en",
          2,
        ));
        for (let sample = 0; sample < 2; sample += 1) {
          importMeasurements.push(await measureImportSample(
            browser,
            profile,
            { percentage: 25, shape },
          ));
        }
      }
      scenarios.push(await measureManagerScenario(
        browser,
        profile,
        { percentage: 25, shape: "mixed" },
        "el",
        1,
      ));
    }
  } else if (mode === "calibration") {
    for (const profile of profiles) {
      await warmProfile(browser, profile);
      for (const language of ["en", "el"] as const) {
        scenarios.push(await measureManagerScenario(
          browser,
          profile,
          PERSONAL_USE_CALIBRATION,
          language,
          3,
        ));
      }
      for (let sample = 0; sample < 3; sample += 1) {
        importMeasurements.push(await measureImportSample(
          browser,
          profile,
          PERSONAL_USE_CALIBRATION,
        ));
      }
    }
  } else {
    await warmProfile(browser, profiles[0]);
    scenarios.push(await measureManagerScenario(
      browser,
      profiles[0],
      { percentage: 100, shape: "mixed" },
      "en",
      1,
    ));
  }

  const head = commandOutput("git", ["rev-parse", "HEAD"]);
  const artifact: CapacityBenchmarkArtifact = {
    benchmarkVersion: CAPACITY_BENCHMARK_VERSION,
    environment: await environmentMetadata(browser),
    generatedAt: new Date().toISOString(),
    git: {
      head,
      dirty: commandOutput("git", ["status", "--short"]).length > 0,
    },
    importMeasurements,
    mode,
    offline: mode === "safety-smoke"
      ? { status: "not-run", reason: "Offline behavior is covered by calibration mode." }
      : await verifyOfflineCachedRoute(
          browser,
          mode === "calibration" ? PERSONAL_USE_CALIBRATION : undefined,
        ),
    safetyCorrectness: mode === "baseline"
      ? await verifyBackupRoundTrip({ percentage: 100, shape: "mixed" })
      : mode === "calibration"
        ? await verifyBackupRoundTrip(PERSONAL_USE_CALIBRATION)
        : { status: "not-run", reason: "Correctness check is omitted in smoke mode." },
    safetyMaximums: {
      chapters: MAX_IMPORTED_UNITS,
      flashcards: MAX_IMPORTED_FLASHCARDS,
    },
    scenarios,
  };
  return parseCapacityBenchmarkArtifact(artifact);
}

async function writeArtifact(artifact: CapacityBenchmarkArtifact): Promise<string> {
  await mkdir(resultsDirectory, { recursive: true });
  const path = join(resultsDirectory, `capacity-${artifact.mode}.json`);
  await writeFile(path, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
  return path;
}

test("@capacity-smoke capacity harness instruments a 25% scenario", async ({ browser }) => {
  const artifact = await createArtifact(browser, "smoke");
  const path = await writeArtifact(artifact);
  expect(artifact.scenarios).toHaveLength(2);
  expect(artifact.scenarios[0].chapterCount).toBe(2_500);
  expect(artifact.scenarios[0].flashcardCount).toBe(25_000);
  console.log(`Capacity smoke artifact: ${path}`);
});

test("@capacity-baseline capacity harness records the complete named-profile matrix", async ({ browser }) => {
  const artifact = await createArtifact(browser, "baseline");
  const path = await writeArtifact(artifact);
  expect(artifact.scenarios).toHaveLength(12);
  expect(artifact.scenarios.filter((scenario) => scenario.fixture === "mixed")).toHaveLength(8);
  console.log(`Capacity baseline artifact: ${path}`);
});

test("@capacity-calibration measures the 150/1,500 personal-use candidate", async ({ browser }) => {
  const artifact = await createArtifact(browser, "calibration");
  const path = await writeArtifact(artifact);
  expect(artifact.scenarios).toHaveLength(4);
  expect(artifact.scenarios.every((scenario) =>
    scenario.chapterCount === PERSONAL_USE_CALIBRATION.chapterCount
      && scenario.flashcardCount === PERSONAL_USE_CALIBRATION.flashcardCount
      && scenario.sampleMetrics.length === 3
  )).toBe(true);
  expect(artifact.importMeasurements).toHaveLength(6);
  console.log(`Capacity calibration artifact: ${path}`);
});

test("@capacity-safety-smoke records bounded manager behavior at 10,000/100,000", async ({ browser }) => {
  const artifact = await createArtifact(browser, "safety-smoke");
  const path = await writeArtifact(artifact);
  const [scenario] = artifact.scenarios;
  expect(scenario).toMatchObject({
    chapterCount: MAX_IMPORTED_UNITS,
    flashcardCount: MAX_IMPORTED_FLASHCARDS,
  });
  if (scenario.status === "measured") {
    expect(scenario.sampleMetrics[0]).toMatchObject({
      pagination: { status: "pass" },
    });
  }
  console.log(`Capacity safety smoke artifact: ${path}`);
});
