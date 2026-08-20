import { Link } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";
import type { LocalWriteFailureInjector } from "../../infrastructure/database/localWriteFailureInjector";
import { PracticeContentManager } from "../content-import/PracticeContentManager";
import "./LearnPage.css";

interface LearnPageProps {
  failureInjector?: LocalWriteFailureInjector;
}

export function LearnPage({ failureInjector }: LearnPageProps = {}) {
  const { text } = useLanguage();
  const learnTools = [
    {
      title: text("Flashcards", "Κάρτες"),
      description: text("Practise active recall.", "Εξασκήσου στην ενεργή ανάκληση."),
      action: text("Practice with flashcards", "Εξάσκηση με κάρτες"),
      actionClass: "button practice",
      to: "/flashcards",
    },
    {
      title: text("Review", "Επανάληψη"),
      description: text("Review cards when they are due.", "Επανέλαβε τις κάρτες όταν έρθει η ώρα τους."),
      action: text("Review cards", "Επανάληψη καρτών"),
      actionClass: "button review",
      to: "/review",
    },
    {
      title: text("Quiz", "Κουίζ"),
      description: text("Test your knowledge with mixed questions.", "Δοκίμασε τις γνώσεις σου με μικτές ερωτήσεις."),
      action: text("Start quiz", "Έναρξη κουίζ"),
      actionClass: "button quiz",
      to: "/quiz",
    },
    {
      title: text("Progress", "Πρόοδος"),
      description: text("See your study activity.", "Δες τη δραστηριότητα μελέτης σου."),
      action: text("View progress", "Προβολή προόδου"),
      actionClass: "button utility",
      to: "/progress",
    },
  ];

  const learningTools = (
    <section className="learning-stage-grid learn-tools-grid" aria-label={text("Learning tools", "Εργαλεία μάθησης")}>
      {learnTools.map((tool, index) => (
        <article className="learning-stage-card" key={tool.title}>
          <span className="stage-number" aria-hidden="true">{index + 1}</span>
          <h3>{tool.title}</h3>
          <p>{tool.description}</p>
          <Link className={tool.actionClass} to={tool.to}>{tool.action}</Link>
        </article>
      ))}
    </section>
  );

  return (
    <div className="stack-lg workspace-beta-practice-page">
      <header className="page-heading">
        <p className="eyebrow">{text("Practice and memory", "Εξάσκηση και μνήμη")}</p>
        <h2>{text("Learn", "Μάθηση")}</h2>
        <p>{text("Practise with flashcards, review and quizzes.", "Εξασκήσου με κάρτες, επανάληψη και κουίζ.")}</p>
      </header>

      <PracticeContentManager
        failureInjector={failureInjector}
        learningTools={learningTools}
      />
    </div>
  );
}
