import { Link } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";
import "./LearnPage.css";

export function LearnPage() {
  const { text } = useLanguage();
  const learnTools = [
    {
      title: text("Flashcards", "Κάρτες"),
      description: text("Practise active recall.", "Εξασκήσου στην ενεργή ανάκληση."),
      action: text("Open flashcards", "Άνοιγμα καρτών"),
      to: "/flashcards",
    },
    {
      title: text("Review", "Επανάληψη"),
      description: text("Review cards when they are due.", "Επανέλαβε τις κάρτες όταν έρθει η ώρα τους."),
      action: text("Review cards", "Επανάληψη καρτών"),
      to: "/review",
    },
    {
      title: text("Quiz", "Κουίζ"),
      description: text("Test your knowledge with mixed questions.", "Δοκίμασε τις γνώσεις σου με μικτές ερωτήσεις."),
      action: text("Start quiz", "Έναρξη κουίζ"),
      to: "/quiz",
    },
    {
      title: text("Progress", "Πρόοδος"),
      description: text("See your study activity.", "Δες τη δραστηριότητα μελέτης σου."),
      action: text("View progress", "Προβολή προόδου"),
      to: "/progress",
    },
    {
      title: text("Manage Content", "Διαχείριση περιεχομένου"),
      description: text(
        "Add, import, or remove your flashcards and chapters.",
        "Πρόσθεσε, εισήγαγε ή διέγραψε κάρτες και κεφάλαια.",
      ),
      options: [
        text("Add Flashcard", "Προσθήκη κάρτας"),
        text("Import Flashcards CSV", "Εισαγωγή καρτών CSV"),
        text("Import Chapters CSV", "Εισαγωγή κεφαλαίων CSV"),
        text(
          "Manage/Delete imported content",
          "Διαχείριση/διαγραφή εισαγόμενου περιεχομένου",
        ),
      ],
      action: text("Manage content", "Διαχείριση περιεχομένου"),
      to: "/import",
    },
  ];

  return (
    <div className="stack-lg">
      <header className="page-heading">
        <p className="eyebrow">{text("Practice and memory", "Εξάσκηση και μνήμη")}</p>
        <h2>{text("Learn", "Μάθηση")}</h2>
        <p>{text("Practise with flashcards, review and quizzes.", "Εξασκήσου με κάρτες, επανάληψη και κουίζ.")}</p>
      </header>

      <section className="learning-stage-grid learn-tools-grid" aria-label={text("Learning tools", "Εργαλεία μάθησης")}>
        {learnTools.map((tool, index) => (
          <article className="learning-stage-card" key={tool.title}>
            <span className="stage-number" aria-hidden="true">{index + 1}</span>
            <h3>{tool.title}</h3>
            <p>{tool.description}</p>
            {tool.options ? (
              <ul className="learning-stage-steps">
                {tool.options.map((option) => <li key={option}>{option}</li>)}
              </ul>
            ) : null}
            <Link className="button secondary" to={tool.to}>{tool.action}</Link>
          </article>
        ))}
      </section>
    </div>
  );
}
