import { useLanguage } from "../../i18n/LanguageContext";

export const STORAGE_NOTICE_LABEL = "Local storage and data safety";

export type StorageNoticeKind = "central" | "upload" | "contentImport" | "splitter" | "backup";
export type StorageNoticeVariant = "panel" | "compact";

type StorageNoticeCopy = Record<StorageNoticeKind, { title: string; body: string }>;
type StorageNoticeSummaryCopy = Record<StorageNoticeKind, string>;

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
    body: "You create or import the chapters and flashcards used by StudyApp; the app does not generate study content automatically. Imported content is saved only in this browser and can be lost if its data is cleared. Keep the source spreadsheets or another copy elsewhere.",
  },
  splitter: {
    title: "Download split PDFs you need elsewhere",
    body: "Splitting happens only in this browser. Generated PDFs remain stored here until you remove them, but browser data can be lost. Download any split PDF you need outside StudyApp and keep the original source PDF somewhere safe.",
  },
  backup: {
    title: "This is not a complete file backup",
    body: "The backup includes progress, sessions, settings, imported chapters, flashcards and saved links. It does not include uploaded or generated file copies.",
  },
};

const compactStorageNoticeText: StorageNoticeSummaryCopy = {
  central: "Files are stored only in this browser.",
  upload: "Files are stored only in this browser.",
  contentImport: "Study content is stored only in this browser.",
  splitter: "Split PDFs are stored only in this browser.",
  backup: "The backup does not include uploaded files.",
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

const greekCompactStorageNoticeText: StorageNoticeSummaryCopy = {
  central: "Τα αρχεία αποθηκεύονται μόνο σε αυτόν τον browser.",
  upload: "Τα αρχεία αποθηκεύονται μόνο σε αυτόν τον browser.",
  contentImport: "Το υλικό μελέτης αποθηκεύεται μόνο σε αυτόν τον browser.",
  splitter: "Τα διαχωρισμένα PDF αποθηκεύονται μόνο σε αυτόν τον browser.",
  backup: "Το backup δεν περιλαμβάνει τα αρχεία που ανέβηκαν.",
};

export const storageNoticePlacements = {
  home: "central",
  materialUpload: "upload",
  contentImport: "contentImport",
  pdfSplitter: "splitter",
  progressBackup: "backup",
} as const satisfies Record<string, StorageNoticeKind>;

interface StorageNoticeProps {
  kind: StorageNoticeKind;
  variant?: StorageNoticeVariant;
}

export function StorageNotice({ kind, variant = "compact" }: StorageNoticeProps) {
  const { language, text } = useLanguage();
  const notice = language === "el" ? greekStorageNoticeText[kind] : storageNoticeText[kind];
  const compactText = language === "el"
    ? greekCompactStorageNoticeText[kind]
    : compactStorageNoticeText[kind];
  const label = text(STORAGE_NOTICE_LABEL, "Τοπική αποθήκευση και ασφάλεια δεδομένων");

  if (variant === "compact") {
    return (
      <aside className="storage-notice storage-notice--compact" aria-label={label}>
        <details>
          <summary>
            <span className="storage-notice-icon" aria-hidden="true">ⓘ</span>
            <span>{compactText}</span>
            <span className="storage-notice-learn-more">{text("Learn more", "Περισσότερα")}</span>
          </summary>
          <div className="storage-notice-details">
            <strong>{notice.title}</strong>
            <p>{notice.body}</p>
          </div>
        </details>
      </aside>
    );
  }

  return (
    <aside className="storage-notice" aria-label={label}>
      <strong>{notice.title}</strong>
      <p>{notice.body}</p>
    </aside>
  );
}
