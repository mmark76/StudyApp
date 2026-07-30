import { useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "../../i18n/LanguageContext";
import { studyDatabase } from "../../infrastructure/database/studyDatabase";
import { createId } from "../../shared/utils/id";
import { useStudyContent } from "../content-import/useStudyContent";
import { buildQuiz, claimQuizAnswer } from "./quiz";

export function QuizPage() {
  const { text } = useLanguage();
  const { flashcards } = useStudyContent();
  const questions = useMemo(() => buildQuiz(flashcards), [flashcards]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [message, setMessage] = useState("");
  const startedAtRef = useRef(new Date().toISOString());
  const answerLock = useRef(false);
  const question = questions[index];

  useEffect(() => {
    answerLock.current = false;
  }, [index]);

  async function answer(option: string) {
    if (!question || finished || !claimQuizAnswer(answerLock)) return;
    const nextScore = score + (option === question.correctAnswer ? 1 : 0);
    setScore(nextScore);

    if (index >= questions.length - 1) {
      try {
        await studyDatabase.studySessions.add({
          id: createId("session"),
          mode: "quiz",
          startedAt: startedAtRef.current,
          completedAt: new Date().toISOString(),
          reviewedCards: questions.length,
          correctAnswers: nextScore,
        });
        setFinished(true);
      } catch {
        answerLock.current = false;
        setMessage(text("The result could not be saved.", "Το αποτέλεσμα δεν αποθηκεύτηκε."));
      }
    } else {
      setIndex((current) => current + 1);
    }
  }

  function restartQuiz() {
    setIndex(0);
    setScore(0);
    setFinished(false);
    setMessage("");
    startedAtRef.current = new Date().toISOString();
  }

  if (questions.length === 0) {
    return (
      <section className="empty-state">
        <h2>{text("The quiz is not available yet", "Το κουίζ δεν είναι διαθέσιμο")}</h2>
        <p>{text("Add at least four cards with different answers.", "Πρόσθεσε τουλάχιστον τέσσερις κάρτες με διαφορετικές απαντήσεις.")}</p>
      </section>
    );
  }

  if (finished) {
    return (
      <section className="empty-state">
        <h2>{text("Result", "Αποτέλεσμα")}: {score} / {questions.length}</h2>
        <button className="button primary" onClick={restartQuiz}>{text("New quiz", "Νέο κουίζ")}</button>
      </section>
    );
  }

  return (
    <article className="quiz-card">
      <p className="eyebrow">{text("Question", "Ερώτηση")} {index + 1} {text("of", "από")} {questions.length}</p>
      <h2>{question.question}</h2>
      <div className="option-grid">
        {question.options.map((option) => <button className="option-button" key={option} onClick={() => void answer(option)}>{option}</button>)}
      </div>
      {message && <p className="inline-message" role="status">{message}</p>}
    </article>
  );
}
