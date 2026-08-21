import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Link } from "react-router-dom";
import { studyConfig } from "../../app/studyConfig";
import { useLanguage } from "../../i18n/LanguageContext";
import { LanguageSwitcher } from "../../shared/components/LanguageSwitcher";
import { getStudyAppAssistantUrl } from "../assistant/assistantDestination";
import { useAppearanceSettings } from "../appearance/useAppearanceSettings";
import { WorkspaceThemeToggle } from "./WorkspaceThemeToggle";
import "../../styles/workspaceBetaInfo.css";

type WorkspacePanelId = "sources" | "knowledge" | "practice" | "ai";
type WorkspaceDivider = 0 | 1 | 2;
type PanelWidths = [number, number, number, number];
type WorkspaceInfoRoute = "/appearance" | "/ai-assistant-comparison" | "/instructions" | "/important-info";

interface ResizeDragState {
  divider: WorkspaceDivider;
  pointerId: number;
  startX: number;
  startWidths: PanelWidths;
}

const panelRoutes: Record<WorkspacePanelId, string> = {
  sources: "/#/sources",
  knowledge: "/#/core-knowledge",
  practice: "/#/learn",
  ai: "/#/ai-assistant-guide",
};

const workspaceInfoRoutes = new Set<WorkspaceInfoRoute>([
  "/appearance",
  "/ai-assistant-comparison",
  "/instructions",
  "/important-info",
]);
const defaultPanelWeights: PanelWidths = [0.9, 0.72, 1.15, 0.9];
const minimumPanelWidths: PanelWidths = [260, 240, 340, 280];
const keyboardResizeStep = 32;
const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function getFocusableElements(document: Document): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>(focusableSelector)].filter((element) => (
    element.getClientRects().length > 0
    && element.getAttribute("aria-hidden") !== "true"
    && !element.closest("[inert]")
  ));
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

function getWorkspaceHashPath(href: string): string | null {
  try {
    const url = new URL(href, window.location.href);
    if (!url.hash.startsWith("#/")) return null;
    return url.hash.slice(1).split(/[?#]/u)[0] ?? null;
  } catch {
    return null;
  }
}

function getWorkspaceInfoRoute(href: string): WorkspaceInfoRoute | null {
  const path = getWorkspaceHashPath(href);
  return path && workspaceInfoRoutes.has(path as WorkspaceInfoRoute)
    ? path as WorkspaceInfoRoute
    : null;
}

function resizeAdjacentPanels(
  divider: WorkspaceDivider,
  widths: PanelWidths,
  delta: number,
): PanelWidths {
  const next: PanelWidths = [widths[0], widths[1], widths[2], widths[3]];
  const firstIndex = divider;
  const secondIndex = divider + 1;
  const combinedWidth = widths[firstIndex] + widths[secondIndex];
  const firstWidth = clamp(
    widths[firstIndex] + delta,
    minimumPanelWidths[firstIndex],
    combinedWidth - minimumPanelWidths[secondIndex],
  );

  next[firstIndex] = firstWidth;
  next[secondIndex] = combinedWidth - firstWidth;
  return next;
}

export function WorkspaceBetaPage() {
  useAppearanceSettings();
  const { text } = useLanguage();
  const [frameVersions, setFrameVersions] = useState<Record<WorkspacePanelId, number>>({
    sources: 0,
    knowledge: 0,
    practice: 0,
    ai: 0,
  });
  const [panelWeights, setPanelWeights] = useState<PanelWidths | null>(null);
  const [activeDivider, setActiveDivider] = useState<WorkspaceDivider | null>(null);
  const [infoModalRoute, setInfoModalRoute] = useState<WorkspaceInfoRoute | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const resizeDragRef = useRef<ResizeDragState | null>(null);
  const modalReturnFocusRef = useRef<HTMLElement | null>(null);
  const modalCloseButtonRef = useRef<HTMLButtonElement>(null);
  const modalFrameRef = useRef<HTMLIFrameElement>(null);
  const modalRef = useRef<HTMLElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const skipLinkRef = useRef<HTMLAnchorElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const assistantUrl = getStudyAppAssistantUrl();

  useEffect(() => {
    if (infoModalRoute === null) return undefined;

    const inertStates = new Map<HTMLElement, boolean>();
    const makeInert = (element: HTMLElement | null) => {
      if (!element || inertStates.has(element)) return;
      inertStates.set(element, element.inert);
      element.inert = true;
    };
    makeInert(skipLinkRef.current);
    makeInert(headerRef.current);
    makeInert(mainRef.current);

    const workspaceShell = shellRef.current;
    const workspaceHost = workspaceShell?.parentElement ?? null;
    const inertOutsideWorkspace = (node: Node) => {
      if (node instanceof HTMLElement && node !== workspaceShell) makeInert(node);
    };
    workspaceHost?.childNodes.forEach(inertOutsideWorkspace);
    const workspaceHostObserver = workspaceHost
      ? new MutationObserver((records) => {
          records.forEach((record) => record.addedNodes.forEach(inertOutsideWorkspace));
        })
      : null;
    if (workspaceHost && workspaceHostObserver) {
      workspaceHostObserver.observe(workspaceHost, { childList: true });
    }

    modalCloseButtonRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      closeInfoModal();
    };
    const keepFocusInModal = (event: FocusEvent) => {
      const target = event.target;
      if (target instanceof Node && !modalRef.current?.contains(target)) {
        modalCloseButtonRef.current?.focus();
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    document.addEventListener("focusin", keepFocusInModal);
    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("focusin", keepFocusInModal);
      workspaceHostObserver?.disconnect();
      inertStates.forEach((wasInert, element) => {
        element.inert = wasInert;
      });
    };
  }, [infoModalRoute]);

  const gridStyle = panelWeights
    ? ({
        "--workspace-sources-track": `${panelWeights[0]}fr`,
        "--workspace-knowledge-track": `${panelWeights[1]}fr`,
        "--workspace-practice-track": `${panelWeights[2]}fr`,
        "--workspace-ai-track": `${panelWeights[3]}fr`,
      } as CSSProperties)
    : undefined;

  function resetPanel(panel: WorkspacePanelId) {
    setFrameVersions((current) => ({
      ...current,
      [panel]: current[panel] + 1,
    }));
  }

  function openInfoModal(route: WorkspaceInfoRoute, returnFocusTarget?: HTMLElement) {
    modalReturnFocusRef.current = returnFocusTarget
      ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    setInfoModalRoute(route);
  }

  function closeInfoModal(focusPanel?: WorkspacePanelId) {
    setInfoModalRoute(null);
    window.requestAnimationFrame(() => {
      if (focusPanel) {
        document.querySelector<HTMLIFrameElement>(
          `iframe[name="studyapp-workspace-${focusPanel}"]`,
        )?.focus();
      } else {
        const returnFocusTarget = modalReturnFocusRef.current;
        if (returnFocusTarget?.isConnected) {
          const details = returnFocusTarget.closest("details");
          if (details instanceof HTMLDetailsElement) details.open = true;
          returnFocusTarget.focus();
        }
      }
      modalReturnFocusRef.current = null;
    });
  }

  function focusModalFrameEdge(edge: "first" | "last") {
    const frame = modalFrameRef.current;
    if (!frame) return;
    try {
      const focusableElements = frame.contentDocument
        ? getFocusableElements(frame.contentDocument)
        : [];
      const target = edge === "first"
        ? focusableElements[0]
        : focusableElements[focusableElements.length - 1];
      if (target) target.focus();
      else frame.focus();
    } catch {
      frame.focus();
    }
  }

  function trapParentModalFocus(event: ReactKeyboardEvent<HTMLElement>) {
    if (event.key !== "Tab") return;
    const activeElement = document.activeElement;
    if (activeElement !== modalCloseButtonRef.current && activeElement !== modalFrameRef.current) {
      return;
    }

    event.preventDefault();
    if (activeElement === modalCloseButtonRef.current) {
      focusModalFrameEdge(event.shiftKey ? "last" : "first");
    } else if (event.shiftKey) {
      modalCloseButtonRef.current?.focus();
    } else {
      focusModalFrameEdge("first");
    }
  }

  function wirePanelInfoLinks(frame: HTMLIFrameElement) {
    try {
      const frameDocument = frame.contentDocument;
      if (!frameDocument || frameDocument.documentElement.dataset.workspaceInfoModalWired === "true") {
        return;
      }

      frameDocument.documentElement.dataset.workspaceInfoModalWired = "true";
      frameDocument.addEventListener("click", (event) => {
        const mouseEvent = event as MouseEvent;
        if (
          mouseEvent.button !== 0
          || mouseEvent.metaKey
          || mouseEvent.ctrlKey
          || mouseEvent.shiftKey
          || mouseEvent.altKey
        ) {
          return;
        }

        const target = event.target as Element | null;
        const anchor = target?.closest?.("a[href]") as HTMLAnchorElement | null;
        if (!anchor) return;
        const route = getWorkspaceInfoRoute(anchor.href);
        if (!route) return;

        event.preventDefault();
        event.stopPropagation();
        openInfoModal(route);
      }, true);
    } catch {
      // Workspace panels are same-origin; fail open if access is blocked.
    }
  }

  function wireModalFrame(frame: HTMLIFrameElement) {
    try {
      const frameDocument = frame.contentDocument;
      if (!frameDocument || frameDocument.documentElement.dataset.workspaceInfoModalFrameWired === "true") {
        return;
      }

      frameDocument.documentElement.dataset.workspaceInfoModalFrameWired = "true";
      frameDocument.addEventListener("keydown", (event) => {
        const keyboardEvent = event as KeyboardEvent;
        if (keyboardEvent.key === "Escape") {
          event.preventDefault();
          closeInfoModal();
          return;
        }
        if (keyboardEvent.key !== "Tab") return;

        const focusableElements = getFocusableElements(frameDocument);
        const activeElement = frameDocument.activeElement;
        const first = focusableElements[0];
        const last = focusableElements[focusableElements.length - 1];
        const leavingStart = keyboardEvent.shiftKey
          && (!first || activeElement === first || activeElement === frameDocument.body);
        const leavingEnd = !keyboardEvent.shiftKey
          && (!last || activeElement === last || activeElement === frameDocument.body);
        if (!leavingStart && !leavingEnd) return;

        event.preventDefault();
        modalCloseButtonRef.current?.focus();
      }, true);
      frameDocument.addEventListener("click", (event) => {
        const mouseEvent = event as MouseEvent;
        if (
          mouseEvent.button !== 0
          || mouseEvent.metaKey
          || mouseEvent.ctrlKey
          || mouseEvent.shiftKey
          || mouseEvent.altKey
        ) {
          return;
        }

        const target = event.target as Element | null;
        const anchor = target?.closest?.("a[href]") as HTMLAnchorElement | null;
        if (!anchor) return;
        const route = getWorkspaceHashPath(anchor.href);
        const focusPanel: WorkspacePanelId | null = route === "/sources"
          ? "sources"
          : route === "/core-knowledge"
            ? "knowledge"
            : route === "/learn"
              ? "practice"
              : route === "/ai-assistant-guide"
                ? "ai"
                : null;
        if (!focusPanel && route !== "/") return;

        event.preventDefault();
        event.stopPropagation();
        closeInfoModal(focusPanel ?? undefined);
      }, true);
    } catch {
      // The modal uses same-origin StudyApp routes; fail open if access is blocked.
    }
  }

  function resetPanelWidths() {
    resizeDragRef.current = null;
    setActiveDivider(null);
    setPanelWeights(null);
  }

  function readPanelWidths(): PanelWidths | null {
    const panels = gridRef.current?.querySelectorAll<HTMLElement>(
      ".workspace-beta-functional-panel",
    );
    if (!panels || panels.length !== 4) return null;

    return [
      panels[0].getBoundingClientRect().width,
      panels[1].getBoundingClientRect().width,
      panels[2].getBoundingClientRect().width,
      panels[3].getBoundingClientRect().width,
    ];
  }

  function beginResize(
    divider: WorkspaceDivider,
    event: ReactPointerEvent<HTMLDivElement>,
  ) {
    if (event.button !== 0) return;
    const widths = readPanelWidths();
    if (!widths) return;

    resizeDragRef.current = {
      divider,
      pointerId: event.pointerId,
      startX: event.clientX,
      startWidths: widths,
    };
    setActiveDivider(divider);
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  function continueResize(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = resizeDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    setPanelWeights(
      resizeAdjacentPanels(
        drag.divider,
        drag.startWidths,
        event.clientX - drag.startX,
      ),
    );
  }

  function finishResize(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = resizeDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    resizeDragRef.current = null;
    setActiveDivider(null);
  }

  function resizeWithKeyboard(
    divider: WorkspaceDivider,
    event: ReactKeyboardEvent<HTMLDivElement>,
  ) {
    if (event.key === "Home") {
      event.preventDefault();
      resetPanelWidths();
      return;
    }

    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    const widths = readPanelWidths();
    if (!widths) return;

    event.preventDefault();
    const direction = event.key === "ArrowRight" ? 1 : -1;
    setPanelWeights(
      resizeAdjacentPanels(
        divider,
        widths,
        keyboardResizeStep * direction,
      ),
    );
  }

  function dividerValue(divider: WorkspaceDivider): number {
    const weights = panelWeights ?? defaultPanelWeights;
    const firstIndex = divider;
    const secondIndex = divider + 1;
    const combined = weights[firstIndex] + weights[secondIndex];
    return Math.round((weights[firstIndex] / combined) * 100);
  }

  const resizeTitle = text(
    "Drag to resize. Use Left/Right arrow keys. Double-click to reset.",
    "Σύρε για αλλαγή πλάτους. Χρησιμοποίησε τα βέλη Αριστερά/Δεξιά. Διπλό κλικ για επαναφορά.",
  );
  const infoModalTitle = infoModalRoute === "/appearance"
    ? text("Settings", "Ρυθμίσεις")
    : infoModalRoute === "/ai-assistant-comparison"
      ? text("Compare AI options", "Σύγκριση επιλογών AI")
      : infoModalRoute === "/instructions"
        ? text("StudyApp instructions", "Οδηγίες StudyApp")
        : infoModalRoute === "/important-info"
          ? text("Important Info", "Σημαντικές πληροφορίες")
          : "";
  const infoModalKicker = infoModalRoute === "/appearance"
    ? text("Workspace", "Χώρος εργασίας")
    : text("Information", "Πληροφορίες");

  const renderDivider = (
    divider: WorkspaceDivider,
    englishLabel: string,
    greekLabel: string,
  ) => (
    <div
      aria-label={text(englishLabel, greekLabel)}
      aria-orientation="vertical"
      aria-valuenow={dividerValue(divider)}
      className={`workspace-beta-resizer${activeDivider === divider ? " is-active" : ""}`}
      onDoubleClick={resetPanelWidths}
      onKeyDown={(event) => resizeWithKeyboard(divider, event)}
      onPointerDown={(event) => beginResize(divider, event)}
      onPointerMove={continueResize}
      onPointerUp={finishResize}
      onPointerCancel={finishResize}
      role="separator"
      tabIndex={0}
      title={resizeTitle}
    />
  );

  return (
    <div
      className={`workspace-beta-shell workspace-beta-functional-shell${activeDivider !== null ? " is-resizing" : ""}`}
      ref={shellRef}
    >
      <a
        className="skip-link workspace-beta-skip"
        href="#workspace-beta-main"
        onClick={(event) => {
          event.preventDefault();
          mainRef.current?.focus();
          mainRef.current?.scrollIntoView({ block: "start" });
        }}
        ref={skipLinkRef}
      >
        {text("Skip to workspace", "Μετάβαση στον χώρο εργασίας")}
      </a>

      <header className="workspace-beta-header" ref={headerRef}>
        <div className="workspace-beta-header-left">
          <div className="workspace-beta-brand">
            <strong>{studyConfig.appName}</strong>
            <span className="workspace-beta-badge">BETA</span>
            <span className="workspace-beta-title">{text("Workspace", "Χώρος εργασίας")}</span>
          </div>
          <Link className="workspace-beta-standard-version" to="/">
            {text("Back to Standard Version", "Επιστροφή στην κανονική έκδοση")}
          </Link>
        </div>
        <div className="workspace-beta-header-actions">
          <LanguageSwitcher />
          <a
            className="workspace-beta-ecosystem-link"
            href="https://markellosecosystem.com/"
            rel="noopener noreferrer"
            target="_blank"
          >
            {text("Back to markellosecosystem", "Πίσω στο markellosecosystem")}
          </a>
          <WorkspaceThemeToggle />
          <Link
            onClick={(event) => {
              event.preventDefault();
              openInfoModal("/appearance", event.currentTarget);
            }}
            to="/appearance"
          >
            {text("Settings", "Ρυθμίσεις")}
          </Link>
          <details className="workspace-beta-info-menu">
            <summary>{text("Info", "Πληροφορίες")}</summary>
            <div className="workspace-beta-info-popover">
              <nav aria-label={text("Workspace information", "Πληροφορίες χώρου εργασίας")}>
                <Link
                  onClick={(event) => {
                    event.preventDefault();
                    openInfoModal("/important-info", event.currentTarget);
                  }}
                  to="/important-info"
                >
                  {text("Important Info", "Σημαντικές πληροφορίες")}
                </Link>
                <a href="mailto:markellos.markides@gmail.com?subject=StudyApp%20Feedback">
                  {text("Feedback", "Σχόλια")}
                </a>
                <span className="workspace-beta-info-separator" aria-hidden="true" />
                <Link rel="noopener noreferrer" target="_blank" to="/legal/license">
                  {text("License", "Άδεια")}
                </Link>
                <Link rel="noopener noreferrer" target="_blank" to="/legal/privacy">
                  {text("Privacy", "Απόρρητο")}
                </Link>
                <Link rel="noopener noreferrer" target="_blank" to="/legal/analytics">
                  {text("Analytics choices", "Αναλυτικά στοιχεία")}
                </Link>
                <Link rel="noopener noreferrer" target="_blank" to="/legal/copyright">
                  {text("Copyright protected", "Πνευματικά δικαιώματα")}
                </Link>
              </nav>
              <div className="workspace-beta-info-meta">
                <p>
                  © 2026 Markellos Markides. {text("All rights reserved.", "Με επιφύλαξη παντός δικαιώματος.")}
                </p>
                <small className="workspace-beta-info-version">{__APP_BUILD_ID__}</small>
              </div>
            </div>
          </details>
        </div>
      </header>

      <main className="workspace-beta-main" id="workspace-beta-main" ref={mainRef} tabIndex={-1}>
        <div
          className="workspace-beta-grid workspace-beta-functional-grid"
          aria-label={text("Workspace panels", "Πάνελ χώρου εργασίας")}
          ref={gridRef}
          style={gridStyle}
        >
          <section
            className="workspace-beta-panel workspace-beta-panel-sources workspace-beta-functional-panel"
            aria-labelledby="workspace-sources-title"
          >
            <div className="workspace-beta-panel-header workspace-beta-functional-panel-header">
              <div>
                <p className="workspace-beta-panel-kicker">01</p>
                <h2 id="workspace-sources-title">{text("Sources & Materials", "Πηγές & Υλικό")}</h2>
              </div>
              <div className="workspace-beta-panel-tools">
                <button onClick={() => resetPanel("sources")} type="button">
                  {text("Go to Sources & Materials home", "Μετάβαση στην αρχική Πηγών & Υλικού")}
                </button>
              </div>
            </div>
            <div className="workspace-beta-frame-wrap">
              <iframe
                key={`sources-${frameVersions.sources}`}
                className="workspace-beta-frame"
                name="studyapp-workspace-sources"
                onLoad={(event) => wirePanelInfoLinks(event.currentTarget)}
                src={panelRoutes.sources}
                title={text("Functional Sources & Materials panel", "Λειτουργικό πάνελ Πηγών & Υλικού")}
              />
            </div>
          </section>

          {renderDivider(
            0,
            "Resize Sources & Materials and Core Knowledge",
            "Αλλαγή πλάτους Πηγών & Υλικού και Βασικής Γνώσης",
          )}

          <section
            className="workspace-beta-panel workspace-beta-panel-knowledge workspace-beta-functional-panel"
            aria-labelledby="workspace-knowledge-title"
          >
            <div className="workspace-beta-panel-header workspace-beta-functional-panel-header">
              <div>
                <p className="workspace-beta-panel-kicker">02</p>
                <h2 id="workspace-knowledge-title">{text("Core Knowledge", "Βασική Γνώση")}</h2>
              </div>
              <div className="workspace-beta-panel-tools">
                <button onClick={() => resetPanel("knowledge")} type="button">
                  {text("Go to Core Knowledge home", "Μετάβαση στην αρχική Βασικής Γνώσης")}
                </button>
              </div>
            </div>
            <div className="workspace-beta-frame-wrap">
              <iframe
                key={`knowledge-${frameVersions.knowledge}`}
                className="workspace-beta-frame"
                name="studyapp-workspace-knowledge"
                onLoad={(event) => wirePanelInfoLinks(event.currentTarget)}
                src={panelRoutes.knowledge}
                title={text("Functional Core Knowledge panel", "Λειτουργικό πάνελ Βασικής Γνώσης")}
              />
            </div>
          </section>

          {renderDivider(
            1,
            "Resize Core Knowledge and Practice & Mastery",
            "Αλλαγή πλάτους Βασικής Γνώσης και Εξάσκησης & Εμπέδωσης",
          )}

          <section
            className="workspace-beta-panel workspace-beta-panel-practice workspace-beta-functional-panel"
            aria-labelledby="workspace-practice-title"
          >
            <div className="workspace-beta-panel-header workspace-beta-functional-panel-header">
              <div>
                <p className="workspace-beta-panel-kicker">03</p>
                <h2 id="workspace-practice-title">{text("Practice & Mastery", "Εξάσκηση & Εμπέδωση")}</h2>
              </div>
              <div className="workspace-beta-panel-tools">
                <button onClick={() => resetPanel("practice")} type="button">
                  {text("Go to Practice & Mastery home", "Μετάβαση στην αρχική Εξάσκησης & Εμπέδωσης")}
                </button>
              </div>
            </div>
            <div className="workspace-beta-frame-wrap">
              <iframe
                key={`practice-${frameVersions.practice}`}
                className="workspace-beta-frame"
                name="studyapp-workspace-practice"
                onLoad={(event) => wirePanelInfoLinks(event.currentTarget)}
                src={panelRoutes.practice}
                title={text("Functional Practice & Mastery panel", "Λειτουργικό πάνελ Εξάσκησης & Εμπέδωσης")}
              />
            </div>
          </section>

          {renderDivider(
            2,
            "Resize Practice & Mastery and AI Studio",
            "Αλλαγή πλάτους Εξάσκησης & Εμπέδωσης και AI Studio",
          )}

          <section
            className="workspace-beta-panel workspace-beta-panel-studio workspace-beta-functional-panel"
            aria-labelledby="workspace-studio-title"
          >
            <div className="workspace-beta-panel-header workspace-beta-functional-panel-header">
              <div>
                <p className="workspace-beta-panel-kicker">04</p>
                <h2 id="workspace-studio-title">AI Studio</h2>
              </div>
              <div className="workspace-beta-panel-tools">
                <button onClick={() => resetPanel("ai")} type="button">
                  {text("Go to AI options", "Μετάβαση στις επιλογές AI")}
                </button>
              </div>
            </div>
            <div className="workspace-beta-ai-launch-row">
              <a href={assistantUrl} rel="noopener noreferrer" target="_blank">
                {text("Start StudyApp AI Assistant", "Έναρξη Βοηθού AI του StudyApp")}
              </a>
              <span>
                {text(
                  "Opens ChatGPT in a new tab. No material is sent automatically.",
                  "Ανοίγει το ChatGPT σε νέα καρτέλα. Δεν αποστέλλεται υλικό αυτόματα.",
                )}
              </span>
            </div>
            <div className="workspace-beta-frame-wrap">
              <iframe
                key={`ai-${frameVersions.ai}`}
                className="workspace-beta-frame"
                name="studyapp-workspace-ai"
                onLoad={(event) => wirePanelInfoLinks(event.currentTarget)}
                src={panelRoutes.ai}
                title={text("Functional AI Studio panel", "Λειτουργικό πάνελ AI Studio")}
              />
            </div>
          </section>
        </div>
      </main>

      {infoModalRoute ? (
        <div
          className="workspace-beta-info-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeInfoModal();
          }}
        >
          <section
            aria-labelledby="workspace-beta-info-modal-title"
            aria-modal="true"
            className="workspace-beta-info-modal"
            onKeyDown={trapParentModalFocus}
            ref={modalRef}
            role="dialog"
          >
            <header className="workspace-beta-info-modal-header">
              <div>
                <p>{infoModalKicker}</p>
                <h2 id="workspace-beta-info-modal-title">{infoModalTitle}</h2>
              </div>
              <button
                aria-label={text("Close", "Κλείσιμο")}
                onClick={() => closeInfoModal()}
                ref={modalCloseButtonRef}
                type="button"
              >
                {text("Close", "Κλείσιμο")}
              </button>
            </header>
            <iframe
              className="workspace-beta-info-modal-frame"
              name="studyapp-workspace-info-modal"
              onLoad={(event) => wireModalFrame(event.currentTarget)}
              ref={modalFrameRef}
              src={`/#${infoModalRoute}`}
              title={infoModalTitle}
            />
          </section>
        </div>
      ) : null}
    </div>
  );
}
