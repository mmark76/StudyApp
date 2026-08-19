import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { studyConfig } from "../../app/studyConfig";
import { useLanguage } from "../../i18n/LanguageContext";
import { LanguageSwitcher } from "../../shared/components/LanguageSwitcher";
import { useAppearanceSettings } from "../appearance/useAppearanceSettings";

const sourceItems = [
  { id: "cognitive", en: "Cognitive Psychology", el: "Γνωστική Ψυχολογία", metaEn: "PDF · 12 chapters", metaEl: "PDF · 12 κεφάλαια" },
  { id: "memory", en: "Memory notes", el: "Σημειώσεις μνήμης", metaEn: "Notes · 8 sections", metaEl: "Σημειώσεις · 8 ενότητες" },
  { id: "research", en: "Research paper", el: "Ερευνητική εργασία", metaEn: "PDF · 24 pages", metaEl: "PDF · 24 σελίδες" },
] as const;

const practiceModes = [
  { id: "flashcards", en: "Flashcards", el: "Κάρτες", detailEn: "Active recall", detailEl: "Ενεργή ανάκληση" },
  { id: "review", en: "Review", el: "Επανάληψη", detailEn: "Due cards", detailEl: "Κάρτες για επανάληψη" },
  { id: "quiz", en: "Quiz", el: "Κουίζ", detailEn: "Mixed questions", detailEl: "Μικτές ερωτήσεις" },
  { id: "progress", en: "Progress", el: "Πρόοδος", detailEn: "Study activity", detailEl: "Δραστηριότητα μελέτης" },
] as const;

const studioTools = [
  { id: "summary", en: "Summary", el: "Περίληψη" },
  { id: "study-guide", en: "Study Guide", el: "Οδηγός μελέτης" },
  { id: "flashcards", en: "Flashcards", el: "Κάρτες" },
  { id: "quiz", en: "Quiz", el: "Κουίζ" },
  { id: "mind-map", en: "Mind Map", el: "Νοητικός χάρτης" },
] as const;

type PracticeModeId = (typeof practiceModes)[number]["id"];
type StudioToolId = (typeof studioTools)[number]["id"];

export function WorkspaceBetaPage() {
  useAppearanceSettings();
  const { text } = useLanguage();
  const [sourceQuery, setSourceQuery] = useState("");
  const [selectedSourceId, setSelectedSourceId] = useState<string>(sourceItems[0].id);
  const [practiceMode, setPracticeMode] = useState<PracticeModeId>("flashcards");
  const [studioTool, setStudioTool] = useState<StudioToolId>("summary");
  const [sourceNotice, setSourceNotice] = useState("");

  const filteredSources = useMemo(() => {
    const query = sourceQuery.trim().toLocaleLowerCase();
    if (!query) return sourceItems;
    return sourceItems.filter((item) =>
      `${item.en} ${item.el}`.toLocaleLowerCase().includes(query),
    );
  }, [sourceQuery]);

  const activePractice = practiceModes.find((item) => item.id === practiceMode) ?? practiceModes[0];
  const activeStudioTool = studioTools.find((item) => item.id === studioTool) ?? studioTools[0];

  return (
    <div className="workspace-beta-shell">
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
        <div className="workspace-beta-grid" aria-label={text("Workspace panels", "Πάνελ χώρου εργασίας")}>
          <section className="workspace-beta-panel workspace-beta-panel-sources" aria-labelledby="workspace-sources-title">
            <div className="workspace-beta-panel-header">
              <div>
                <p className="workspace-beta-panel-kicker">01</p>
                <h2 id="workspace-sources-title">{text("Sources", "Πηγές")}</h2>
              </div>
              <span className="workspace-beta-preview-label">{text("Preview", "Προεπισκόπηση")}</span>
            </div>

            <div className="workspace-beta-panel-body">
              <button
                className="workspace-beta-primary-action"
                onClick={() => setSourceNotice(text("UI preview only — no source was added.", "Μόνο προεπισκόπηση UI — δεν προστέθηκε πηγή."))}
                type="button"
              >
                + {text("Add source", "Προσθήκη πηγής")}
              </button>

              <label className="workspace-beta-search-label" htmlFor="workspace-source-search">
                {text("Find source", "Εύρεση πηγής")}
              </label>
              <input
                className="workspace-beta-search"
                id="workspace-source-search"
                onChange={(event) => setSourceQuery(event.target.value)}
                placeholder={text("Search preview sources", "Αναζήτηση στις δοκιμαστικές πηγές")}
                type="search"
                value={sourceQuery}
              />

              {sourceNotice ? <p className="workspace-beta-inline-note" role="status">{sourceNotice}</p> : null}

              <div className="workspace-beta-source-list" aria-label={text("Preview sources", "Δοκιμαστικές πηγές")}>
                {filteredSources.map((source) => {
                  const isSelected = selectedSourceId === source.id;
                  return (
                    <button
                      aria-pressed={isSelected}
                      className={`workspace-beta-source-item${isSelected ? " is-selected" : ""}`}
                      key={source.id}
                      onClick={() => setSelectedSourceId(source.id)}
                      type="button"
                    >
                      <span>{text(source.en, source.el)}</span>
                      <small>{text(source.metaEn, source.metaEl)}</small>
                    </button>
                  );
                })}
                {filteredSources.length === 0 ? (
                  <p className="workspace-beta-empty-copy">{text("No preview sources match.", "Δεν βρέθηκαν δοκιμαστικές πηγές.")}</p>
                ) : null}
              </div>
            </div>
          </section>

          <section className="workspace-beta-panel workspace-beta-panel-practice" aria-labelledby="workspace-practice-title">
            <div className="workspace-beta-panel-header">
              <div>
                <p className="workspace-beta-panel-kicker">02</p>
                <h2 id="workspace-practice-title">{text("Practice", "Εξάσκηση")}</h2>
              </div>
              <span className="workspace-beta-preview-label">{text("Preview", "Προεπισκόπηση")}</span>
            </div>

            <div className="workspace-beta-panel-body workspace-beta-practice-body">
              <div className="workspace-beta-mode-switcher" role="group" aria-label={text("Practice mode", "Τρόπος εξάσκησης")}>
                {practiceModes.map((mode) => (
                  <button
                    aria-pressed={practiceMode === mode.id}
                    className={practiceMode === mode.id ? "is-selected" : undefined}
                    key={mode.id}
                    onClick={() => setPracticeMode(mode.id)}
                    type="button"
                  >
                    {text(mode.en, mode.el)}
                  </button>
                ))}
              </div>

              <div className="workspace-beta-work-area">
                <p className="workspace-beta-work-label">{text(activePractice.detailEn, activePractice.detailEl)}</p>
                <h3>{text(activePractice.en, activePractice.el)}</h3>
                <p>
                  {text(
                    "This central panel is the main study surface. It is intentionally using preview content only and is not connected to Sources or saved StudyApp data yet.",
                    "Αυτό το κεντρικό πάνελ είναι η κύρια επιφάνεια μελέτης. Χρησιμοποιεί σκόπιμα μόνο δοκιμαστικό περιεχόμενο και δεν είναι ακόμη συνδεδεμένο με τις Πηγές ή τα αποθηκευμένα δεδομένα του StudyApp.",
                  )}
                </p>
                <div className="workspace-beta-demo-card" aria-hidden="true">
                  <span className="workspace-beta-demo-card-label">{text("Preview card", "Δοκιμαστική κάρτα")}</span>
                  <strong>{text("What is working memory?", "Τι είναι η μνήμη εργασίας;")}</strong>
                  <span>{text("Reveal answer", "Εμφάνιση απάντησης")}</span>
                </div>
              </div>
            </div>
          </section>

          <section className="workspace-beta-panel workspace-beta-panel-studio" aria-labelledby="workspace-studio-title">
            <div className="workspace-beta-panel-header">
              <div>
                <p className="workspace-beta-panel-kicker">03</p>
                <h2 id="workspace-studio-title">AI Studio</h2>
              </div>
              <span className="workspace-beta-preview-label">{text("Preview", "Προεπισκόπηση")}</span>
            </div>

            <div className="workspace-beta-panel-body">
              <p className="workspace-beta-panel-intro">
                {text("Choose what you want to create.", "Επίλεξε τι θέλεις να δημιουργήσεις.")}
              </p>
              <div className="workspace-beta-studio-grid">
                {studioTools.map((tool) => (
                  <button
                    aria-pressed={studioTool === tool.id}
                    className={`workspace-beta-studio-tool${studioTool === tool.id ? " is-selected" : ""}`}
                    key={tool.id}
                    onClick={() => setStudioTool(tool.id)}
                    type="button"
                  >
                    {text(tool.en, tool.el)}
                  </button>
                ))}
              </div>

              <div className="workspace-beta-studio-preview" role="status">
                <span>{text("Selected", "Επιλεγμένο")}</span>
                <strong>{text(activeStudioTool.en, activeStudioTool.el)}</strong>
                <p>{text("Generation is not connected in this UI preview.", "Η δημιουργία περιεχομένου δεν είναι συνδεδεμένη σε αυτή την προεπισκόπηση UI.")}</p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
