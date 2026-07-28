import type { Flashcard } from "../../shared/types/models";

const FLASHCARD_IDENTITY_VERSION = "flashcard-content-v1";

export function normalizeFlashcardIdentityText(value: string): string {
  return value.normalize("NFC").trim().replace(/\s+/gu, " ");
}

export function buildFlashcardIdentity(
  unitId: string,
  question: string,
  answer: string,
): string {
  return JSON.stringify([
    FLASHCARD_IDENTITY_VERSION,
    unitId,
    normalizeFlashcardIdentityText(question),
    normalizeFlashcardIdentityText(answer),
  ]);
}

export async function createFlashcardContentId(
  unitId: string,
  question: string,
  answer: string,
  cryptoProvider: Crypto | null | undefined = globalThis.crypto,
): Promise<string> {
  const subtle = cryptoProvider?.subtle;
  if (!subtle) {
    throw new Error(
      "Stable flashcard IDs are not available in this browser. Use an up-to-date browser and try again.",
    );
  }

  const identity = buildFlashcardIdentity(unitId, question, answer);
  const digest = await subtle.digest("SHA-256", new TextEncoder().encode(identity));
  const hash = Array.from(
    new Uint8Array(digest),
    (byte) => byte.toString(16).padStart(2, "0"),
  ).join("");
  return `${FLASHCARD_IDENTITY_VERSION}-${hash}`;
}

export function mergeImportedFlashcards(
  existingCards: readonly Flashcard[],
  incomingCards: readonly Flashcard[],
): Flashcard[] {
  const byId = new Map<string, Flashcard>(
    existingCards.map((card) => [card.id, card] as const),
  );

  for (const incomingCard of incomingCards) {
    const existingCard = byId.get(incomingCard.id);
    if (
      existingCard
      && buildFlashcardIdentity(
        existingCard.unitId,
        existingCard.question,
        existingCard.answer,
      ) !== buildFlashcardIdentity(
        incomingCard.unitId,
        incomingCard.question,
        incomingCard.answer,
      )
    ) {
      throw new Error(
        `Flashcard ID conflict for "${incomingCard.question}". Existing progress was not changed.`,
      );
    }
    byId.set(incomingCard.id, incomingCard);
  }

  return [...byId.values()];
}
