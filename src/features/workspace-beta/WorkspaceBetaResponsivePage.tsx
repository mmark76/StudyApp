import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { studyConfig } from "../../app/studyConfig";
import { useLanguage } from "../../i18n/LanguageContext";
import { LanguageSwitcher } from "../../shared/components/LanguageSwitcher";
import { PwaUpdateToast } from "../../shared/components/PwaUpdateToast";
import { WorkspaceBetaPage } from "./WorkspaceBetaPage";

type MobilePanel = "sources" | "knowledge" | "practice" | "ai";

export function WorkspaceBetaResponsivePage() {
  const { text } = useLanguage();
  const [activePanel, setActivePanel] = useState<MobilePanel>("sources");
  const menuRef = useRef<HTMLDetailsElement>(null);

  const mobilePanels: Array<{
    id: MobilePanel;
    english: string;
    greek: string;
  }> = [
    { id: "sources", english: "Sources", greek: "Πηγές" },
    { id: "knowledge", english: "Knowledge", greek: "Γνώση" },
    { id: "practice", english: "Practice", greek: "Εξάσκηση" },
    { id: "ai", english: "AI", greek: "AI" },
  ];

  function closeMenu() {
    if (menuRef.current) menuRef.current.open = false;
  }

  function activateWorkspaceControl(selector: string) {
    document.querySelector<HTMLElement>(selector)?.click();
    closeMenu();
  }

  return (
    <div
      className="workspace-beta-mobile-shell"
      data-mobile-panel={activePanel}
    >
      <header className="workspace-beta-mobile-header">
        <div className="workspace-beta-mobile-brand">
          <strong>{studyConfig.appName}</strong>
          <span className="workspace-beta-mobile-badge">BETA</span>
        </div>

        <div className="workspace-beta-mobile-header-actions">
          <LanguageSwitcher />
          <details className="workspace-beta-mobile-menu" ref={menuRef}>
            <summary aria-label={text("Open Workspace menu", "Άνοιγμα μενού χώρου εργασίας")}>
              <span aria-hidden="true">☰</span>
            </summary>
            <div className="workspace-beta-mobile-menu-popover">
              <nav aria-label={text("Workspace menu", "Μενού χώρου εργασίας")}>
                <Link onClick={closeMenu} to="/">
                  {text("Back to Standard Version", "Επιστροφή στην κανονική έκδοση")}
                </Link>
                <a
                  href="https://markellosecosystem.com/"
                  onClick={closeMenu}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {text("Back to markellosecosystem", "Πίσω στο markellosecosystem")}
                </a>
                <button
                  onClick={() => activateWorkspaceControl(
                    ".workspace-beta-functional-shell .workspace-beta-header .workspace-beta-theme-toggle",
                  )}
                  type="button"
                >
                  {text("Theme", "Θέμα")}
                </button>
                <button
                  onClick={() => activateWorkspaceControl(
                    ".workspace-beta-functional-shell .workspace-beta-header-actions > a:not(.workspace-beta-ecosystem-link)",
                  )}
                  type="button"
                >
                  {text("Settings", "Ρυθμίσεις")}
                </button>
                <button
                  onClick={() => activateWorkspaceControl(
                    ".workspace-beta-functional-shell .workspace-beta-info-popover a[href='#/important-info']",
                  )}
                  type="button"
                >
                  {text("Info", "Πληροφορίες")}
                </button>
              </nav>
            </div>
          </details>
        </div>
      </header>

      <nav
        aria-label={text("Workspace sections", "Ενότητες χώρου εργασίας")}
        className="workspace-beta-mobile-panel-tabs"
      >
        {mobilePanels.map((panel) => {
          const isActive = panel.id === activePanel;
          return (
            <button
              aria-current={isActive ? "page" : undefined}
              className={isActive ? "is-active" : undefined}
              key={panel.id}
              onClick={() => setActivePanel(panel.id)}
              type="button"
            >
              {text(panel.english, panel.greek)}
            </button>
          );
        })}
      </nav>

      <WorkspaceBetaPage />
      <PwaUpdateToast />
    </div>
  );
}
