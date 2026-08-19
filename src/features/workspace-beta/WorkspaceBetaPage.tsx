import { useState } from "react";
import { Link } from "react-router-dom";
import { studyConfig } from "../../app/studyConfig";
import { useLanguage } from "../../i18n/LanguageContext";
import { LanguageSwitcher } from "../../shared/components/LanguageSwitcher";
import { getStudyAppAssistantUrl } from "../assistant/assistantDestination";
import { useAppearanceSettings } from "../appearance/useAppearanceSettings";

type WorkspacePanelId = "sources" | "practice" | "ai";

const panelRoutes: Record<WorkspacePanelId, string> = {
  sources: "/#/sources",
  practice: "/#/learn",
  ai: "/#/ai-assistant-guide",
};

export function WorkspaceBetaPage() {
  useAppearanceSettings();
  const { text } = useLanguage();
  const [frameVersions, setFrameVersions] = useState<Record<WorkspacePanelId, number>>({
    sources: 0,
    practice: 0,
    ai: 0,
  });
  const assistantUrl = getStudyAppAssistantUrl();

  function resetPanel(panel: WorkspacePanelId) {
    setFrameVersions((current) => ({
      ...current,
      [panel]: current[panel] + 1,
    }));
  }

  return (
    <div className="workspace-beta-shell workspace-beta-functional-shell">
      <a className="skip-link workspace-beta-skip" href="#workspace-beta-main">
        {text("Skip to workspace", "Μετάβαση στον χώρο εργασίας")}
      </a>

      <header className="workspace-beta-header">
        <div className="workspace-beta-brand">
          <strong>{studyConfig.appName}</strong>
          <span className="workspace-beta-badge">BETA</span>
          <span className="workspace-beta-title">{text("Workspace", "Χώρος εργασίας")}</span>
        </div>
        <div className="workspace-beta-header-actions">
          <LanguageSwitcher />
          <Link to="/appearance">{text("Settings", "Ρυθμίσεις")}</Link>
          <Link className="workspace-beta-exit" to="/">{text("Exit", "Έξοδος")}</Link>
        </div>
      </header>

      <main className="workspace-beta-main" id="workspace-beta-main">
        <div
          className="workspace-beta-grid workspace-beta-functional-grid"
          aria-label={text("Workspace panels", "Πάνελ χώρου εργασίας")}
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
