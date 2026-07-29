import { describe, expect, it } from "vitest";
import {
  buyTestCredits,
  createInitialMockWallet,
  creditPackages,
  getTask,
  initialMockBalance,
  parseStoredMockWallet,
  spendTestCredits,
} from "../src/features/assistant/mockAssistant";

describe("mock assistant wallet", () => {
  it("starts with the preview balance", () => {
    expect(createInitialMockWallet()).toEqual({ balance: initialMockBalance, ledger: [] });
  });

  it("adds a mock package", () => {
    const creditPackage = creditPackages[2];
    const updated = buyTestCredits(
      createInitialMockWallet(),
      creditPackage,
      "2026-07-30T00:00:00.000Z",
    );

    expect(updated.balance).toBe(initialMockBalance + creditPackage.testCredits);
    expect(updated.ledger[0]?.kind).toBe("purchase");
  });

  it("records mock AI usage", () => {
    const task = getTask("flashcards");
    const updated = spendTestCredits(
      createInitialMockWallet(),
      task,
      "2026-07-30T00:01:00.000Z",
    );

    expect(updated.balance).toBe(initialMockBalance - task.estimatedCredits);
    expect(updated.ledger[0]?.credits).toBe(-task.estimatedCredits);
  });

  it("prevents a negative balance", () => {
    expect(() => spendTestCredits({ balance: 0, ledger: [] }, getTask("quiz"))).toThrow(
      "Not enough test credits.",
    );
  });

  it("recovers from invalid stored data", () => {
    expect(parseStoredMockWallet("invalid")).toEqual(createInitialMockWallet());
  });
});
