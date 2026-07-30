import { useLanguage } from "../../i18n/LanguageContext";

export const STORAGE_NOTICE_LABEL = "Local storage and data safety";

export type StorageNoticeKind = "central" | "upload" | "contentImport" | "splitter" | "backup";

type StorageNoticeCopy = Record<StorageNoticeKind, { title: string; body: string }>;

export const storageNoticeText: StorageNoticeCopy = {
  central: {
    title: "Keep your originals outside StudyApp",
    body: "StudyApp is a local tool for using and studying content, not a permanent-storage or backup service. Files stay only in this browser and can be lost if its data is cleared or becomes unavailable. Always keep your original files and any needed copies somewhere safe.",
  },
  upload: {
    title: "Files are added to this browser",
    body: "Adding a local file imports a private copy into this browser; it is not sent to a server. Browser data can be lost, and progress/settings backups do not include file copies. Keep the original file somewhere safe.",
  },
  contentImport: {
    title: "Your study content stays in this browser",
    body: "You create or import the chapters and flashcards used by StudyApp. Imported content is saved only in this browser. Keep the source spreadsheets or another copy elsewhere.",
  },
  splitter: {
    title: "Download split PDFs you need elsewhere",
    body: "Splitting happens only in this browser. Generated PDFs remain stored here until you remove them, but browser data can be lost. Download any split PDF you need outside StudyApp.",
  },
  backup: {
    title: "This is not a complete file backup",
    body: "The backup includes progress, sessions, settings, imported chapters, flashcards and saved links. It does not include uploaded or generated files.",
  },
};

const greekStorageNoticeText: StorageNoticeCopy = {
  central: {
    title: "Κράτησε τα πρωτότυπα αρχεία εκτός StudyApp",
    body: "Το StudyApp αποθηκεύει τα αρχεία μόνο σε αυτόν τον browser. Μπορεί να χαθούν αν διαγραφούν τα δεδομένα του. Κράτησε τα πρωτότυπα αρχεία σου σε ασφαλές σημείο.",
  },
  upload: {
    title: "Τα αρχεία προστίθενται σε αυτόν τον browser",
    body: "Το τοπικό αρχείο δεν αποστέλλεται σε server. Το αντίγραφο παραμένει σε αυτή τη συσκευή και δεν περιλαμβάνεται στο backup προόδου.",
  },
  contentImport: {
    title: "Το υλικό μελέτης παραμένει σε αυτόν τον browser",
    body: "Τα κεφάλαια και οι κάρτες που δημιουργείς ή εισάγεις αποθηκεύονται τοπικά. Κράτησε και ένα ξεχωριστό αντίγραφο των αρχείων εισαγωγής.",
  },
  splitter: {
    title: "Κατέβασε τα διαχωρισμένα PDF που χρειάζεσαι",
    body: "Ο διαχωρισμός γίνεται μόνο στον browser. Κατέβασε όσα PDF θέλεις να διατηρήσεις εκτός StudyApp.",
  },
  backup: {
    title: "Δεν είναι πλήρες backup αρχείων",
    body: "Το backup περιλαμβάνει πρόοδο, συνεδρίες, ρυθμίσεις, κεφάλαια, κάρτες και συνδέσμους. Δεν περιλαμβάνει αρχεία που ανέβηκαν ή δημιουργήθηκαν.",
  },
};

export const storageNoticePlacements = {
  home: "central",
  materialUpload: "upload",
  contentImport: "contentImport",
  pdfSplitter: "splitter",
  progressBackup: "backup",
} as const satisfies Record<string, StorageNoticeKind>;

export function StorageNotice({ kind }: { kind: StorageNoticeKind }) {
  const { language, text } = useLanguage();
  const notice = language === "el" ? greekStorageNoticeText[kind] : storageNoticeText[kind];

  return (
    <aside className="storage-notice" aria-label={text(STORAGE_NOTICE_LABEL, "Τοπική αποθήκευση και ασφάλεια δεδομένων")}>
      <strong>{notice.title}</strong>
      <p>{notice.body}</p>
    </aside>
  );
}
