import { useEffect, useMemo, useRef, useState } from "react";
import { studyDatabase } from "../../infrastructure/database/studyDatabase";
import { createId } from "../../shared/utils/id";
import { useStudyContent } from "../content-import/useStudyContent";
import { buildQuiz, claimQuizAnswer } from "./quiz";

export function QuizPage() {
  const { flashcards } = useStudyContent();
  const questions = useMemo(() => buildQuiz(flashcards), [flashcards]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
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
      setFinished(true);
      await studyDatabase.studySessions.add({
        id: createId("session"), mode: "quiz", startedAt: new Date().toISOString(), completedAt: new Date().toISOString(),
        reviewedCards: questions.length, correctAnswers: nextScore
      });
    } else {
      setIndex(index + 1);
    }
  }

  if (questions.length === 0) return <section className="empty-state"><h2>The quiz is not available yet</h2><p>Import at least four cards with different answers.</p></section>;
  if (finished) return <section className="empty-state"><h2>Result: {score} / {questions.length}</h2><button className="button primary" onClick={() => window.location.reload()}>New quiz</button></section>;

  return (
    <article className="quiz-card">
      <p className="eyebrow">Question {index + 1} of {questions.length}</p>
      <h2>{question.question}</h2>
      <div className="option-grid">{question.options.map((option) => <button className="option-button" key={option} onClick={() => void answer(option)}>{option}</button>)}</div>
    </article>
  );
}
