import type {
  LocalStudyFileKind,
  SourceMaterialType,
  StructuredStudyType,
  StudyMode,
} from "../shared/types/models";
import type { AppLanguage } from "./LanguageContext";

function pick(language: AppLanguage, english: string, greek: string): string {
  return language === "el" ? greek : english;
}

export function getSourceMaterialTypeLabel(type: SourceMaterialType, language: AppLanguage): string {
  const labels: Record<SourceMaterialType, [string, string]> = {
    book: ["Book", "Βιβλίο"],
    article: ["Article", "Άρθρο"],
    paper: ["Paper", "Εργασία"],
    "outsource-note": ["External note", "Εξωτερική σημείωση"],
    "my-note": ["My note", "Δική μου σημείωση"],
    summary: ["Summary", "Περίληψη"],
  };
  return pick(language, ...labels[type]);
}

export function getStructuredStudyTypeLabel(type: StructuredStudyType, language: AppLanguage): string {
  const labels: Record<StructuredStudyType, [string, string]> = {
    contents: ["Contents", "Περιεχόμενα"],
    chapter: ["Chapter", "Κεφάλαιο"],
    section: ["Section / Paragraph", "Ενότητα / Παράγραφος"],
    "key-concept": ["Key Concept", "Βασική έννοια"],
    "bibliography-reference": ["Bibliography / Reference", "Βιβλιογραφία / Αναφορά"],
    "image-diagram": ["Image / Diagram", "Εικόνα / Διάγραμμα"],
  };
  return pick(language, ...labels[type]);
}

export function getFileKindLabel(kind: LocalStudyFileKind | undefined, language: AppLanguage): string {
  const labels: Partial<Record<LocalStudyFileKind, [string, string]>> = {
    pdf: ["PDF", "PDF"],
    document: ["Document", "Έγγραφο"],
    text: ["Text", "Κείμενο"],
    image: ["Image", "Εικόνα"],
    spreadsheet: ["Spreadsheet", "Υπολογιστικό φύλλο"],
    other: ["File", "Αρχείο"],
  };
  const label = kind ? labels[kind] : undefined;
  return label ? pick(language, ...label) : pick(language, "File", "Αρχείο");
}

export function getStudyModeLabel(mode: StudyMode, language: AppLanguage): string {
  const labels: Record<StudyMode, [string, string]> = {
    flashcards: ["Flashcards", "Κάρτες"],
    quiz: ["Quiz", "Κουίζ"],
    review: ["Review", "Επανάληψη"],
  };
  return pick(language, ...labels[mode]);
}
