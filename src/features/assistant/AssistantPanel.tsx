import { useEffect, useRef, useState } from "react";
import {
  assistantSources,
  assistantTasks,
  buyTestCredits,
  creditPackages,
  getTask,
  mockWalletStorageKey,
  parseStoredMockWallet,
  spendTestCredits,
  type AssistantSourceId,
  type AssistantTaskId,
  type MockWallet,
} from "./mockAssistant";

type AssistantScreen = "home" | "source" | "review" | "processing" | "result" | "wallet";

interface AssistantPanelProps {
  open: boolean;
  onClose: () => void;
}

function readWallet(): MockWallet {
  if (typeof window === "undefined") {
    return parseStoredMockWallet(null);
  }
  return parseStoredMockWallet(window.localStorage.getItem(mockWalletStorageKey));
}

function formatCredits(value: number): string {
  return new Intl.NumberFormat("en-GB").format(value);
}

export function AssistantPanel({ open, onClose }: AssistantPanelProps) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const [screen, setScreen] = useState<AssistantScreen>("home");
  const [taskId, setTaskId] = useState<AssistantTaskId | null>(null);
  const [sourceId, setSourceId] = useState<AssistantSourceId>("paste-text");
  const [manualText, setManualText] = useState("");
  const [wallet, setWallet] = useState<MockWallet>(readWallet);
  const [message, setMessage] = useState("");

  const task = taskId ? getTask(taskId) : null;
  const source = assistantSources.find((candidate) => candidate.id === sourceId);

  useEffect(() => {
    window.localStorage.setItem(mockWalletStorageKey, JSON.stringify(wallet));
  }, [wallet]);

  useEffect(() => {
    if (!open) return;
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.body.classList.add("assistant-panel-open");
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.classList.remove("assistant-panel-open");
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  useEffect(() => {
    if (screen !== "processing" || !task) return;

    const timeout = window.setTimeout(() => {
      setWallet((currentWallet) => spendTestCredits(currentWallet, task));
      setScreen("result");
      setMessage(`${task.estimatedCredits} test credits used. No real AI request was made.`);
    }, 900);

    return () => window.clearTimeout(timeout);
  }, [screen, task]);

  if (!open) return null;

  function selectTask(nextTaskId: AssistantTaskId) {
    setTaskId(nextTaskId);
    setSourceId("paste-text");
    setManualText("");
    setMessage("");
    setScreen("source");
  }

  function startMockTask() {
    if (!task) return;
    if (wallet.balance < task.estimatedCredits) {
      setMessage("Not enough test credits. Add a mock credit package to continue.");
      setScreen("wallet");
      return;
    }
    setMessage("");
    setScreen("processing");
  }

  function purchase(euroAmount: number) {
    const creditPackage = creditPackages.find((candidate) => candidate.euroAmount === euroAmount);
    if (!creditPackage) return;
    setWallet((currentWallet) => buyTestCredits(currentWallet, creditPackage));
    setMessage(
      `Mock purchase completed: €${creditPackage.euroAmount} added ${formatCredits(creditPackage.testCredits)} test credits.`,
    );
  }

  async function copyResult() {
    if (!task) return;
    try {
      await navigator.clipboard.writeText(`${task.resultTitle}\n\n${task.resultBody}`);
      setMessage("Mock result copied.");
    } catch {
      setMessage("The browser could not copy the mock result.");
    }
  }

  return (
    <div className="assistant-overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside
        aria-labelledby="assistant-title"
        aria-modal="true"
        className="assistant-panel"
        role="dialog"
      >
        <header className="assistant-header">
          <div className="assistant-identity">
            <img alt="Study Assistant" className="assistant-avatar-small" src="/study-assistant-avatar.svg" />
            <div>
              <p className="assistant-kicker">StudyApp</p>
              <h2 id="assistant-title">AI Assistant</h2>
            </div>
          </div>
          <button
            aria-label="Close AI Assistant"
            className="assistant-close"
            onClick={onClose}
            ref={closeButtonRef}
            type="button"
          >
            ×
          </button>
        </header>

        <div className="assistant-toolbar">
          <span className="assistant-test-badge">TEST MODE · NO REAL CHARGE</span>
          <button className="assistant-balance" onClick={() => setScreen("wallet")} type="button">
            {formatCredits(wallet.balance)} test credits
          </button>
        </div>

        <div className="assistant-content">
          {screen === "home" && (
            <section className="assistant-welcome">
              <img alt="Study Assistant waving" className="assistant-avatar-hero" src="/study-assistant-avatar.svg" />
              <p className="eyebrow">Free reception</p>
              <h3>Hello! I’m your Study Assistant.</h3>
              <p>Choose what you want to preview. This version uses mock AI and mock payments only.</p>
              <div className="assistant-task-grid">
                {assistantTasks.map((candidate) => (
                  <button
                    className="assistant-task-card"
                    key={candidate.id}
                    onClick={() => selectTask(candidate.id)}
                    type="button"
                  >
                    <strong>{candidate.label}</strong>
                    <span>{candidate.description}</span>
                    <small>Up to {candidate.estimatedCredits} test credits</small>
                  </button>
                ))}
              </div>
              <button className="button secondary" onClick={() => setScreen("wallet")} type="button">
                Credits & mock payments
              </button>
            </section>
          )}

          {screen === "source" && task && (
            <section>
              <button className="assistant-back" onClick={() => setScreen("home")} type="button">← Back</button>
              <p className="eyebrow">Choose material</p>
              <h3>{task.label}</h3>
              <p>Only material you explicitly choose will be eligible for a future AI request.</p>
              <fieldset className="assistant-source-list">
                <legend>Use</legend>
                {assistantSources.map((candidate) => (
                  <label className="assistant-source-option" key={candidate.id}>
                    <input
                      checked={sourceId === candidate.id}
                      name="assistant-source"
                      onChange={() => setSourceId(candidate.id)}
                      type="radio"
                    />
                    <span>
                      <strong>{candidate.label}</strong>
                      <small>{candidate.description}</small>
                    </span>
                  </label>
                ))}
              </fieldset>
              {sourceId === "paste-text" && (
                <label className="field-label assistant-paste-field">
                  Text for the UI preview
                  <textarea
                    maxLength={6_000}
                    onChange={(event) => setManualText(event.target.value)}
                    placeholder="Paste a short passage, or leave empty to use placeholder text in this mock preview."
                    rows={6}
                    value={manualText}
                  />
                  <span className="field-help">Nothing entered here is sent to the server in mock mode.</span>
                </label>
              )}
              <div className="assistant-actions">
                <button className="button secondary" onClick={() => setScreen("home")} type="button">Cancel</button>
                <button className="button primary" onClick={() => setScreen("review")} type="button">Review request</button>
              </div>
            </section>
          )}

          {screen === "review" && task && source && (
            <section>
              <button className="assistant-back" onClick={() => setScreen("source")} type="button">← Back</button>
              <p className="eyebrow">Confirm mock request</p>
              <h3>Review before continuing</h3>
              <dl className="assistant-review-list">
                <div><dt>Task</dt><dd>{task.label}</dd></div>
                <div><dt>Material</dt><dd>{source.label}</dd></div>
                <div><dt>AI mode</dt><dd>Mock</dd></div>
                <div><dt>Estimated cost</dt><dd>Up to {task.estimatedCredits} test credits</dd></div>
                <div><dt>Current balance</dt><dd>{formatCredits(wallet.balance)} test credits</dd></div>
              </dl>
              <div className="assistant-privacy-note">
                <strong>Mock preview:</strong> no real AI call, payment or study-content upload will occur.
              </div>
              <div className="assistant-actions">
                <button className="button secondary" onClick={() => setScreen("source")} type="button">Edit</button>
                <button className="button primary" onClick={startMockTask} type="button">Run mock task</button>
              </div>
            </section>
          )}

          {screen === "processing" && task && (
            <section className="assistant-processing" aria-live="polite">
              <img alt="" className="assistant-avatar-processing" src="/study-assistant-avatar.svg" />
              <div className="assistant-spinner" aria-hidden="true" />
              <p className="eyebrow">Mock processing</p>
              <h3>{task.label}</h3>
              <p>Preparing a sample result without contacting a real AI provider.</p>
              <button className="button secondary" onClick={() => setScreen("review")} type="button">Cancel</button>
            </section>
          )}

          {screen === "result" && task && (
            <section>
              <p className="eyebrow">Mock result</p>
              <h3>{task.resultTitle}</h3>
              <article className="assistant-result-card">
                <p>{task.resultBody}</p>
                {manualText.trim() && (
                  <blockquote>{manualText.trim().slice(0, 240)}{manualText.trim().length > 240 ? "…" : ""}</blockquote>
                )}
              </article>
              <div className="assistant-result-actions">
                <button className="button primary" onClick={() => setMessage(`${task.saveLabel} selected. No local data was changed in this UI preview.`)} type="button">
                  {task.saveLabel}
                </button>
                <button className="button secondary" onClick={() => void copyResult()} type="button">Copy</button>
                <button className="button secondary" onClick={() => setScreen("source")} type="button">Try again</button>
                <button className="button secondary" onClick={() => { setTaskId(null); setScreen("home"); }} type="button">New task</button>
              </div>
            </section>
          )}

          {screen === "wallet" && (
            <section>
              <button className="assistant-back" onClick={() => setScreen(task ? "review" : "home")} type="button">← Back</button>
              <p className="eyebrow">Credits & payments</p>
              <h3>{formatCredits(wallet.balance)} test credits</h3>
              <div className="assistant-privacy-note">
                <strong>TEST MODE — NO REAL CHARGE.</strong> No card, subscription or automatic renewal is used.
              </div>
              <p className="assistant-wallet-explainer">
                Packages below simulate the final purchase flow. Test credits include the agreed 15% safety reserve; mock provider fee is €0.
              </p>
              <div className="assistant-package-grid">
                {creditPackages.map((creditPackage) => (
                  <button
                    className="assistant-package-card"
                    key={creditPackage.euroAmount}
                    onClick={() => purchase(creditPackage.euroAmount)}
                    type="button"
                  >
                    <strong>€{creditPackage.euroAmount}</strong>
                    <span>{formatCredits(creditPackage.testCredits)} test credits</span>
                    <small>Simulate purchase</small>
                  </button>
                ))}
              </div>
              <h4>Recent test activity</h4>
              {wallet.ledger.length === 0 ? (
                <p>No mock purchases or AI usage yet.</p>
              ) : (
                <ul className="assistant-ledger">
                  {wallet.ledger.slice(0, 8).map((entry) => (
                    <li key={entry.id}>
                      <span>{entry.description}</span>
                      <strong className={entry.credits >= 0 ? "credit-positive" : "credit-negative"}>
                        {entry.credits >= 0 ? "+" : ""}{formatCredits(entry.credits)}
                      </strong>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {message && <p className="assistant-status" role="status" aria-live="polite">{message}</p>}
        </div>
      </aside>
    </div>
  );
}
