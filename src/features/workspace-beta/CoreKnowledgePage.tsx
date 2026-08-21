import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLanguage } from "../../i18n/LanguageContext";
import type { StudyUnit } from "../../shared/types/models";
import {
  paginateItems,
  PRACTICE_CHAPTER_PAGE_SIZE,
} from "../content-import/practiceContentProjection";
import { useStudyContent } from "../content-import/useStudyContent";
import "./CoreKnowledgePage.css";

function formatChapterNumber(number: number): string {
  return String(number).padStart(2, "0");
}

export function CoreKnowledgePage() {
  const { text } = useLanguage();
  const {
    importedUnits,
    importedFlashcards,
    hasStoredContentError,
  } = useStudyContent();
  const [requestedPage, setRequestedPage] = useState(1);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLButtonElement | null>(null);

  const flashcardCountByUnitId = useMemo(() => {
    const counts = new Map<string, number>();
    for (const card of importedFlashcards) {
      counts.set(card.unitId, (counts.get(card.unitId) ?? 0) + 1);
    }
    return counts;
  }, [importedFlashcards]);

  const paginatedUnits = paginateItems(
    importedUnits,
    PRACTICE_CHAPTER_PAGE_SIZE,
    requestedPage,
  );
  const selectedUnit = selectedUnitId
    ? importedUnits.find((unit) => unit.id === selectedUnitId) ?? null
    : null;

  function closeModal() {
    setSelectedUnitId(null);
    window.requestAnimationFrame(() => {
      if (returnFocusRef.current?.isConnected) returnFocusRef.current.focus();
      returnFocusRef.current = null;
    });
  }

  function openModal(unit: StudyUnit, button: HTMLButtonElement) {
    returnFocusRef.current = button;
    setSelectedUnitId(unit.id);
  }

  useEffect(() => {
    if (!selectedUnit) return undefined;

    const content = contentRef.current;
    if (content) content.inert = true;
    closeButtonRef.current?.focus();

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      closeModal();
    };
    const keepFocusInModal = (event: FocusEvent) => {
      const target = event.target;
      if (target instanceof Node && !modalRef.current?.contains(target)) {
        closeButtonRef.current?.focus();
      }
    };
    const keepTabInModal = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      event.preventDefault();
      closeButtonRef.current?.focus();
    };

    window.addEventListener("keydown", closeOnEscape);
    document.addEventListener("focusin", keepFocusInModal);
    modalRef.current?.addEventListener("keydown", keepTabInModal);

    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("focusin", keepFocusInModal);
      modalRef.current?.removeEventListener("keydown", keepTabInModal);
      if (content) content.inert = false;
    };
  }, [selectedUnit]);

  const chaptersHeading = text(
    `Chapters (${importedUnits.length})`,
    `Κεφάλαια (${importedUnits.length})`,
  );
  const chaptersAccessibleHeading = text(
    `Core Knowledge — ${chaptersHeading}`,
    `Βασική Γνώση — ${chaptersHeading}`,
  );

  return (
    <div className="core-knowledge-page">
      <div ref={contentRef}>
        <header className="core-knowledge-heading">
          <h2 aria-label={chaptersAccessibleHeading}>{chaptersHeading}</h2>
        </header>

        {hasStoredContentError ? (
          <p className="core-knowledge-status" role="alert">
            {text(
              "Stored chapter data could not be read on this device.",
              "Τα αποθηκευμένα δεδομένα κεφαλαίων δεν ήταν δυνατό να διαβαστούν σε αυτή τη συσκευή.",
            )}
          </p>
        ) : importedUnits.length === 0 ? (
          <p className="core-knowledge-status">
            {text("No chapters imported yet.", "Δεν έχουν εισαχθεί ακόμη κεφάλαια.")}
          </p>
        ) : (
          <section aria-label={text("Core knowledge chapters", "Κεφάλαια βασικής γνώσης")}>
            <div className="core-knowledge-chapter-grid">
              {paginatedUnits.items.map((unit) => (
                <button
                  aria-label={text(
                    `Open chapter ${unit.number} — ${unit.title}`,
                    `Άνοιγμα κεφαλαίου ${unit.number} — ${unit.title}`,
                  )}
                  className="core-knowledge-chapter-button"
                  key={unit.id}
                  onClick={(event) => openModal(unit, event.currentTarget)}
                  type="button"
                >
                  {formatChapterNumber(unit.number)}
                </button>
              ))}
            </div>

            {paginatedUnits.totalPages > 1 ? (
              <nav
                aria-label={text("Core knowledge chapter pages", "Σελίδες κεφαλαίων βασικής γνώσης")}
                className="core-knowledge-pagination"
              >
                <button
                  disabled={paginatedUnits.currentPage === 1}
                  onClick={() => setRequestedPage(paginatedUnits.currentPage - 1)}
                  type="button"
                >
                  {text("Previous", "Προηγούμενη")}
                </button>
                <span aria-current="page">
                  {text(
                    `Page ${paginatedUnits.currentPage} of ${paginatedUnits.totalPages}`,
                    `Σελίδα ${paginatedUnits.currentPage} από ${paginatedUnits.totalPages}`,
                  )}
                </span>
                <button
                  disabled={paginatedUnits.currentPage === paginatedUnits.totalPages}
                  onClick={() => setRequestedPage(paginatedUnits.currentPage + 1)}
                  type="button"
                >
                  {text("Next", "Επόμενη")}
                </button>
              </nav>
            ) : null}
          </section>
        )}
      </div>

      {selectedUnit ? (
        <div
          className="core-knowledge-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <section
            aria-labelledby="core-knowledge-modal-title"
            aria-modal="true"
            className="core-knowledge-modal"
            ref={modalRef}
            role="dialog"
          >
            <header className="core-knowledge-modal-header">
              <div>
                <p className="eyebrow">
                  {text(`Chapter ${selectedUnit.number}`, `Κεφάλαιο ${selectedUnit.number}`)}
                </p>
                <h2 id="core-knowledge-modal-title">{selectedUnit.title}</h2>
              </div>
              <button
                aria-label={text("Close", "Κλείσιμο")}
                onClick={closeModal}
                ref={closeButtonRef}
                type="button"
              >
                {text("Close", "Κλείσιμο")}
              </button>
            </header>

            <div className="core-knowledge-modal-body">
              <section>
                <h3>{text("Learning goals", "Στόχοι μάθησης")}</h3>
                {selectedUnit.objectives.length > 0 ? (
                  <ul>{selectedUnit.objectives.map((item) => <li key={item}>{item}</li>)}</ul>
                ) : <p>{text("None", "Κανένας")}</p>}
              </section>
              <section>
                <h3>{text("Key points", "Βασικά σημεία")}</h3>
                {selectedUnit.summary.length > 0 ? (
                  <ul>{selectedUnit.summary.map((item) => <li key={item}>{item}</li>)}</ul>
                ) : <p>{text("None", "Κανένα")}</p>}
              </section>
              <section>
                <h3>{text("Important terms", "Σημαντικοί όροι")}</h3>
                {selectedUnit.keyTerms.length > 0 ? (
                  <ul>{selectedUnit.keyTerms.map((item) => <li key={item}>{item}</li>)}</ul>
                ) : <p>{text("None", "Κανένας")}</p>}
              </section>
            </div>

            <p className="core-knowledge-linked-count">
              {text(
                `${flashcardCountByUnitId.get(selectedUnit.id) ?? 0} linked flashcards`,
                `${flashcardCountByUnitId.get(selectedUnit.id) ?? 0} συνδεδεμένες flashcards`,
              )}
            </p>
          </section>
        </div>
      ) : null}
    </div>
  );
}
