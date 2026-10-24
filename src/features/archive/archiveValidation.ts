import { parseBackup } from "../../infrastructure/backup/backup";
import type { CardProgress, StudyOperation, StudySession } from "../../shared/types/models";

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid archive record");
  return value as Record<string, unknown>;
}
function only(value: Record<string, unknown>, required: string[], optional: string[] = []): void {
  if (required.some(k => !(k in value)) || Object.keys(value).some(k => !required.includes(k) && !optional.includes(k))) {
    throw new Error("Unexpected archive fields");
  }
}
function id(x: unknown): void {
  if (typeof x !== "string" || !x.trim() || x.length > 256) throw new Error("Invalid archive identifier");
}
function date(x: unknown): void {
  if (typeof x !== "string" || !Number.isFinite(Date.parse(x))) throw new Error("Invalid archive timestamp");
}
function count(x: unknown): void {
  if (!Number.isSafeInteger(x) || (x as number) < 0 || (x as number) > 1000000) throw new Error("Invalid archive count");
}
function distinct(values: string[]): void {
  if (new Set(values).size !== values.length) throw new Error("Duplicate archive identifiers");
}
export function validateArchiveCollections(a: {
  createdAt: string;
  progress?: {cards: CardProgress[]; sessions: StudySession[]; operations: StudyOperation[]};
  settings?: {key: string; value: unknown}[];
}): void {
  if (a.settings) {
    if (a.settings.length > 1000) throw new Error("Too many archived settings");
    parseBackup({schemaVersion: 1, exportedAt: a.createdAt, cardProgress: [], studySessions: [], settings: a.settings});
  }
  if (!a.progress) return;
  const {cards, sessions, operations} = a.progress;
  if (cards.length > 100000 || sessions.length > 100000 || operations.length > 100000) throw new Error("Too many archived progress records");
  distinct(cards.map(c => { const v = record(c); only(v, ["cardId","score","repetitions","intervalDays","nextReviewAt","lastReviewedAt","lapses"]);
    id(v.cardId); if (![0,1,2].includes(v.score as number)) throw new Error("Invalid rating");
    count(v.repetitions); count(v.intervalDays); count(v.lapses); date(v.nextReviewAt); date(v.lastReviewedAt); return v.cardId as string; }));
  distinct(sessions.map(s => { const v = record(s); only(v, ["id","mode","startedAt","reviewedCards","correctAnswers"], ["completedAt"]);
    id(v.id); if (!["flashcards","quiz","review"].includes(v.mode as string)) throw new Error("Invalid study mode");
    date(v.startedAt); if (v.completedAt !== undefined) { date(v.completedAt); if (Date.parse(v.completedAt as string) < Date.parse(v.startedAt as string)) throw new Error("Invalid session dates"); }
    count(v.reviewedCards); count(v.correctAnswers);
    if ((v.correctAnswers as number) > (v.reviewedCards as number)) throw new Error("Invalid session totals");
    return v.id as string; }));
  distinct(operations.map(o => { const v = record(o); only(v, ["id","kind","mode","sessionId","committedAt","completesSession"], ["cardId","rating","reviewedCards","correctAnswers"]);
    id(v.id); id(v.sessionId); date(v.committedAt);
    if (!["card-rating","quiz-completion"].includes(v.kind as string) || !["flashcards","quiz","review"].includes(v.mode as string) || typeof v.completesSession !== "boolean") throw new Error("Invalid study operation");
    if (v.cardId !== undefined) id(v.cardId);
    if (v.rating !== undefined && ![0,1,2].includes(v.rating as number)) throw new Error("Invalid operation rating");
    if (v.reviewedCards !== undefined) count(v.reviewedCards);
    if (v.correctAnswers !== undefined) count(v.correctAnswers);
    return v.id as string; }));
}
