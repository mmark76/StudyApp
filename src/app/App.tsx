import { RouterProvider } from "react-router-dom";
import { AnalyticsConsentBanner } from "../features/analytics/AnalyticsConsentBanner";
import { LanguageProvider } from "../i18n/LanguageContext";
import { router } from "./router";

export function App() {
  return (
    <LanguageProvider>
      <RouterProvider router={router} />
      <AnalyticsConsentBanner />
    </LanguageProvider>
  );
}
