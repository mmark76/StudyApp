import { createHashRouter, Navigate } from "react-router-dom";
import { AppearanceSettingsPage } from "../features/appearance/AppearanceSettingsPage";
import { AssistantComparisonPage } from "../features/assistant/AssistantComparisonPage";
import { AssistantGuidePage } from "../features/assistant/AssistantGuidePage";
import { ContentImportPage } from "../features/content-import/ContentImportPage";
import { FlashcardsPage } from "../features/flashcards/FlashcardsPage";
import { HomePage } from "../features/home/HomePage";
import { StudyAppInstructionsPage } from "../features/instructions/StudyAppInstructionsPage";
import { LearnPage } from "../features/learn/LearnPage";
import { LegalPage } from "../features/legal/LegalPage";
import { legalPages } from "../features/legal/legalPages";
import { LibraryPage } from "../features/library/LibraryPage";
import { ProgressPage } from "../features/progress/ProgressPage";
import { QuizPage } from "../features/quiz/QuizPage";
import { ReviewPage } from "../features/review/ReviewPage";
import { SourcesPage } from "../features/sources/SourcesPage";
import { StudyLearnPage } from "../features/study/StudyLearnPage";
import { StudyTheoryPage } from "../features/study/StudyTheoryPage";
import { UnitsPage } from "../features/units/UnitsPage";
import { AppLayout } from "../shared/components/AppLayout";
import { createE2EStudyFailureInjectors } from "./e2eStudyFailureInjection";
import { createE2ELocalWriteFailureInjector } from "./e2eLocalWriteFailureInjection";

const e2eFailureInjectors =
  import.meta.env.MODE === "e2e" ? createE2EStudyFailureInjectors() : null;
const e2eLocalWriteFailureInjector =
  import.meta.env.MODE === "e2e"
    ? createE2ELocalWriteFailureInjector()
    : undefined;

export const router = createHashRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      {
        path: "appearance",
        element: (
          <AppearanceSettingsPage
            failureInjector={e2eLocalWriteFailureInjector}
          />
        ),
      },
      { path: "ai-assistant-guide", element: <AssistantGuidePage /> },
      { path: "ai-assistant-comparison", element: <AssistantComparisonPage /> },
      {
        path: "important-info",
        lazy: async () => {
          const { ImportantInfoPage } = await import("../features/important-info/ImportantInfoPage");
          return { Component: ImportantInfoPage };
        },
      },
      { path: "instructions", element: <StudyAppInstructionsPage /> },
      { path: "sources", element: <SourcesPage /> },
      { path: "study", element: <StudyLearnPage /> },
      { path: "study/theory", element: <StudyTheoryPage /> },
      {
        path: "learn",
        element: <LearnPage failureInjector={e2eLocalWriteFailureInjector} />,
      },
      { path: "library", element: <LibraryPage /> },
      { path: "units", element: <UnitsPage /> },
      {
        path: "flashcards",
        element: (
          <FlashcardsPage
            failureInjector={e2eFailureInjectors?.flashcards}
          />
        ),
      },
      {
        path: "review",
        element: (
          <ReviewPage failureInjector={e2eFailureInjectors?.review} />
        ),
      },
      {
        path: "quiz",
        element: <QuizPage failureInjector={e2eFailureInjectors?.quiz} />,
      },
      { path: "progress", element: <ProgressPage /> },
      { path: "import", element: <ContentImportPage /> },
      { path: "study-materials", element: <Navigate replace to="/library" /> },
      {
        path: "tools",
        lazy: async () => {
          const { ToolsPage } = await import("../features/tools/ToolsPage");
          return { Component: ToolsPage };
        },
      },
      { path: "legal/license", element: <LegalPage content={legalPages.license} /> },
      { path: "legal/privacy", element: <LegalPage content={legalPages.privacy} /> },
      { path: "legal/analytics", element: <LegalPage content={legalPages.analytics} /> },
      { path: "legal/copyright", element: <LegalPage content={legalPages.copyright} /> }
    ]
  }
]);
