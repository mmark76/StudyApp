import type {
  StudyOperationFailureInjector,
  StudyOperationWriteStage,
} from "../features/learn/studyOperationService";
import type { StudyMode, StudyOperation } from "../shared/types/models";

function createFailOnceInjector(
  mode: StudyMode,
  failureStage: StudyOperationWriteStage,
): StudyOperationFailureInjector {
  let failureInjected = false;

  return {
    beforeWrite(stage: StudyOperationWriteStage, operation: StudyOperation) {
      if (
        !failureInjected &&
        operation.completesSession &&
        operation.mode === mode &&
        stage === failureStage
      ) {
        failureInjected = true;
        throw new Error(`E2E ${mode} ${stage} failure`);
      }
    },
  };
}

export function createE2EStudyFailureInjectors() {
  return {
    flashcards: createFailOnceInjector("flashcards", "session"),
    quiz: createFailOnceInjector("quiz", "operation"),
    review: createFailOnceInjector("review", "session"),
  } as const;
}
