import { createHashRouter } from "react-router-dom";
import { AppearanceSettingsPage } from "../features/appearance/AppearanceSettingsPage";
import { ContentImportPage } from "../features/content-import/ContentImportPage";
import { FlashcardsPage } from "../features/flashcards/FlashcardsPage";
import { HomePage } from "../features/home/HomePage";
import { LearnPage } from "../features/learn/LearnPage";
import { LegalPage } from "../features/legal/LegalPage";
import { legalPages } from "../features/legal/legalPages";
import { LibraryPage } from "../features/library/LibraryPage";
import { ProgressPage } from "../features/progress/ProgressPage";
import { QuizPage } from "../features/quiz/QuizPage";
import { ReviewPage } from "../features/review/ReviewPage";
import { StudyLearnPage } from "../features/study/StudyLearnPage";
import { StudyTheoryPage } from "../features/study/StudyTheoryPage";
import { StudyMaterialsPage } from "../features/study-materials/StudyMaterialsPage";
import { ToolsPage } from "../features/tools/ToolsPage";
import { UnitsPage } from "../features/units/UnitsPage";
import { AppLayout } from "../shared/components/AppLayout";

export const router = createHashRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "appearance", element: <AppearanceSettingsPage /> },
      { path: "study", element: <StudyLearnPage /> },
      { path: "study/theory", element: <StudyTheoryPage /> },
      { path: "learn", element: <LearnPage /> },
      { path: "library", element: <LibraryPage /> },
      { path: "units", element: <UnitsPage /> },
      { path: "flashcards", element: <FlashcardsPage /> },
      { path: "review", element: <ReviewPage /> },
      { path: "quiz", element: <QuizPage /> },
      { path: "progress", element: <ProgressPage /> },
      { path: "import", element: <ContentImportPage /> },
      { path: "study-materials", element: <StudyMaterialsPage /> },
      { path: "tools", element: <ToolsPage /> },
      { path: "legal/license", element: <LegalPage content={legalPages.license} /> },
      { path: "legal/privacy", element: <LegalPage content={legalPages.privacy} /> },
      { path: "legal/analytics", element: <LegalPage content={legalPages.analytics} /> },
      { path: "legal/copyright", element: <LegalPage content={legalPages.copyright} /> }
    ]
  }
]);
