import { Link } from "react-router-dom";
import { creditPackages } from "./mockAssistant";

function formatCredits(value: number): string {
  return new Intl.NumberFormat("en-GB").format(value);
}

const assistantUses = [
  "Ask a question about text you choose.",
  "Create flashcards for review.",
  "Create a quiz with questions and explanations.",
  "Summarize selected study material.",
  "Explain a difficult idea in clearer language.",
] as const;

const usageSteps = [
  {
    title: "Choose what you need",
    description: "Open the AI Assistant and select a task, such as a question, summary, quiz or flashcards.",
  },
  {
    title: "Choose the study material",
    description: "Select the text, document or chapter you want the assistant to use. Nothing is chosen automatically.",
  },
  {
    title: "Review the estimated cost",
    description: "Before continuing, StudyApp shows the maximum estimated credits and your current balance.",
  },
  {
    title: "Confirm the task",
    description: "The task starts only after you approve it. You can cancel before confirming.",
  },
  {
    title: "Review and save the result",
    description: "Check the answer, make any changes you need, and decide whether to save it in StudyApp.",
  },
] as const;

const commonQuestions = [
  {
    question: "Does opening the AI Assistant cost credits?",
    answer: "No. Opening the assistant, viewing the welcome screen and checking your balance are free.",
  },
  {
    question: "Can StudyApp charge me automatically?",
    answer: "No. Credit packages are one-time purchases. There is no subscription and no automatic renewal.",
  },
  {
    question: "Can the assistant read all my files?",
    answer: "No. It uses only the material you deliberately select and confirm for that task.",
  },
  {
    question: "What happens when the AI service is offline?",
    answer: "The assistant can still open, but AI tasks wait until the service is available again. Your local study material remains available.",
  },
  {
    question: "Are AI answers always correct?",
    answer: "No. AI can make mistakes. Review important answers, facts and calculations before using or saving them.",
  },
] as const;

export function AssistantGuidePage() {
  return (
    <div className="assistant-guide-page stack-lg">
      <header className="assistant-guide-hero">
        <div>
          <p className="eyebrow">Simple guide</p>
          <h2>How to use the AI Assistant</h2>
          <p>
            Learn what the assistant can do, what you approve before each task and how credits work.
          </p>
          <div className="button-row">
            <Link className="button secondary" to="/">Back to Home</Link>
          </div>
        </div>
        <img alt="Study Assistant waving" src="/study-assistant-avatar.svg" />
      </header>

      <section className="assistant-guide-note" aria-labelledby="assistant-guide-test-mode">
        <p className="eyebrow">Current version</p>
        <h3 id="assistant-guide-test-mode">TEST MODE — no real charge</h3>
        <p>
          The current assistant uses test credits and sample results. No real payment or real AI charge is made yet.
          The charging explanation below shows how the final version will work.
        </p>
      </section>

      <section className="content-panel" aria-labelledby="assistant-guide-uses">
        <p className="eyebrow">What it can help with</p>
        <h3 id="assistant-guide-uses">Study help you choose</h3>
        <ul className="assistant-guide-check-list">
          {assistantUses.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </section>

      <section className="content-panel" aria-labelledby="assistant-guide-steps">
        <p className="eyebrow">Step by step</p>
        <h3 id="assistant-guide-steps">A normal AI task</h3>
        <ol className="assistant-guide-steps">
          {usageSteps.map((step, index) => (
            <li key={step.title}>
              <span aria-hidden="true">{index + 1}</span>
              <div>
                <strong>{step.title}</strong>
                <p>{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="assistant-guide-grid" aria-label="AI Assistant availability and privacy">
        <article className="assistant-guide-card">
          <p className="eyebrow">Availability</p>
          <h3>What the coloured light means</h3>
          <dl className="assistant-guide-status-list">
            <div><dt><span className="assistant-guide-light online" />Online</dt><dd>AI tasks are available.</dd></div>
            <div><dt><span className="assistant-guide-light checking" />Checking</dt><dd>StudyApp is checking the service.</dd></div>
            <div><dt><span className="assistant-guide-light offline" />Offline</dt><dd>AI tasks are temporarily unavailable.</dd></div>
          </dl>
        </article>

        <article className="assistant-guide-card">
          <p className="eyebrow">Your choice</p>
          <h3>Your study material stays under your control</h3>
          <p>
            The assistant does not automatically use your library, files or notes. You choose the material for each task,
            review the request, and decide whether to save the result.
          </p>
        </article>
      </section>

      <section className="content-panel" aria-labelledby="assistant-guide-credits">
        <p className="eyebrow">Credits and charges</p>
        <h3 id="assistant-guide-credits">How payment will work</h3>
        <div className="assistant-guide-charge-grid">
          <article>
            <strong>One-time credit packages</strong>
            <p>You add credits only when you choose. There is no subscription or automatic renewal.</p>
          </article>
          <article>
            <strong>Cost shown before starting</strong>
            <p>StudyApp shows the estimated maximum credits before you confirm the task.</p>
          </article>
          <article>
            <strong>Only actual use is charged</strong>
            <p>Unused reserved credits are returned automatically after the task finishes.</p>
          </article>
          <article>
            <strong>No charge for a failed task</strong>
            <p>If the AI task fails, the reserved credits are returned to your balance.</p>
          </article>
          <article>
            <strong>Your balance cannot go below zero</strong>
            <p>A task will not start when there are not enough credits.</p>
          </article>
          <article>
            <strong>Clear activity history</strong>
            <p>Purchases, AI use, temporary holds and returned credits will appear in your activity history.</p>
          </article>
        </div>

        <div className="assistant-guide-credit-explainer">
          <h4>What one credit means</h4>
          <p>
            One credit represents €0.001 of AI use. For every €1 purchased, 850 usable credits are added.
            The remaining 15% is kept as a safety margin for service costs and price changes.
          </p>
        </div>

        <h4>Planned credit packages</h4>
        <div className="assistant-guide-packages" aria-label="Planned credit packages">
          {creditPackages.map((creditPackage) => (
            <div key={creditPackage.euroAmount}>
              <strong>€{creditPackage.euroAmount}</strong>
              <span>{formatCredits(creditPackage.testCredits)} credits</span>
            </div>
          ))}
        </div>

        <div className="assistant-guide-example">
          <h4>Simple example</h4>
          <p>
            A task is estimated at up to 24 credits. You review and approve it. If the final use is 18 credits,
            only 18 credits are charged and the other 6 are returned to your balance.
          </p>
        </div>
      </section>

      <section className="content-panel" aria-labelledby="assistant-guide-faq">
        <p className="eyebrow">Common questions</p>
        <h3 id="assistant-guide-faq">Useful answers before you begin</h3>
        <div className="assistant-guide-faq">
          {commonQuestions.map((item) => (
            <details key={item.question}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
