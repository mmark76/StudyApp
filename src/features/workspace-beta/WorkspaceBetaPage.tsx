import {
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

const defaultPanelWeights: PanelWidths = [0.82, 1.38, 0.92];
const minimumPanelWidths: PanelWidths = [260, 400, 280];
const keyboardResizeStep = 32;

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
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
  const gridRef = useRef<HTMLDivElement>(null);
  const resizeDragRef = useRef<ResizeDragState | null>(null);
  const assistantUrl = getStudyAppAssistantUrl();

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

  return (
    <div
      className={`workspace-beta-shell workspace-beta-functional-shell${activeDivider !== null ? " is-resizing" : ""}`}
    >
      <a className="skip-link workspace-beta-skip" href="#workspace-beta-main">
        {text("Skip to workspace", "Μετάβαση στον χώρο εργασίας")}
      </a>

      <header className="workspace-beta-header">
        <div className="workspace-beta-brand">
          <strong>{studyConfig.appName}</strong>
          <span className="workspace-beta-badge">BETA</span>
          <span className="workspace-beta-title">{text("Workspace", "Χώρος εργασίας")}</span>
          <span className="workspace-beta-resize-hint">
            {text("Drag dividers to resize", "Σύρε τα διαχωριστικά για αλλαγή πλάτους")}
          </span>
        </div>
        <div className="workspace-beta-header-actions">
          <LanguageSwitcher />
          <Link to="/appearance">{text("Settings", "Ρυθμίσεις")}</Link>
          <details className="workspace-beta-info-menu">
            <summary>{text("Info", "Πληροφορίες")}</summary>
            <div className="workspace-beta-info-popover">
              <nav aria-label={text("Workspace information", "Πληροφορίες χώρου εργασίας")}>
                <Link rel="noopener noreferrer" target="_blank" to="/important-info">
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

      <main className="workspace-beta-main" id="workspace-beta-main">
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
                src={panelRoutes.ai}
                title={text("Functional AI Studio panel", "Λειτουργικό πάνελ AI Studio")}
              />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}