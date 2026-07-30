export const STORAGE_NOTICE_LABEL = "Local storage and data safety";

export const storageNoticeText = {
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
    body: "StudyApp is not a permanent-storage or backup service. The JSON backup includes progress, study sessions, supported settings, imported chapters and flashcards, and saved link records. It does not include uploaded or generated file copies. Those files remain only in this browser, so keep the originals and download split PDFs you need elsewhere.",
  },
} as const;

export type StorageNoticeKind = keyof typeof storageNoticeText;
export type StorageNoticeVariant = "panel" | "compact";

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

export function StorageNotice({
  kind,
  variant = "panel",
}: StorageNoticeProps) {
  const notice = storageNoticeText[kind];

  if (variant === "compact") {
    return (
      <aside
        className="storage-notice storage-notice--compact"
        aria-label={STORAGE_NOTICE_LABEL}
      >
        <details>
          <summary>
            <span className="storage-notice-icon" aria-hidden="true">ⓘ</span>
            <span>Files are stored only in this browser. Keep your originals safe.</span>
            <span className="storage-notice-learn-more">Learn more</span>
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
    <aside className="storage-notice" aria-label={STORAGE_NOTICE_LABEL}>
      <strong>{notice.title}</strong>
      <p>{notice.body}</p>
    </aside>
  );
}
