import {
  useCallback,
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
import { useAppearanceSettings } from "../appearance/useAppearanceSettings";
import { WorkspaceThemeToggle } from "./WorkspaceThemeToggle";
import { StudyAppLocalWindowsZipLink } from "../../shared/components/StudyAppReleaseZipLinks";
import { getStudyAppAssistantUrl } from "../assistant/assistantDestination";
import { WorkspaceMaterialManager } from "./WorkspaceMaterialManager";
import type { MaterialPanel } from "./workspaceMaterialService";
import { WorkspaceLocalChat } from "./WorkspaceLocalChat";
import { WorkspaceReleaseArchive } from "./WorkspaceReleaseArchive";
import { LocalPortNote } from "../local-installation/LocalPortNote";
import {
  getChatGptPlanConnection,
  isStudyAppLocalEdition,
  LocalCompanionError,
  prepareChatGptPlanConnection,
  removeChatGptPlanConnection,
  startChatGptPlanConnection,
  STUDYAPP_LOCAL_PROTOCOL_URL,
  type ChatGptPlanConnectionStatus,
} from "../../infrastructure/local-companion/localCompanionClient";

type WorkspacePanelId = "sources" | "knowledge" | "practice" | "ai";
type WorkspaceDivider = 0 | 1 | 2;
type PanelWidths = [number, number, number, number];
type PhaseOneDivider = 0 | 1;
type PhaseOnePanelWidths = [number, number, number];
type WorkspaceInfoRoute = "/appearance" | "/ai-assistant-comparison" | "/instructions" | "/important-info" | "/local-installation-guide";
type WorkspaceSourcePopupRoute = "/library" | "/study/theory" | "/tools" | "/summary" | "/progress";
type WorkspaceModalRoute = WorkspaceInfoRoute | WorkspaceSourcePopupRoute;
type WorkspaceView = "ai-options" | "local" | "learning-goals" | "key-points" | "important-terms" | "summary" | "flashcards" | "review" | "quiz" | "progress";

interface ResizeDragState {
  divider: WorkspaceDivider;
  pointerId: number;
  startX: number;
  startWidths: PanelWidths;
}

interface PhaseOneResizeDragState {
  divider: PhaseOneDivider;
  pointerId: number;
  startX: number;
  startWidths: PhaseOnePanelWidths;
}

interface AgentResizeDragState {
  pointerId: number;
  startY: number;
  startHeights: [number, number];
}

const panelRoutes: Record<WorkspacePanelId, string> = {
  sources: "/#/sources",
  knowledge: "/#/core-knowledge",
  practice: "/#/learn",
  ai: "/#/ai-assistant-guide",
};

const workspaceTools: ReadonlyArray<{
  id: Exclude<WorkspaceView, "ai-options" | "local">;
  english: string;
  greek: string;
  descriptionEnglish: string;
  descriptionGreek: string;
  route: string;
}> = [
  { id: "learning-goals", english: "Learning Goals", greek: "Στόχοι μάθησης", descriptionEnglish: "View goals in imported practice chapters.", descriptionGreek: "Δες στόχους σε εισαγμένα κεφάλαια εξάσκησης.", route: "/#/core-knowledge?view=goals" },
  { id: "key-points", english: "Key Points", greek: "Βασικά σημεία", descriptionEnglish: "View key points in imported practice chapters.", descriptionGreek: "Δες βασικά σημεία σε εισαγμένα κεφάλαια εξάσκησης.", route: "/#/core-knowledge?view=key-points" },
  { id: "important-terms", english: "Important Terms", greek: "Σημαντικοί όροι", descriptionEnglish: "View terms in imported practice chapters.", descriptionGreek: "Δες όρους σε εισαγμένα κεφάλαια εξάσκησης.", route: "/#/core-knowledge?view=terms" },
  { id: "summary", english: "Summary of Uploaded Material", greek: "Περίληψη ανεβασμένου υλικού", descriptionEnglish: "Choose Library files or chapters to summarize.", descriptionGreek: "Επίλεξε αρχεία Βιβλιοθήκης ή κεφάλαια για περίληψη.", route: "/#/summary?workspace=beta" },
  { id: "flashcards", english: "Flashcards", greek: "Κάρτες", descriptionEnglish: "Use cards you create or import.", descriptionGreek: "Χρησιμοποίησε κάρτες που δημιούργησες ή εισήγαγες.", route: "/#/flashcards" },
  { id: "review", english: "Review", greek: "Επανάληψη", descriptionEnglish: "Practice due cards you create or import.", descriptionGreek: "Εξασκήσου σε κάρτες για επανάληψη που δημιούργησες ή εισήγαγες.", route: "/#/review" },
  { id: "quiz", english: "Quiz", greek: "Κουίζ", descriptionEnglish: "Test yourself with cards you create or import.", descriptionGreek: "Δοκίμασε τον εαυτό σου με κάρτες που δημιούργησες ή εισήγαγες.", route: "/#/quiz" },
  { id: "progress", english: "Progress", greek: "Πρόοδος", descriptionEnglish: "View practice results. Backup, restore and archive open separately.", descriptionGreek: "Δες αποτελέσματα εξάσκησης. Αντίγραφα, επαναφορά και αρχείο ανοίγουν ξεχωριστά.", route: "/#/progress?workspace=beta" },
];


const workspaceInfoRoutes = new Set<WorkspaceInfoRoute>([
  "/appearance",
  "/ai-assistant-comparison",
  "/instructions",
  "/important-info",
  "/local-installation-guide",
]);
const workspaceSourcePopupRoutes = new Set<WorkspaceSourcePopupRoute>([
  "/library",
  "/study/theory",
  "/tools",
  "/summary",
  "/progress",
]);
const defaultPanelWeights: PanelWidths = [25, 28, 25, 22];
const minimumPanelWidths: PanelWidths = [260, 240, 340, 280];
const phaseOneMinimumPanelWidths: PhaseOnePanelWidths = [180, 260, 180];
const defaultPhaseOnePanelWeights: PhaseOnePanelWidths = [1, 3, 1];
const agentMinimumPanelHeights: [number, number] = [160, 44];
const disconnectedAgentPanelWeights: [number, number] = [90, 10];
const connectedAgentPanelWeights: [number, number] = [50, 50];
const keyboardResizeStep = 32;
const disconnectedChatGptPlan: ChatGptPlanConnectionStatus = {
  connected: false,
  connectionState: "disconnected",
  planUsageAuthorized: false,
  scope: "current-windows-user",
};
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

function resizePhaseOneAdjacentPanels(
  divider: PhaseOneDivider,
  widths: PhaseOnePanelWidths,
  delta: number,
): PhaseOnePanelWidths {
  const next: PhaseOnePanelWidths = [...widths];
  const firstIndex = divider;
  const secondIndex = divider + 1;
  const combinedWidth = widths[firstIndex] + widths[secondIndex];
  const firstWidth = clamp(
    widths[firstIndex] + delta,
    phaseOneMinimumPanelWidths[firstIndex],
    combinedWidth - phaseOneMinimumPanelWidths[secondIndex],
  );

  next[firstIndex] = firstWidth;
  next[secondIndex] = combinedWidth - firstWidth;
  return next;
}

function resizeAgentPanels(
  heights: [number, number],
  delta: number,
): [number, number] {
  const combinedHeight = heights[0] + heights[1];
  const upperHeight = clamp(
    heights[0] + delta,
    agentMinimumPanelHeights[0],
    combinedHeight - agentMinimumPanelHeights[1],
  );
  return [upperHeight, combinedHeight - upperHeight];
}

export function WorkspaceBetaPage() {
  useAppearanceSettings();
  const { text } = useLanguage();
  const localEdition = isStudyAppLocalEdition();
  const [chatGptPlanConnection, setChatGptPlanConnection] = useState<ChatGptPlanConnectionStatus>(
    disconnectedChatGptPlan,
  );
  const [localConnectionBusy, setLocalConnectionBusy] = useState(false);
  const [localConnectionError, setLocalConnectionError] = useState("");
  const [localAwaitingApproval, setLocalAwaitingApproval] = useState(false);
  const [localSetupRequired, setLocalSetupRequired] = useState(false);
  const [localAiOptionsVisible, setLocalAiOptionsVisible] = useState(false);
  const [workspaceView, setWorkspaceView] = useState<WorkspaceView>("ai-options");
  const [frameVersions, setFrameVersions] = useState<Record<WorkspacePanelId, number>>({
    sources: 0,
    knowledge: 0,
    practice: 0,
    ai: 0,
  });
  const [panelWeights, setPanelWeights] = useState<PanelWidths | null>(null);
  const [collapsedPanels, setCollapsedPanels] = useState<WorkspacePanelId[]>([]);
  const [sourcesPanelExpanded, setSourcesPanelExpanded] = useState(true);
  const [toolsPanelExpanded, setToolsPanelExpanded] = useState(true);
  const [agentPanelExpanded, setAgentPanelExpanded] = useState(true);
  const [phaseOnePanelWeights, setPhaseOnePanelWeights] = useState<PhaseOnePanelWidths | null>(null);
  const [agentPanelWeights, setAgentPanelWeights] = useState<[number, number] | null>(null);
  const [activePhaseOneDivider, setActivePhaseOneDivider] = useState<PhaseOneDivider | null>(null);
  const [agentDividerActive, setAgentDividerActive] = useState(false);
  const [activeDivider, setActiveDivider] = useState<WorkspaceDivider | null>(null);
  const [infoModalRoute, setInfoModalRoute] = useState<WorkspaceModalRoute | null>(null);
  const [releaseArchiveOpen, setReleaseArchiveOpen] = useState(false);
  const [materialPanel, setMaterialPanel] = useState<MaterialPanel | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const resizeDragRef = useRef<ResizeDragState | null>(null);
  const phaseOneGridRef = useRef<HTMLDivElement>(null);
  const phaseOneResizeDragRef = useRef<PhaseOneResizeDragState | null>(null);
  const agentSplitRef = useRef<HTMLDivElement>(null);
  const agentResizeDragRef = useRef<AgentResizeDragState | null>(null);
  const modalReturnFocusRef = useRef<HTMLElement | null>(null);
  const modalCloseButtonRef = useRef<HTMLButtonElement>(null);
  const modalFrameRef = useRef<HTMLIFrameElement>(null);
  const modalRef = useRef<HTMLElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const skipLinkRef = useRef<HTMLAnchorElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const mainRef = useRef<HTMLElement>(null);

  const refreshChatGptPlanConnection = useCallback(async () => {
    try {
      const status = await getChatGptPlanConnection();
      setChatGptPlanConnection(status);
      if (typeof status.preparationRequired === "boolean") setLocalSetupRequired(status.preparationRequired);
      if (status.connected || status.connectionState === "unreadable") setLocalAwaitingApproval(false);
    } catch {
      setChatGptPlanConnection(disconnectedChatGptPlan);
      setLocalAwaitingApproval(false);
    }
  }, []);

  useEffect(() => {
    if (!localEdition) return;

    void refreshChatGptPlanConnection();
    window.addEventListener("focus", refreshChatGptPlanConnection);
    const timer = window.setInterval(() => void refreshChatGptPlanConnection(), 2_000);
    return () => {
      window.removeEventListener("focus", refreshChatGptPlanConnection);
      window.clearInterval(timer);
    };
  }, [localEdition, refreshChatGptPlanConnection]);

  const localChatReady = localEdition
    && chatGptPlanConnection.connected
    && chatGptPlanConnection.planUsageAuthorized;
  const defaultAgentPanelWeights = localChatReady
    ? connectedAgentPanelWeights
    : disconnectedAgentPanelWeights;

  useEffect(() => {
    // Connection transitions get a fresh default; drag adjustments remain intact
    // during the periodic connection-status refreshes.
    setAgentPanelWeights(null);
  }, [localChatReady]);

  async function changeLocalConnection() {
    if (localConnectionBusy) return;
    setLocalConnectionBusy(true);
    setLocalConnectionError("");
    try {
      if (chatGptPlanConnection.connected) {
        setChatGptPlanConnection(await removeChatGptPlanConnection());
        setWorkspaceView("ai-options");
        setLocalAwaitingApproval(false);
      } else {
        setChatGptPlanConnection(await startChatGptPlanConnection());
        setLocalAwaitingApproval(true);
      }
      setLocalSetupRequired(false);
    } catch (error) {
      setLocalAwaitingApproval(false);
      setLocalSetupRequired(error instanceof LocalCompanionError && error.setupRequired);
      setLocalConnectionError(error instanceof Error ? error.message : text(
        "The ChatGPT connection could not be changed.",
        "Δεν ήταν δυνατή η αλλαγή της σύνδεσης ChatGPT.",
      ));
    } finally {
      setLocalConnectionBusy(false);
    }
  }

  async function prepareLocalConnection() {
    setLocalConnectionBusy(true);
    setLocalConnectionError("");
    try {
      const result = await prepareChatGptPlanConnection();
      setLocalSetupRequired(false);
      setLocalConnectionError(result.state === "READY" ? text("Connection prepared. Select Connect.", "Η σύνδεση προετοιμάστηκε. Πάτησε Σύνδεση.") : text("Complete the setup window, then restart StudyApp Local.", "Ολοκλήρωσε τη ρύθμιση και επανεκκίνησε το StudyApp Local."));
    } catch (error) {
      setLocalConnectionError(error instanceof Error ? error.message : text(
        "The local connection setup could not start.",
        "Δεν ήταν δυνατή η έναρξη της ρύθμισης της τοπικής σύνδεσης.",
      ));
    } finally {
      setLocalConnectionBusy(false);
    }
  }

  useEffect(() => {
    if (infoModalRoute === null && !releaseArchiveOpen) return undefined;

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
      closeActiveModal();
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
  }, [infoModalRoute, releaseArchiveOpen]);

  const ids: WorkspacePanelId[] = ["sources", "knowledge", "practice", "ai"];
  const collapsedGridTemplate = collapsedPanels.length
    ? ids.map((id, index) => {
        const track = collapsedPanels.includes(id) ? "36px" : "minmax(0, " + (panelWeights ?? defaultPanelWeights)[index] + "fr)";
        return index === 0 ? track : "10px " + track;
      }).join(" ")
    : undefined;
  function togglePanelVisibility(id: WorkspacePanelId) {
    setCollapsedPanels((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

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

  function openInfoModal(route: WorkspaceModalRoute, returnFocusTarget?: HTMLElement) {
    modalReturnFocusRef.current = returnFocusTarget
      ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    setInfoModalRoute(route);
  }

  function openReleaseArchive(returnFocusTarget?: HTMLElement) {
    modalReturnFocusRef.current = returnFocusTarget
      ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    setReleaseArchiveOpen(true);
  }

  function closeActiveModal() {
    setInfoModalRoute(null);
    setReleaseArchiveOpen(false);
    window.requestAnimationFrame(() => {
      const returnFocusTarget = modalReturnFocusRef.current;
      if (returnFocusTarget?.isConnected) returnFocusTarget.focus();
      modalReturnFocusRef.current = null;
    });
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

  useEffect(() => {
    const openWorkspaceSetup = (event: MessageEvent<unknown>) => {
      if (event.origin !== window.location.origin || !event.data || typeof event.data !== "object") return;
      const { type, route } = event.data as { type?: unknown; route?: unknown };
      if (type !== "studyapp-workspace-open-modal" || (route !== "/summary" && route !== "/progress")) return;
      openInfoModal(route);
    };
    window.addEventListener("message", openWorkspaceSetup);
    return () => window.removeEventListener("message", openWorkspaceSetup);
  }, []);

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
        const infoRoute = getWorkspaceInfoRoute(anchor.href);
        const sourceRoute = frame.name === "studyapp-workspace-sources"
          ? getWorkspaceHashPath(anchor.href)
          : null;
        const route = infoRoute ?? (
          sourceRoute && workspaceSourcePopupRoutes.has(sourceRoute as WorkspaceSourcePopupRoute)
          && (frame.name === "studyapp-workspace-sources"
            || (frame.name === "studyapp-workspace-workspace" && (sourceRoute === "/summary" || sourceRoute === "/progress")))
            ? sourceRoute as WorkspaceSourcePopupRoute
            : null
        );
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
        : infoModalRoute === "/local-installation-guide"
          ? text("Installation Guide", "Οδηγός εγκατάστασης")
        : infoModalRoute === "/important-info"
          ? text("Important Info", "Σημαντικές πληροφορίες")
          : infoModalRoute === "/library"
            ? text("Library", "Βιβλιοθήκη")
            : infoModalRoute === "/study/theory"
              ? text("Manual Import", "Χειροκίνητη εισαγωγή")
              : infoModalRoute === "/tools"
                ? text("Split PDF Tool", "Εργαλείο χωρισμού PDF")
                : infoModalRoute === "/summary"
                  ? text("Create summary", "Δημιουργία περίληψης")
                  : infoModalRoute === "/progress"
                    ? text("Progress management", "Διαχείριση προόδου")
          : "";
  const infoModalKicker = infoModalRoute === "/appearance"
    ? text("Workspace", "Χώρος εργασίας")
    : infoModalRoute === "/summary" || infoModalRoute === "/progress"
      ? text("AI-Assisted Tools", "Εργαλεία με υποστήριξη AI")
    : infoModalRoute && workspaceSourcePopupRoutes.has(infoModalRoute as WorkspaceSourcePopupRoute)
      ? text("Sources & Materials", "Πηγές & Υλικό")
      : text("Information", "Πληροφορίες");

  const renderDivider = (
    divider: WorkspaceDivider,
    englishLabel: string,
    greekLabel: string,
  ) => import.meta.env.MODE === "e2e" ? (
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
  ) : (
    <div
      aria-hidden="true"
      className="workspace-beta-resizer is-locked"
    />
  );

  function resetPhaseOnePanelWidths() {
    phaseOneResizeDragRef.current = null;
    setActivePhaseOneDivider(null);
    setPhaseOnePanelWeights(null);
  }

  function readPhaseOnePanelWidths(): PhaseOnePanelWidths | null {
    const panels = phaseOneGridRef.current?.querySelectorAll<HTMLElement>(
      ":scope > .workspace-beta-panel",
    );
    if (!panels || panels.length !== 3) return null;
    return [
      panels[0].getBoundingClientRect().width,
      panels[1].getBoundingClientRect().width,
      panels[2].getBoundingClientRect().width,
    ];
  }

  function beginPhaseOneResize(
    divider: PhaseOneDivider,
    event: ReactPointerEvent<HTMLDivElement>,
  ) {
    if (event.button !== 0) return;
    const widths = readPhaseOnePanelWidths();
    if (!widths) return;
    phaseOneResizeDragRef.current = {
      divider,
      pointerId: event.pointerId,
      startX: event.clientX,
      startWidths: widths,
    };
    setActivePhaseOneDivider(divider);
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  function continuePhaseOneResize(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = phaseOneResizeDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    setPhaseOnePanelWeights(resizePhaseOneAdjacentPanels(
      drag.divider,
      drag.startWidths,
      event.clientX - drag.startX,
    ));
  }

  function finishPhaseOneResize(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = phaseOneResizeDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    phaseOneResizeDragRef.current = null;
    setActivePhaseOneDivider(null);
  }

  function resizePhaseOneWithKeyboard(
    divider: PhaseOneDivider,
    event: ReactKeyboardEvent<HTMLDivElement>,
  ) {
    if (event.key === "Home") {
      event.preventDefault();
      resetPhaseOnePanelWidths();
      return;
    }
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    const widths = readPhaseOnePanelWidths();
    if (!widths) return;
    event.preventDefault();
    setPhaseOnePanelWeights(resizePhaseOneAdjacentPanels(
      divider,
      widths,
      keyboardResizeStep * (event.key === "ArrowRight" ? 1 : -1),
    ));
  }

  function phaseOneDividerValue(divider: PhaseOneDivider): number {
    const weights = phaseOnePanelWeights ?? defaultPhaseOnePanelWeights;
    const combined = weights[divider] + weights[divider + 1];
    return Math.round((weights[divider] / combined) * 100);
  }

  function renderPhaseOneDivider(
    divider: PhaseOneDivider,
    englishLabel: string,
    greekLabel: string,
  ) {
    const enabled = divider === 0 ? sourcesPanelExpanded : toolsPanelExpanded;
    return (
      <div
        aria-disabled={!enabled}
        aria-label={text(englishLabel, greekLabel)}
        aria-orientation="vertical"
        aria-valuenow={phaseOneDividerValue(divider)}
        className={`workspace-beta-resizer workspace-beta-phase-divider-${divider}${activePhaseOneDivider === divider ? " is-active" : ""}${enabled ? "" : " is-locked"}`}
        onDoubleClick={() => { if (enabled) resetPhaseOnePanelWidths(); }}
        onKeyDown={(event) => { if (enabled) resizePhaseOneWithKeyboard(divider, event); }}
        onPointerCancel={finishPhaseOneResize}
        onPointerDown={(event) => { if (enabled) beginPhaseOneResize(divider, event); }}
        onPointerMove={continuePhaseOneResize}
        onPointerUp={finishPhaseOneResize}
        role="separator"
        tabIndex={enabled ? 0 : -1}
        title={resizeTitle}
      />
    );
  }

  function resetAgentPanelHeights() {
    agentResizeDragRef.current = null;
    setAgentDividerActive(false);
    setAgentPanelWeights(null);
  }

  function readAgentPanelHeights(): [number, number] | null {
    const upper = agentSplitRef.current?.querySelector<HTMLElement>(
      ":scope > .workspace-beta-central-content",
    );
    const lower = agentSplitRef.current?.querySelector<HTMLElement>(
      ":scope > .workspace-beta-persistent-agent",
    );
    if (!upper || !lower) return null;
    return [
      upper.getBoundingClientRect().height,
      lower.getBoundingClientRect().height,
    ];
  }

  function beginAgentResize(event: ReactPointerEvent<HTMLDivElement>) {
    if (!agentPanelExpanded || event.button !== 0) return;
    const heights = readAgentPanelHeights();
    if (!heights) return;
    agentResizeDragRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startHeights: heights,
    };
    setAgentDividerActive(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  function continueAgentResize(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = agentResizeDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    setAgentPanelWeights(resizeAgentPanels(
      drag.startHeights,
      event.clientY - drag.startY,
    ));
  }

  function finishAgentResize(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = agentResizeDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    agentResizeDragRef.current = null;
    setAgentDividerActive(false);
  }

  function resizeAgentWithKeyboard(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (!agentPanelExpanded) return;
    if (event.key === "Home") {
      event.preventDefault();
      resetAgentPanelHeights();
      return;
    }
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
    const heights = readAgentPanelHeights();
    if (!heights) return;
    event.preventDefault();
    setAgentPanelWeights(resizeAgentPanels(
      heights,
      keyboardResizeStep * (event.key === "ArrowDown" ? 1 : -1),
    ));
  }

  function agentDividerValue(): number {
    const weights = agentPanelWeights ?? defaultAgentPanelWeights;
    return Math.round((weights[0] / (weights[0] + weights[1])) * 100);
  }

  function renderPhaseOne() {
    const selectedTool = workspaceTools.find((tool) => tool.id === workspaceView) ?? null;
    const isSelectedMode = workspaceView !== "ai-options";
    const agentStatus = localChatReady
      ? text("Available", "Διαθέσιμο")
      : text("Not available", "Μη διαθέσιμο");
    const phaseOneWeights = phaseOnePanelWeights ?? defaultPhaseOnePanelWeights;
    const phaseOneGridStyle = {
      gridTemplateColumns: [
        sourcesPanelExpanded ? `minmax(0, ${phaseOneWeights[0]}fr)` : "3rem",
        "10px",
        `minmax(0, ${phaseOneWeights[1]}fr)`,
        "10px",
        toolsPanelExpanded ? `minmax(0, ${phaseOneWeights[2]}fr)` : "3rem",
      ].join(" "),
    } satisfies CSSProperties;
    const agentWeights = agentPanelWeights ?? defaultAgentPanelWeights;
    const agentSplitStyle = {
      gridTemplateRows: agentPanelExpanded
        ? `minmax(0, ${agentWeights[0]}fr) 10px minmax(${agentMinimumPanelHeights[1]}px, ${agentWeights[1]}fr)`
        : "minmax(0, 1fr) 10px auto",
    } satisfies CSSProperties;

    return (
      <div
        className={`workspace-beta-shell workspace-beta-functional-shell workspace-beta-phase-one${agentPanelExpanded ? "" : " is-agent-collapsed"}${activePhaseOneDivider !== null ? " is-resizing" : ""}${agentDividerActive ? " is-resizing-agent" : ""}`}
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
              <StudyAppLocalWindowsZipLink className="workspace-beta-local-download" compact />
              <LocalPortNote />
              <Link className="workspace-beta-installation-guide-link" onClick={(event) => {
                event.preventDefault();
                openInfoModal("/local-installation-guide", event.currentTarget);
              }} to="/local-installation-guide">{text("Installation Guide", "Οδηγός εγκατάστασης")}</Link>
            </div>
          </div>
          <div className="workspace-beta-header-actions">
            <LanguageSwitcher />
            {!localEdition ? <button className="workspace-beta-release-archive-trigger" onClick={(event) => openReleaseArchive(event.currentTarget)} type="button">{text("ZIP versions", "Εκδόσεις ZIP")}</button> : null}
            <a className="workspace-beta-ecosystem-link" href="https://markellosecosystem.com/" rel="noopener noreferrer" target="_blank">{text("Back to markellosecosystem", "Πίσω στο markellosecosystem")}</a>
            <Link onClick={(event) => { event.preventDefault(); openInfoModal("/instructions", event.currentTarget); }} to="/instructions">{text("Help / Instructions", "Βοήθεια / Οδηγίες")}</Link>
            <WorkspaceThemeToggle />
            <Link onClick={(event) => { event.preventDefault(); openInfoModal("/appearance", event.currentTarget); }} to="/appearance">{text("Settings", "Ρυθμίσεις")}</Link>
            <details className="workspace-beta-info-menu">
              <summary>{text("Info", "Πληροφορίες")}</summary>
              <div className="workspace-beta-info-popover">
                <nav aria-label={text("Workspace information", "Πληροφορίες χώρου εργασίας")}>
                  <Link onClick={(event) => { event.preventDefault(); openInfoModal("/important-info", event.currentTarget); }} to="/important-info">{text("Important Info", "Σημαντικές πληροφορίες")}</Link>
                  <a href="mailto:markellos.markides@gmail.com?subject=StudyApp%20Feedback">{text("Feedback", "Σχόλια")}</a>
                  <span className="workspace-beta-info-separator" aria-hidden="true" />
                  <Link rel="noopener noreferrer" target="_blank" to="/legal/license">{text("License", "Άδεια")}</Link>
                  <Link rel="noopener noreferrer" target="_blank" to="/legal/privacy">{text("Privacy", "Απόρρητο")}</Link>
                  <Link rel="noopener noreferrer" target="_blank" to="/legal/analytics">{text("Analytics information", "Πληροφορίες analytics")}</Link>
                  <Link rel="noopener noreferrer" target="_blank" to="/legal/copyright">{text("Copyright protected", "Πνευματικά δικαιώματα")}</Link>
                </nav>
              </div>
            </details>
          </div>
        </header>
        <main className="workspace-beta-main" id="workspace-beta-main" ref={mainRef} tabIndex={-1}>
          <div aria-label={text("Workspace panels", "Πάνελ χώρου εργασίας")} className="workspace-beta-phase-one-grid" ref={phaseOneGridRef} style={phaseOneGridStyle}>
            <section className={`workspace-beta-panel workspace-beta-phase-sources${sourcesPanelExpanded ? "" : " is-collapsed"}`} aria-labelledby="workspace-sources-title">
              <div className="workspace-beta-panel-header workspace-beta-functional-panel-header">
                <div><p className="workspace-beta-panel-kicker">01</p><h2 id="workspace-sources-title">{text("Sources & Materials", "Πηγές & Υλικό")}</h2></div>
                <div className="workspace-beta-side-header-actions">
                  <button
                    aria-controls="workspace-beta-sources-content"
                    aria-expanded={sourcesPanelExpanded}
                    aria-label={text(sourcesPanelExpanded ? "Hide sources panel" : "Show sources panel", sourcesPanelExpanded ? "Απόκρυψη πάνελ πηγών" : "Εμφάνιση πάνελ πηγών")}
                    className="workspace-beta-column-toggle workspace-beta-side-toggle"
                    onClick={() => setSourcesPanelExpanded((expanded) => !expanded)}
                    title={text(sourcesPanelExpanded ? "Hide sources panel" : "Show sources panel", sourcesPanelExpanded ? "Απόκρυψη πάνελ πηγών" : "Εμφάνιση πάνελ πηγών")}
                    type="button"
                  >
                    <span aria-hidden="true" className="workspace-beta-column-symbol" />
                  </button>
                </div>
              </div>
              <div className="workspace-beta-frame-wrap" id="workspace-beta-sources-content"><iframe key={`sources-${frameVersions.sources}`} className="workspace-beta-frame" name="studyapp-workspace-sources" onLoad={(event) => wirePanelInfoLinks(event.currentTarget)} src={panelRoutes.sources} title={text("Functional Sources & Materials panel", "Λειτουργικό πάνελ Πηγών & Υλικού")} /></div>
            </section>
            {renderPhaseOneDivider(0, "Resize Sources and Workspace", "Αλλαγή πλάτους Πηγών και Χώρου εργασίας")}
            <section className={`workspace-beta-panel workspace-beta-phase-workspace workspace-beta-view-${workspaceView}`} aria-labelledby="workspace-studio-title">
              <div className="workspace-beta-panel-header workspace-beta-functional-panel-header">
                <div><p className="workspace-beta-panel-kicker">02</p><h2 id="workspace-studio-title">{text("AI Studio - Workspace", "AI Studio - Χώρος εργασίας")}</h2></div>
                <div className="workspace-beta-panel-tools">
                  <button onClick={(event) => openInfoModal("/ai-assistant-comparison", event.currentTarget)} type="button">{text("Compare AI options", "Σύγκριση επιλογών AI")}</button>
                  {isSelectedMode ? <button className="workspace-beta-back-action" onClick={() => setWorkspaceView("ai-options")} type="button">{text("Back to AI options", "Πίσω στις επιλογές AI")}</button> : null}
                </div>
              </div>
              <div className="workspace-beta-agent-split" ref={agentSplitRef} style={agentSplitStyle}>
                <div className="workspace-beta-central-content">
                  {workspaceView === "ai-options" ? (
                <div className="workspace-beta-ai-options" aria-label={text("AI connection options", "Επιλογές σύνδεσης AI")}>
                  <a className="workspace-beta-ai-option" href={getStudyAppAssistantUrl()} rel="noopener noreferrer" target="_blank"><strong>StudyApp AI Assistant</strong><p>{text("Open the dedicated assistant in ChatGPT. Work there directly; StudyApp does not send your material.", "Άνοιξε τον ειδικό βοηθό StudyApp στο ChatGPT. Η εργασία γίνεται εκεί· το StudyApp δεν στέλνει υλικό.")}</p><span className="workspace-beta-availability is-available">{text("Available", "Διαθέσιμο")}</span></a>
                  <button className="workspace-beta-ai-option" onClick={() => setWorkspaceView("local")} type="button"><strong>{text("Sign in with ChatGPT", "Σύνδεση με ChatGPT")}</strong><p>{text("Windows Local: connect your ChatGPT plan for direct questions. RAG is under construction.", "Windows Local: σύνδεσε το πλάνο ChatGPT για άμεσες ερωτήσεις. Το RAG είναι υπό κατασκευή.")}</p><span className="workspace-beta-availability is-available">{localEdition ? text("Available", "Διαθέσιμο") : text("Available in Windows Local only", "Διαθέσιμο μόνο στο Windows Local")}</span></button>
                  <button className="workspace-beta-ai-option" disabled type="button"><strong>ChatGPT App / MCP</strong><p>{text("Planned option to use approved StudyApp tools inside ChatGPT. Not available yet.", "Μελλοντική χρήση εγκεκριμένων εργαλείων StudyApp μέσα στο ChatGPT. Δεν είναι διαθέσιμο ακόμη.")}</p><span>{text("Coming soon", "Σύντομα")}</span></button>
                  <button className="workspace-beta-ai-option" disabled type="button"><strong>StudyApp AI / API</strong><p>{text("Planned automatic help with selected material. It is not active and there are no charges yet.", "Μελλοντική αυτόματη βοήθεια με επιλεγμένο υλικό. Δεν είναι ενεργό και δεν γίνεται χρέωση ακόμη.")}</p><span>{text("Coming soon", "Σύντομα")}</span></button>
                </div>
              ) : workspaceView === "local" && !localEdition ? (
                <div className="workspace-beta-local-mode workspace-beta-local-only-notice">
                  <h3>{text("Available only in StudyApp Local for Windows", "Διαθέσιμο μόνο στο StudyApp Local για Windows")}</h3>
                  <p>{text("Install or open the Windows Local edition to connect your ChatGPT plan. The Web/PWA edition does not create an in-app chat.", "Εγκατάστησε ή άνοιξε την έκδοση Windows Local για να συνδέσεις το πλάνο ChatGPT. Η έκδοση Web/PWA δεν δημιουργεί συνομιλία μέσα στην εφαρμογή.")}</p>
                  <div className="workspace-beta-local-only-actions">
                    <a className="workspace-beta-back-action" href={STUDYAPP_LOCAL_PROTOCOL_URL} title={text("Open the installed Local app. It safely restarts only its verified local server.", "Άνοιξε την εγκατεστημένη Local εφαρμογή. Επανεκκινεί με ασφάλεια μόνο τον επιβεβαιωμένο τοπικό server της.")}>{text("Open StudyApp Local", "Άνοιγμα StudyApp Local")}</a>
                    <StudyAppLocalWindowsZipLink className="workspace-beta-back-action" />
                    <button className="workspace-beta-back-action" onClick={(event) => openInfoModal("/local-installation-guide", event.currentTarget)} type="button">{text("Installation Guide", "Οδηγός εγκατάστασης")}</button>
                  </div>
                </div>
              ) : workspaceView === "local" ? (
                <div className="workspace-beta-local-mode">
                  <div className="workspace-local-connection-controls">
                    <span role="status">{localChatReady ? text("ChatGPT connected", "Το ChatGPT συνδέθηκε") : chatGptPlanConnection.connected ? text("Plan approval needed", "Χρειάζεται έγκριση πλάνου") : localAwaitingApproval ? text("Finish approval in your browser", "Ολοκλήρωσε την έγκριση στον browser") : text("ChatGPT disconnected", "Το ChatGPT αποσυνδέθηκε")}</span>
                    {localSetupRequired ? <button disabled={localConnectionBusy} onClick={() => void prepareLocalConnection()} type="button">{text("Prepare connection", "Προετοιμασία σύνδεσης")}</button> : null}
                    <button disabled={localConnectionBusy} onClick={() => void changeLocalConnection()} type="button">{chatGptPlanConnection.connected ? text("Disconnect", "Αποσύνδεση") : text("Connect", "Σύνδεση")}</button>
                    {localConnectionError ? <p role="alert">{localConnectionError}</p> : null}
                  </div>
                  {!localChatReady ? <p className="workspace-beta-agent-unavailable">{text("Connect in StudyApp Local to use this conversation area.", "Συνδέσου στο StudyApp Local για να χρησιμοποιήσεις αυτή την περιοχή συνομιλίας.")}</p> : null}
                </div>
              ) : (
                <div className="workspace-beta-workspace-layout">
                  <div className="workspace-beta-workspace-upper"><div className="workspace-beta-frame-wrap"><iframe key={`workspace-${workspaceView}-${frameVersions.ai}`} className="workspace-beta-frame" name="studyapp-workspace-workspace" onLoad={(event) => wirePanelInfoLinks(event.currentTarget)} src={selectedTool?.route ?? "/#/ai-assistant-guide"} title={selectedTool ? text(`${selectedTool.english} workspace`, `${selectedTool.greek} χώρος εργασίας`) : text("StudyApp AI Assistant", "Βοηθός AI του StudyApp")} /></div></div>
                </div>
                  )}
                </div>
                <div
                  aria-disabled={!agentPanelExpanded}
                  aria-label={text("Resize Workspace and AI Agent", "Αλλαγή ύψους Χώρου εργασίας και Agent AI")}
                  aria-orientation="horizontal"
                  aria-valuenow={agentDividerValue()}
                  className={`workspace-beta-resizer workspace-beta-agent-resizer${agentDividerActive ? " is-active" : ""}${agentPanelExpanded ? "" : " is-locked"}`}
                  onDoubleClick={() => { if (agentPanelExpanded) resetAgentPanelHeights(); }}
                  onKeyDown={resizeAgentWithKeyboard}
                  onPointerCancel={finishAgentResize}
                  onPointerDown={beginAgentResize}
                  onPointerMove={continueAgentResize}
                  onPointerUp={finishAgentResize}
                  role="separator"
                  tabIndex={agentPanelExpanded ? 0 : -1}
                  title={text(
                    `Drag to resize. Use Up/Down arrow keys. Double-click to reset to ${localChatReady ? "50/50" : "90/10"}.`,
                    `Σύρε για αλλαγή ύψους. Χρησιμοποίησε τα βέλη Πάνω/Κάτω. Διπλό κλικ για επαναφορά σε ${localChatReady ? "50/50" : "90/10"}.`,
                  )}
                />
                <div className={`workspace-beta-persistent-agent${localChatReady ? " has-chat" : ""}`}>
                  <div className="workspace-beta-agent-bar">
                    <div className="workspace-beta-agent-bar-title">
                      <strong>{text("AI Agent bar — Available only in Local version", "Μπάρα AI Agent — Διαθέσιμη μόνο στην έκδοση Local")}</strong>
                      {!localEdition ? <small className="workspace-beta-agent-web-unavailable">{text("Not available in web app", "Δεν είναι διαθέσιμο στην web εφαρμογή")}</small> : null}
                    </div>
                    <span className={`workspace-beta-availability ${localChatReady ? "is-available" : "is-unavailable"}`} role="status">{agentStatus}</span>
                    <button
                      aria-expanded={agentPanelExpanded}
                      aria-label={text(agentPanelExpanded ? "Hide AI Agent panel" : "Show AI Agent panel", agentPanelExpanded ? "Απόκρυψη πάνελ Agent AI" : "Εμφάνιση πάνελ Agent AI")}
                      className="workspace-beta-column-toggle workspace-beta-agent-toggle"
                      onClick={() => setAgentPanelExpanded((expanded) => !expanded)}
                      title={text(agentPanelExpanded ? "Hide AI Agent panel" : "Show AI Agent panel", agentPanelExpanded ? "Απόκρυψη πάνελ Agent AI" : "Εμφάνιση πάνελ Agent AI")}
                      type="button"
                    >
                      <span aria-hidden="true" className="workspace-beta-agent-toggle-symbol" />
                    </button>
                  </div>
                  {localChatReady ? <WorkspaceLocalChat key={chatGptPlanConnection.connectionId ?? "existing-connection"} /> : null}
                </div>
              </div>
            </section>
            {renderPhaseOneDivider(1, "Resize Workspace and Tools", "Αλλαγή πλάτους Χώρου εργασίας και Εργαλείων")}
            <section className={`workspace-beta-panel workspace-beta-phase-tools${toolsPanelExpanded ? "" : " is-collapsed"}`} aria-labelledby="workspace-tools-title">
              <div className="workspace-beta-panel-header workspace-beta-functional-panel-header">
                <div><p className="workspace-beta-panel-kicker">03</p><h2 id="workspace-tools-title">{text("AI-Assisted Tools", "Εργαλεία με υποστήριξη AI")}</h2></div>
                <div className="workspace-beta-side-header-actions">
                  <button
                    aria-controls="workspace-beta-tools-content"
                    aria-expanded={toolsPanelExpanded}
                    aria-label={text(toolsPanelExpanded ? "Hide AI-assisted tools panel" : "Show AI-assisted tools panel", toolsPanelExpanded ? "Απόκρυψη πάνελ εργαλείων AI" : "Εμφάνιση πάνελ εργαλείων AI")}
                    className="workspace-beta-column-toggle workspace-beta-side-toggle"
                    onClick={() => setToolsPanelExpanded((expanded) => !expanded)}
                    title={text(toolsPanelExpanded ? "Hide AI-assisted tools panel" : "Show AI-assisted tools panel", toolsPanelExpanded ? "Απόκρυψη πάνελ εργαλείων AI" : "Εμφάνιση πάνελ εργαλείων AI")}
                    type="button"
                  >
                    <span aria-hidden="true" className="workspace-beta-column-symbol" />
                  </button>
                </div>
              </div>
              <div className="workspace-beta-tools-body" id="workspace-beta-tools-content">
                <div className="workspace-beta-tools-avatar"><img alt="" src="/study-assistant-avatar.svg" /><span>AI StudyApp Assistant</span></div>
                <div className="workspace-beta-tools-grid">
                  {workspaceTools.map((tool) => <button aria-label={text(tool.english, tool.greek)} className={workspaceView === tool.id ? "is-selected" : undefined} key={tool.id} onClick={() => setWorkspaceView(tool.id)} type="button"><span>{text(tool.english, tool.greek)}</span><small>{text(tool.descriptionEnglish, tool.descriptionGreek)}</small></button>)}
                </div>
              </div>
            </section>
          </div>
        </main>
        <footer className="workspace-beta-global-footer" aria-label={text("Workspace footer", "Υποσέλιδο χώρου εργασίας")}><span>© 2026 Markellos Markides. {text("All rights reserved.", "Με επιφύλαξη παντός δικαιώματος.")}</span><span>{text("Your data stays under your control.", "Τα δεδομένα σου παραμένουν υπό τον έλεγχό σου.")}</span><span className="workspace-beta-footer-version">StudyApp BETA · {__APP_BUILD_ID__}</span></footer>
        {infoModalRoute ? <div className="workspace-beta-info-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeInfoModal(); }}><section aria-labelledby="workspace-beta-info-modal-title" aria-modal="true" className="workspace-beta-info-modal" onKeyDown={trapParentModalFocus} ref={modalRef} role="dialog"><header className="workspace-beta-info-modal-header"><div><p>{infoModalKicker}</p><h2 id="workspace-beta-info-modal-title">{infoModalTitle}</h2></div><button aria-label={text("Close", "Κλείσιμο")} onClick={() => closeInfoModal()} ref={modalCloseButtonRef} type="button">{text("Close", "Κλείσιμο")}</button></header><iframe className="workspace-beta-info-modal-frame" name="studyapp-workspace-info-modal" onLoad={(event) => wireModalFrame(event.currentTarget)} ref={modalFrameRef} src={`/#${infoModalRoute}`} title={infoModalTitle} /></section></div> : null}
        {releaseArchiveOpen ? <div className="workspace-beta-info-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeActiveModal(); }}><section aria-labelledby="workspace-beta-release-archive-title" aria-modal="true" className="workspace-beta-release-archive-modal" onKeyDown={trapParentModalFocus} ref={modalRef} role="dialog"><header><h2 id="workspace-beta-release-archive-title">{text("Releases · GitHub", "Εκδόσεις · GitHub")}</h2><button aria-label={text("Close", "Κλείσιμο")} onClick={closeActiveModal} ref={modalCloseButtonRef} type="button">×</button></header><WorkspaceReleaseArchive /></section></div> : null}
      </div>
    );
  }

  return (<>{renderPhaseOne()}{false ? (
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
            <StudyAppLocalWindowsZipLink className="workspace-beta-local-download" compact />
            <LocalPortNote />
            <Link
              className="workspace-beta-installation-guide-link"
              onClick={(event) => {
                event.preventDefault();
                openInfoModal("/local-installation-guide", event.currentTarget);
              }}
              to="/local-installation-guide"
            >
              {text("Installation Guide", "Οδηγός εγκατάστασης")}
            </Link>
          </div>
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
          <Link
            onClick={(event) => {
              event.preventDefault();
              openInfoModal("/instructions", event.currentTarget);
            }}
            to="/instructions"
          >
            {text("Help / Instructions", "Βοήθεια / Οδηγίες")}
          </Link>
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
                  {text("Analytics information", "Πληροφορίες analytics")}
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
          style={{ ...gridStyle, ...(collapsedGridTemplate ? { gridTemplateColumns: collapsedGridTemplate } : {}) }}
        >
          <section
            className={"workspace-beta-panel workspace-beta-panel-sources workspace-beta-functional-panel" + (collapsedPanels.includes("sources") ? " is-collapsed" : "")}
            aria-labelledby="workspace-sources-title"
          >
            <div className="workspace-beta-panel-header workspace-beta-functional-panel-header">
              <button
                className="workspace-beta-column-toggle"
                aria-label={text(collapsedPanels.includes("sources") ? "Show sources column" : "Hide sources column", collapsedPanels.includes("sources") ? "Εμφάνιση στήλης" : "Απόκρυψη στήλης")}
                title={text(collapsedPanels.includes("sources") ? "Show column" : "Hide column", collapsedPanels.includes("sources") ? "Εμφάνιση στήλης" : "Απόκρυψη στήλης")}
                aria-expanded={!collapsedPanels.includes("sources")}
                onClick={() => togglePanelVisibility("sources")}
                type="button"
              ><span aria-hidden="true" className="workspace-beta-column-symbol" /></button>
              <div>
                <p className="workspace-beta-panel-kicker">01</p>
                <h2 id="workspace-sources-title">{text("Sources & Materials", "Πηγές & Υλικό")}</h2>
              </div>
              <div className="workspace-beta-panel-tools">
                <button type="button" onClick={() => setMaterialPanel("sources")}>{text("Manage / Delete","Διαχείριση / Διαγραφή")}</button>
                <button className="workspace-beta-back-action" onClick={() => resetPanel("sources")} type="button">
                  {text("Back to Sources & Materials home", "Πίσω στην αρχική Πηγών & Υλικού")}
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
            className={"workspace-beta-panel workspace-beta-panel-knowledge workspace-beta-functional-panel" + (collapsedPanels.includes("knowledge") ? " is-collapsed" : "")}
            aria-labelledby="workspace-knowledge-title"
          >
            <div className="workspace-beta-panel-header workspace-beta-functional-panel-header">
              <button
                className="workspace-beta-column-toggle"
                aria-label={text(collapsedPanels.includes("knowledge") ? "Show knowledge column" : "Hide knowledge column", collapsedPanels.includes("knowledge") ? "Εμφάνιση στήλης" : "Απόκρυψη στήλης")}
                title={text(collapsedPanels.includes("knowledge") ? "Show column" : "Hide column", collapsedPanels.includes("knowledge") ? "Εμφάνιση στήλης" : "Απόκρυψη στήλης")}
                aria-expanded={!collapsedPanels.includes("knowledge")}
                onClick={() => togglePanelVisibility("knowledge")}
                type="button"
              ><span aria-hidden="true" className="workspace-beta-column-symbol" /></button>
              <div>
                <p className="workspace-beta-panel-kicker">02</p>
                <h2 id="workspace-knowledge-title">{text("Core Knowledge", "Βασική Γνώση")}</h2>
              </div>
              <div className="workspace-beta-panel-tools">
                <button type="button" onClick={() => setMaterialPanel("knowledge")}>{text("Manage / Delete","Διαχείριση / Διαγραφή")}</button>
                <button className="workspace-beta-back-action" onClick={() => resetPanel("knowledge")} type="button">
                  {text("Back to Core Knowledge home", "Πίσω στην αρχική Βασικής Γνώσης")}
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
            className={"workspace-beta-panel workspace-beta-panel-practice workspace-beta-functional-panel" + (collapsedPanels.includes("practice") ? " is-collapsed" : "")}
            aria-labelledby="workspace-practice-title"
          >
            <div className="workspace-beta-panel-header workspace-beta-functional-panel-header">
              <button
                className="workspace-beta-column-toggle"
                aria-label={text(collapsedPanels.includes("practice") ? "Show practice column" : "Hide practice column", collapsedPanels.includes("practice") ? "Εμφάνιση στήλης" : "Απόκρυψη στήλης")}
                title={text(collapsedPanels.includes("practice") ? "Show column" : "Hide column", collapsedPanels.includes("practice") ? "Εμφάνιση στήλης" : "Απόκρυψη στήλης")}
                aria-expanded={!collapsedPanels.includes("practice")}
                onClick={() => togglePanelVisibility("practice")}
                type="button"
              ><span aria-hidden="true" className="workspace-beta-column-symbol" /></button>
              <div>
                <p className="workspace-beta-panel-kicker">03</p>
                <h2 id="workspace-practice-title">{text("Practice & Mastery", "Εξάσκηση & Εμπέδωση")}</h2>
              </div>
              <div className="workspace-beta-panel-tools">
                <button type="button" onClick={() => setMaterialPanel("practice")}>{text("Manage / Delete","Διαχείριση / Διαγραφή")}</button>
                <button className="workspace-beta-back-action" onClick={() => resetPanel("practice")} type="button">
                  {text("Back to Practice & Mastery home", "Πίσω στην αρχική Εξάσκησης & Εμπέδωσης")}
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
            className={"workspace-beta-panel workspace-beta-panel-studio workspace-beta-functional-panel" + (collapsedPanels.includes("ai") ? " is-collapsed" : "")}
            aria-labelledby="workspace-studio-title"
          >
            <div className="workspace-beta-panel-header workspace-beta-functional-panel-header">
              <button
                className="workspace-beta-column-toggle"
                aria-label={text(collapsedPanels.includes("ai") ? "Show AI Studio column" : "Hide AI Studio column", collapsedPanels.includes("ai") ? "Εμφάνιση στήλης" : "Απόκρυψη στήλης")}
                title={text(collapsedPanels.includes("ai") ? "Show column" : "Hide column", collapsedPanels.includes("ai") ? "Εμφάνιση στήλης" : "Απόκρυψη στήλης")}
                aria-expanded={!collapsedPanels.includes("ai")}
                onClick={() => togglePanelVisibility("ai")}
                type="button"
              ><span aria-hidden="true" className="workspace-beta-column-symbol" /></button>
              <div>
                <p className="workspace-beta-panel-kicker">04</p>
                <h2 id="workspace-studio-title">AI Studio</h2>
              </div>
              <div className="workspace-beta-panel-tools">
                <button type="button" onClick={(event) => openInfoModal("/ai-assistant-comparison", event.currentTarget)}>
                  {text("Compare AI options", "Σύγκριση επιλογών AI")}
                </button>
                <button className="workspace-beta-back-action" onClick={() => {
                  if (!localChatReady) {
                    resetPanel("ai");
                  } else if (localAiOptionsVisible) {
                    setLocalAiOptionsVisible(false);
                  } else {
                    resetPanel("ai");
                    setLocalAiOptionsVisible(true);
                  }
                }} type="button">
                  {localEdition && localChatReady && localAiOptionsVisible
                    ? text("Return to ChatGPT conversation", "Επιστροφή στη συνομιλία ChatGPT")
                    : text("Back to AI Options", "Πίσω στις επιλογές AI")}
                </button>
              </div>
            </div>
            {localEdition ? (
              <div className="workspace-local-connection-controls">
                <span role="status">{localChatReady
                  ? text("ChatGPT connected", "Το ChatGPT συνδέθηκε")
                  : chatGptPlanConnection.connected
                    ? text("Plan approval needed", "Χρειάζεται έγκριση πλάνου")
                    : localAwaitingApproval
                      ? text("Finish approval in your browser", "Ολοκλήρωσε την έγκριση στον browser")
                    : text("ChatGPT disconnected", "Το ChatGPT αποσυνδέθηκε")}</span>
                {localSetupRequired ? (
                  <button disabled={localConnectionBusy} onClick={() => void prepareLocalConnection()} type="button">
                    {text("Prepare connection", "Προετοιμασία σύνδεσης")}
                  </button>
                ) : null}
                <button disabled={localConnectionBusy} onClick={() => void changeLocalConnection()} type="button">
                  {chatGptPlanConnection.connected
                    ? text("Disconnect", "Αποσύνδεση")
                    : text("Connect", "Σύνδεση")}
                </button>
                {localConnectionError ? <p role="alert">{localConnectionError}</p> : null}
              </div>
            ) : null}
            {localChatReady ? (
              <div className="workspace-beta-local-chat-container" hidden={localAiOptionsVisible}>
                <WorkspaceLocalChat key={chatGptPlanConnection.connectionId ?? "existing-connection"} />
              </div>
            ) : null}
            {!localChatReady || localAiOptionsVisible ? (
              <div aria-label={text("StudyApp AI Assistant", "Βοηθός AI του StudyApp")} className="workspace-beta-ai-launch-row" role="img" />
            ) : null}
            {!localChatReady || localAiOptionsVisible ? <div className="workspace-beta-frame-wrap">
              <iframe
                key={`ai-${frameVersions.ai}`}
                className="workspace-beta-frame"
                name="studyapp-workspace-ai"
                onLoad={(event) => wirePanelInfoLinks(event.currentTarget)}
                src={panelRoutes.ai}
                title={text("Functional AI Studio panel", "Λειτουργικό πάνελ AI Studio")}
              />
            </div> : null}
          </section>
        </div>
      </main>
      <footer className="workspace-beta-global-footer" aria-label={text("Workspace footer", "Υποσέλιδο χώρου εργασίας")}>
        <span>© 2026 Markellos Markides. {text("All rights reserved.", "Με επιφύλαξη παντός δικαιώματος.")}</span>
        <span>{text("Your data stays under your control.", "Τα δεδομένα σου παραμένουν υπό τον έλεγχό σου.")}</span>
        <span className="workspace-beta-footer-version">StudyApp BETA · {__APP_BUILD_ID__}</span>
      </footer>

      {materialPanel !== null ? <WorkspaceMaterialManager panel={materialPanel as MaterialPanel} onClose={() => setMaterialPanel(null)} /> : null}
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
  ) : null}</>);
}
