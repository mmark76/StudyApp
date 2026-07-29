export type AssistantTaskId =
  | "ask"
  | "flashcards"
  | "quiz"
  | "summarize"
  | "explain";

export type AssistantSourceId =
  | "selected-text"
  | "current-document"
  | "current-chapter"
  | "paste-text";

export interface AssistantTask {
  id: AssistantTaskId;
  label: string;
  description: string;
  estimatedCredits: number;
  resultTitle: string;
  resultBody: string;
  saveLabel: string;
}

export interface AssistantSource {
  id: AssistantSourceId;
  label: string;
  description: string;
}

export interface CreditPackage {
  euroAmount: number;
  testCredits: number;
}

export interface MockLedgerEntry {
  id: string;
  kind: "purchase" | "usage";
  description: string;
  credits: number;
  createdAt: string;
}

export interface MockWallet {
  balance: number;
  ledger: MockLedgerEntry[];
}

export const initialMockBalance = 1_850;
export const mockWalletStorageKey = "studyapp.mock-assistant-wallet.v1";

export const assistantTasks: readonly AssistantTask[] = [
  {
    id: "ask",
    label: "Ask a question",
    description: "Ask about a selected passage or text you provide.",
    estimatedCredits: 15,
    resultTitle: "Answer",
    resultBody:
      "This is a mock answer showing the final response layout. No study content was sent to a server and no real AI request was made.",
    saveLabel: "Save as note",
  },
  {
    id: "flashcards",
    label: "Create flashcards",
    description: "Preview a set of focused question-and-answer cards.",
    estimatedCredits: 24,
    resultTitle: "10 flashcards prepared",
    resultBody:
      "The final version will show editable flashcard previews here before anything is saved into StudyApp.",
    saveLabel: "Save as flashcards",
  },
  {
    id: "quiz",
    label: "Create a quiz",
    description: "Preview questions, answer options and explanations.",
    estimatedCredits: 28,
    resultTitle: "Quiz prepared",
    resultBody:
      "The final version will let you review every question and answer before saving the quiz locally.",
    saveLabel: "Save as quiz",
  },
  {
    id: "summarize",
    label: "Summarize",
    description: "Create a concise study summary from chosen material.",
    estimatedCredits: 20,
    resultTitle: "Summary prepared",
    resultBody:
      "This mock summary demonstrates the reading layout, cost confirmation and local-save actions.",
    saveLabel: "Save as summary",
  },
  {
    id: "explain",
    label: "Explain a concept",
    description: "Request a clearer explanation with examples.",
    estimatedCredits: 18,
    resultTitle: "Concept explained",
    resultBody:
      "The final assistant will present a structured explanation and will clearly identify the material used.",
    saveLabel: "Save as note",
  },
] as const;

export const assistantSources: readonly AssistantSource[] = [
  {
    id: "selected-text",
    label: "Selected text",
    description: "Use text that you deliberately select in the current reading view.",
  },
  {
    id: "current-document",
    label: "Current document",
    description: "Use the open document only after explicit confirmation.",
  },
  {
    id: "current-chapter",
    label: "Current chapter",
    description: "Use the current structured-study chapter.",
  },
  {
    id: "paste-text",
    label: "Paste text manually",
    description: "Paste only the text you want the assistant to use.",
  },
] as const;

const packageAmounts = [2, 3, 5, 7, 10, 15, 20] as const;

export const creditPackages: readonly CreditPackage[] = packageAmounts.map((euroAmount) => ({
  euroAmount,
  testCredits: euroAmount * 850,
}));

export function getTask(taskId: AssistantTaskId): AssistantTask {
  const task = assistantTasks.find((candidate) => candidate.id === taskId);
  if (!task) {
    throw new Error(`Unknown assistant task: ${taskId}`);
  }
  return task;
}

export function createInitialMockWallet(): MockWallet {
  return { balance: initialMockBalance, ledger: [] };
}

export function buyTestCredits(
  wallet: MockWallet,
  creditPackage: CreditPackage,
  createdAt = new Date().toISOString(),
): MockWallet {
  return {
    balance: wallet.balance + creditPackage.testCredits,
    ledger: [
      {
        id: `purchase-${createdAt}-${creditPackage.euroAmount}`,
        kind: "purchase",
        description: `Mock €${creditPackage.euroAmount} credit package`,
        credits: creditPackage.testCredits,
        createdAt,
      },
      ...wallet.ledger,
    ],
  };
}

export function spendTestCredits(
  wallet: MockWallet,
  task: AssistantTask,
  createdAt = new Date().toISOString(),
): MockWallet {
  if (wallet.balance < task.estimatedCredits) {
    throw new Error("Not enough test credits.");
  }

  return {
    balance: wallet.balance - task.estimatedCredits,
    ledger: [
      {
        id: `usage-${createdAt}-${task.id}`,
        kind: "usage",
        description: `Mock AI: ${task.label}`,
        credits: -task.estimatedCredits,
        createdAt,
      },
      ...wallet.ledger,
    ],
  };
}

export function parseStoredMockWallet(value: string | null): MockWallet {
  if (!value) {
    return createInitialMockWallet();
  }

  try {
    const candidate: unknown = JSON.parse(value);
    if (
      typeof candidate !== "object" ||
      candidate === null ||
      !("balance" in candidate) ||
      !("ledger" in candidate) ||
      typeof candidate.balance !== "number" ||
      !Number.isSafeInteger(candidate.balance) ||
      candidate.balance < 0 ||
      !Array.isArray(candidate.ledger)
    ) {
      return createInitialMockWallet();
    }

    const ledger = candidate.ledger.filter((entry): entry is MockLedgerEntry => {
      if (typeof entry !== "object" || entry === null) return false;
      return (
        "id" in entry && typeof entry.id === "string" &&
        "kind" in entry && (entry.kind === "purchase" || entry.kind === "usage") &&
        "description" in entry && typeof entry.description === "string" &&
        "credits" in entry && typeof entry.credits === "number" && Number.isSafeInteger(entry.credits) &&
        "createdAt" in entry && typeof entry.createdAt === "string"
      );
    });

    return { balance: candidate.balance, ledger: ledger.slice(0, 20) };
  } catch {
    return createInitialMockWallet();
  }
}
