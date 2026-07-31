import { useLanguage } from "../../i18n/LanguageContext";

export const STORAGE_NOTICE_LABEL = "Local storage and data safety";

export type StorageNoticeKind = "central" | "upload" | "contentImport" | "splitter" | "backup";
export type StorageNoticeVariant = "panel" | "compact";

type StorageNoticeCopy = Record<StorageNoticeKind, { title: string; body: string }>;
type StorageNoticeSummaryCopy = Record<StorageNoticeKind, string>;

export const storageNoticeText: StorageNoticeCopy = {
  central: {
    title: "Keep your originals outside StudyApp",
    body: "StudyApp stores data locally in this browser and device. Data can be lost if site data is cleared or the browser or device fails. StudyApp is not a permanent-storage service or a complete backup service. Keep original files and required copies outside StudyApp. The JSON backup does not include uploaded or generated file copies, and available storage depends on the browser and device.",
  },
  upload: {
    title: "Files are added to this browser",
    body: "Adding a local file imports a private copy into this browser and device; it is not sent to a server. Local data can be lost if site data is cleared or the browser or device fails, and available storage depends on them. StudyApp is not a permanent-storage service or a complete backup service. The JSON backup does not include uploaded or generated file copies. Keep the original and required copies outside StudyApp.",
  },
  contentImport: {
    title: "Your study content stays in this browser",
    body: "Chapters and flashcards you create or import are stored locally in this browser and device. They can be lost if site data is cleared or the browser or device fails. StudyApp does not generate content automatically and is not permanent storage or a complete backup. The JSON backup includes imported chapters and flashcards, but not uploaded or generated file copies. Available storage depends on the browser and device. Keep source spreadsheets or another required copy outside StudyApp.",
  },
  splitter: {
    title: "Download split PDFs you need elsewhere",
    body: "Splitting happens locally in this browser and device. Generated PDFs remain here until you remove them, but can be lost if site data is cleared or the browser or device fails. StudyApp is not permanent storage or a complete backup service, and the JSON backup does not include generated PDFs. Available storage depends on the browser and device. Download split PDFs you need and keep the original PDF outside StudyApp.",
  },
  backup: {
    title: "This is not a complete file backup",
    body: "The JSON backup includes progress, sessions, settings, imported chapters, flashcards and saved links. It does not include uploaded or generated file copies. Local data in this browser and device can be lost if site data is cleared or the browser or device fails. StudyApp is not permanent storage or a complete backup service, and available storage depends on the browser and device. Keep original files and required copies outside StudyApp.",
  },
};

const compactStorageNoticeText: StorageNoticeSummaryCopy = {
  central: "Data is stored locally in this browser and device.",
  upload: "Files are stored locally in this browser and device.",
  contentImport: "Study content is stored locally in this browser and device.",
  splitter: "Split PDFs are stored locally in this browser and device.",
  backup: "The JSON backup excludes uploaded and generated files.",
};

export const greekStorageNoticeText: StorageNoticeCopy = {
  central: {
    title: "Κράτησε τα πρωτότυπα αρχεία εκτός StudyApp",
    body: "Το StudyApp αποθηκεύει δεδομένα τοπικά σε αυτόν τον browser και τη συσκευή. Τα δεδομένα μπορεί να χαθούν αν διαγραφούν τα δεδομένα ιστοτόπου ή αν παρουσιαστεί βλάβη στον browser ή στη συσκευή. Το StudyApp δεν είναι υπηρεσία μόνιμης αποθήκευσης ούτε πλήρης υπηρεσία backup. Κράτησε τα πρωτότυπα αρχεία και τα απαραίτητα αντίγραφα εκτός StudyApp. Το JSON backup δεν περιλαμβάνει αρχεία που προστέθηκαν ή δημιουργήθηκαν και ο διαθέσιμος χώρος εξαρτάται από τον browser και τη συσκευή.",
  },
  upload: {
    title: "Τα αρχεία προστίθενται σε αυτόν τον browser",
    body: "Η προσθήκη τοπικού αρχείου εισάγει ένα ιδιωτικό αντίγραφο σε αυτόν τον browser και τη συσκευή· δεν αποστέλλεται σε server. Τα τοπικά δεδομένα μπορεί να χαθούν αν διαγραφούν τα δεδομένα ιστοτόπου ή αν παρουσιαστεί βλάβη στον browser ή στη συσκευή, ενώ ο διαθέσιμος χώρος εξαρτάται από αυτά. Το StudyApp δεν είναι υπηρεσία μόνιμης αποθήκευσης ούτε πλήρης υπηρεσία backup. Το JSON backup δεν περιλαμβάνει αρχεία που προστέθηκαν ή δημιουργήθηκαν. Κράτησε το πρωτότυπο και τα απαραίτητα αντίγραφα εκτός StudyApp.",
  },
  contentImport: {
    title: "Το υλικό μελέτης παραμένει σε αυτόν τον browser",
    body: "Τα κεφάλαια και οι κάρτες που δημιουργείς ή εισάγεις αποθηκεύονται τοπικά σε αυτόν τον browser και τη συσκευή. Μπορεί να χαθούν αν διαγραφούν τα δεδομένα ιστοτόπου ή αν παρουσιαστεί βλάβη στον browser ή στη συσκευή. Το StudyApp δεν δημιουργεί αυτόματα υλικό και δεν είναι υπηρεσία μόνιμης αποθήκευσης ή πλήρες backup. Το JSON backup περιλαμβάνει τα εισαγόμενα κεφάλαια και τις κάρτες, αλλά όχι αρχεία που προστέθηκαν ή δημιουργήθηκαν. Ο διαθέσιμος χώρος εξαρτάται από τον browser και τη συσκευή. Κράτησε τα αρχικά υπολογιστικά φύλλα ή άλλο απαραίτητο αντίγραφο εκτός StudyApp.",
  },
  splitter: {
    title: "Κατέβασε τα διαχωρισμένα PDF που χρειάζεσαι",
    body: "Ο διαχωρισμός γίνεται τοπικά σε αυτόν τον browser και τη συσκευή. Τα PDF που δημιουργούνται παραμένουν εδώ μέχρι να τα διαγράψεις, αλλά μπορεί να χαθούν αν διαγραφούν τα δεδομένα ιστοτόπου ή αν παρουσιαστεί βλάβη στον browser ή στη συσκευή. Το StudyApp δεν είναι υπηρεσία μόνιμης αποθήκευσης ούτε πλήρης υπηρεσία backup, και το JSON backup δεν περιλαμβάνει τα PDF που δημιουργούνται. Ο διαθέσιμος χώρος εξαρτάται από τον browser και τη συσκευή. Κατέβασε τα διαχωρισμένα PDF που χρειάζεσαι και κράτησε το πρωτότυπο PDF εκτός StudyApp.",
  },
  backup: {
    title: "Δεν είναι πλήρες backup αρχείων",
    body: "Το JSON backup περιλαμβάνει πρόοδο, συνεδρίες, ρυθμίσεις, εισαγόμενα κεφάλαια, κάρτες και αποθηκευμένους συνδέσμους. Δεν περιλαμβάνει αρχεία που προστέθηκαν ή δημιουργήθηκαν. Τα τοπικά δεδομένα αυτού του browser και της συσκευής μπορεί να χαθούν αν διαγραφούν τα δεδομένα ιστοτόπου ή αν παρουσιαστεί βλάβη στον browser ή στη συσκευή. Το StudyApp δεν είναι υπηρεσία μόνιμης αποθήκευσης ούτε πλήρης υπηρεσία backup και ο διαθέσιμος χώρος εξαρτάται από τον browser και τη συσκευή. Κράτησε τα πρωτότυπα αρχεία και τα απαραίτητα αντίγραφα εκτός StudyApp.",
  },
};

const greekCompactStorageNoticeText: StorageNoticeSummaryCopy = {
  central: "Τα δεδομένα αποθηκεύονται τοπικά σε αυτόν τον browser και τη συσκευή.",
  upload: "Τα αρχεία αποθηκεύονται τοπικά σε αυτόν τον browser και τη συσκευή.",
  contentImport: "Το υλικό μελέτης αποθηκεύεται τοπικά σε αυτόν τον browser και τη συσκευή.",
  splitter: "Τα διαχωρισμένα PDF αποθηκεύονται τοπικά σε αυτόν τον browser και τη συσκευή.",
  backup: "Το JSON backup δεν περιλαμβάνει αρχεία που προστέθηκαν ή δημιουργήθηκαν.",
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
