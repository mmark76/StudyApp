import { RouterProvider } from "react-router-dom";
import { AnalyticsRuntime } from "../features/analytics/AnalyticsRuntime";
import { LanguageProvider } from "../i18n/LanguageContext";
import { router } from "./router";

export function App() {
  return (
    <LanguageProvider>
      <AnalyticsRuntime />
      <RouterProvider router={router} />
    </LanguageProvider>
  );
}
