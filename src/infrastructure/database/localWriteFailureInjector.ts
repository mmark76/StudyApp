export type LocalWriteKind = "chapter" | "flashcard" | "appearance";

export interface LocalWriteFailureInjector {
  beforeWrite(kind: LocalWriteKind): void | Promise<void>;
}

export async function injectLocalWriteFailure(
  failureInjector: LocalWriteFailureInjector | undefined,
  kind: LocalWriteKind,
): Promise<void> {
  await failureInjector?.beforeWrite(kind);
}
