import { useLanguage } from "../../i18n/LanguageContext";
import type { LegalPageContent, LocalizedLegalText } from "./legalPages";

function readCopy(value: LocalizedLegalText, language: "en" | "el"): string {
  return value[language];
}

export function LegalPage({ content }: { content: LegalPageContent }) {
  const { language, text } = useLanguage();

  return (
    <article className="legal-page stack-lg">
      <header className="page-heading">
        <p className="eyebrow">{text("Legal information", "Νομικές πληροφορίες")}</p>
        <h2>{readCopy(content.title, language)}</h2>
        <p>{readCopy(content.summary, language)}</p>
        <p className="muted">{text("Last updated", "Τελευταία ενημέρωση")}: {readCopy(content.lastUpdated, language)}</p>
      </header>
      {content.sections.map((section) => (
        <section className="content-panel" key={section.heading.en}>
          <h3>{readCopy(section.heading, language)}</h3>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph.en}>{readCopy(paragraph, language)}</p>
          ))}
        </section>
      ))}
    </article>
  );
}
