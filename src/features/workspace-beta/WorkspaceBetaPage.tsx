import { useLanguage } from "../../i18n/LanguageContext";

export function WorkspaceBetaPage() {
  const { text } = useLanguage();

  return (
    <section className="hero-panel stack-lg" aria-labelledby="workspace-beta-title">
      <div>
        <p className="eyebrow">BETA</p>
        <h2 id="workspace-beta-title">{text("Workspace BETA", "Workspace BETA")}</h2>
        <p className="muted">
          {text(
            "A UI/UX prototype for the new multi-panel StudyApp workspace. The panels are not connected yet.",
            "Πρωτότυπο UI/UX για τον νέο πολυ-πάνελ χώρο εργασίας του StudyApp. Τα πάνελ δεν είναι ακόμη συνδεδεμένα μεταξύ τους.",
          )}
        </p>
      </div>
    </section>
  );
}
