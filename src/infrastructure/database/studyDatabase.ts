import Dexie, { type EntityTable } from "dexie";
import type {
  AppSetting,
  CardProgress,
  LocalStudyFile,
  StudyOperation,
  StudySession,
} from "../../shared/types/models";

export class StudyDatabase extends Dexie {
  cardProgress!: EntityTable<CardProgress, "cardId">;
  studyOperations!: EntityTable<StudyOperation, "id">;
  studySessions!: EntityTable<StudySession, "id">;
  settings!: EntityTable<AppSetting, "key">;
  studyFiles!: EntityTable<LocalStudyFile, "id">;

  constructor(databaseName = "generic-study-app") {
    super(databaseName);
    this.version(1).stores({
      cardProgress: "&cardId,nextReviewAt,score",
      studySessions: "&id,mode,startedAt,completedAt",
      settings: "&key"
    });
    this.version(2).stores({
      cardProgress: "&cardId,nextReviewAt,score",
      studySessions: "&id,mode,startedAt,completedAt",
      settings: "&key",
      studyFiles: "&id,createdAt,title"
    });
    this.version(3).stores({
      cardProgress: "&cardId,nextReviewAt,score",
      studyOperations: "&id,sessionId,mode,cardId,committedAt",
      studySessions: "&id,mode,startedAt,completedAt",
      settings: "&key",
      studyFiles: "&id,createdAt,title"
    });
  }
}

export const studyDatabase = new StudyDatabase();
