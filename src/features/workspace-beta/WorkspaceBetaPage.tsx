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
import "../../styles/workspaceBetaInfo.css";

type WorkspacePanelId = "sources" | "practice" | "ai";
type WorkspaceDivider = 0 | 1;
type PanelWidths = [number, number, number];
type WorkspaceInfoRoute = "/ai-assistant-comparison" | "/instructions" | "/important-info";

interface ResizeDragState {
  divider: WorkspaceDivider;
  pointerId: number;
  startX: number;
  startWidths: PanelWidths;
}

const panelRoutes: Record<WorkspacePanelId, string> = {
  sources: "/#/sources",
  practice: "/#/learn",
  ai: "/#/ai-assistant-guide",
};

const workspaceInfoRoutes = new Set<WorkspaceInfoRoute>([
  "/ai-assistant-comparison",
  "/instructions",
  "/important-info",
]);
const defaultPanelWeights: PanelWidths = [0.82, 1.38, 0.92];
const minimumPanelWidths: PanelWidths = [260, 400, 280];
const keyboardResizeStep = 32;

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
  const next: PanelWidths = [widths[0], widths[1], widths[2]];

  if (divider === 0) {
    const combinedWidth = widths[0] + widths[1];
    const sourceWidth = clamp(
      widths[0] + delta,
      minimumPanelWidths[0],
      combinedWidth - minimumPanelWidths[1],
    );
    next[0] = sourceWidth;
    next[1] = combinedWidth - sourceWidth;
    return next;
  }

  const combinedWidth = widths[1] + widths[2];
  const practiceWidth = clamp(
    widths[1] + delta,
    minimumPanelWidths[1],
    combinedWidth - minimumPanelWidths[2],
  );
  next[1] = practiceWidth;
  next[2] = combinedWidth - practiceWidth;
  return next;
}

export function WorkspaceBetaPage() {
  useAppearanceSettings();
  const { text } = useLanguage();
  const [frameVersions, setFrameVersions] = useState<Record<WorkspacePanelId, number>>({
    sources: 0,
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
  const headerRef = useRef<HTMLElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const assistantUrl = getStudyAppAssistantUrl();

  useEffect(() => {
    const modalOpen = infoModalRoute !== null;
    if (headerRef.current) headerRef.current.inert = modalOpen;
    if (mainRef.current) mainRef.current.inert = modalOpen;
    if (!modalOpen) return undefined;

    modalCloseButtonRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      closeInfoModal();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [infoModalRoute]);

  const gridStyle = panelWeights
    ? ({
        "--workspace-sources-track": `${panelWeights[0]}fr`,
        "--workspace-practice-track": `${panelWeights[1]}fr`,
        "--workspace-ai-track": `${panelWeights[2]}fr`,
      } as CSSProperties)
    : undefined;

  function resetPanel(panel: WorkspacePanelId) {
    setFrameVersions((current) => ({
      ...current,
      [panel]: current[panel] + 1,
    }));
  }

  function openInfoModal(route: WorkspaceInfoRoute) {
    modalReturnFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
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
        modalReturnFocusRef.current?.focus();
      }
      modalReturnFocusRef.current = null;
    });
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
        if ((event as KeyboardEvent).key !== "Escape") return;
        event.preventDefault();
        closeInfoModal();
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
    if (!panels || panels.length !== 3) return null;

    return [
      panels[0].getBoundingClientRect().width,
      panels[1].getBoundingClientRect().width,
      panels[2].getBoundingClientRect().width,
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
  const infoModalTitle = infoModalRoute === "/ai-assistant-comparison"
    ? text("Compare AI options", "Σύγκριση επιλογών AI")
    : infoModalRoute === "/instructions"
      ? text("StudyApp instructions", "Οδηγίες StudyApp")
      : infoModalRoute === "/important-info"
        ? text("Important Info", "Σημαντικές πληροφορίες")
        : "";

  return (
    <div
      className={`workspace-beta-shell workspace-beta-functional-shell${activeDivider !== null ? " is-resizing" : ""}`}
    >
      <a className="skip-link workspace-beta-skip" href="#workspace-beta-main">
        {text("Skip to workspace", "Μετάβαση στον χώρο εργασίας")}
      </a>

      <header className="workspace-beta-header" ref={headerRef}>
        <div className="workspace-beta-brand">
          <strong>{studyConfig.appName}</strong>
          <span className="workspace-beta-badge">BETA</span>
          <span className="workspace-beta-title">{text("Workspace", "Χώρος εργασίας")}</span>
        </div>
        <div className="workspace-beta-header-actions">
          <LanguageSwitcher />
          <Link to="/appearance">{text("Settings", "Ρυθμίσεις")}</Link>
          <details className="workspace-beta-info-menu">
            <summary>{text("Info", "Πληροφορίες")}</summary>
            <div className="workspace-beta-info-popover">
              <nav aria-label={text("Workspace information", "Πληροφορίες χώρου εργασίας")}>
                <Link
                  onClick={(event) => {
                    event.preventDefault();
                    event.currentTarget.closest("details")?.removeAttribute("open");
                    openInfoModal("/important-info");
                  }}
                  to="/important-info"
                >
                  {text("Important Info", "Σημαντικές πληροφορίες")}
                </Link>
                <a href="mailto:markellos.markides@gmail.com?subject=StudyApp%20Feedback">
                  {text("Feedback", "Σχόλια")}
                </a>
                <a href="https://markellosecosystem.com/" rel="noopener noreferrer" target="_blank">
                  {text("Back to markellosecosystem", "Πίσω στο markellosecosystem")}
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
          <Link className="workspace-beta-exit" to="/">{text("Exit", "Έξοδος")}</Link>
        </div>
      </header>

      <main className="workspace-beta-main" id="workspace-beta-main" ref={mainRef}>
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
                <h2 id="workspace-sources-title">{text("Sources", "Πηγές")}</h2>
              </div>
              <div className="workspace-beta-panel-tools">
                <span className="workspace-beta-live-label">{text("Live", "Ενεργό")}</span>
                <button onClick={() => resetPanel("sources")} type="button">
                  {text("Sources home", "Αρχική Πηγών")}
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
                title={text("Functional Sources panel", "Λειτουργικό πάνελ Πηγών")}
              />
            </div>
          </section>

          <div
            aria-label={text(
              "Resize Sources and Practice",
              "Αλλαγή πλάτους Πηγών και Εξάσκησης",
            )}
            aria-orientation="vertical"
            aria-valuenow={dividerValue(0)}
            className={`workspace-beta-resizer${activeDivider === 0 ? " is-active" : ""}`}
            onDoubleClick={resetPanelWidths}
            onKeyDown={(event) => resizeWithKeyboard(0, event)}
            onPointerDown={(event) => beginResize(0, event)}
            onPointerMove={continueResize}
            onPointerUp={finishResize}
            onPointerCancel={finishResize}
            role="separator"
            tabIndex={0}
            title={resizeTitle}
          />

          <section
            className="workspace-beta-panel workspace-beta-panel-practice workspace-beta-functional-panel"
            aria-labelledby="workspace-practice-title"
          >
            <div className="workspace-beta-panel-header workspace-beta-functional-panel-header">
              <div>
                <p className="workspace-beta-panel-kicker">02</p>
                <h2 id="workspace-practice-title">{text("Practice", "Εξάσκηση")}</h2>
              </div>
              <div className="workspace-beta-panel-tools">
                <span className="workspace-beta-live-label">{text("Live", "Ενεργό")}</span>
                <button onClick={() => resetPanel("practice")} type="button">
                  {text("Practice home", "Αρχική Εξάσκησης")}
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
                title={text("Functional Practice panel", "Λειτουργικό πάνελ Εξάσκησης")}
              />
            </div>
          </section>

          <div
            aria-label={text(
              "Resize Practice and AI Studio",
              "Αλλαγή πλάτους Εξάσκησης και AI Studio",
            )}
            aria-orientation="vertical"
            aria-valuenow={dividerValue(1)}
            className={`workspace-beta-resizer${activeDivider === 1 ? " is-active" : ""}`}
            onDoubleClick={resetPanelWidths}
            onKeyDown={(event) => resizeWithKeyboard(1, event)}
            onPointerDown={(event) => beginResize(1, event)}
            onPointerMove={continueResize}
            onPointerUp={finishResize}
            onPointerCancel={finishResize}
            role="separator"
            tabIndex={0}
            title={resizeTitle}
          />

          <section
            className="workspace-beta-panel workspace-beta-panel-studio workspace-beta-functional-panel"
            aria-labelledby="workspace-studio-title"
          >
            <div className="workspace-beta-panel-header workspace-beta-functional-panel-header">
              <div>
                <p className="workspace-beta-panel-kicker">03</p>
                <h2 id="workspace-studio-title">AI Studio</h2>
              </div>
              <div className="workspace-beta-panel-tools">
                <span className="workspace-beta-live-label">{text("Live", "Ενεργό")}</span>
                <button onClick={() => resetPanel("ai")} type="button">
                  {text("AI options", "Επιλογές AI")}
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
            role="dialog"
          >
            <header className="workspace-beta-info-modal-header">
              <div>
                <p>{text("Information", "Πληροφορίες")}</p>
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
              src={`/#${infoModalRoute}`}
              title={infoModalTitle}
            />
          </section>
        </div>
      ) : null}
    </div>
  );
}
