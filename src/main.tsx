import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { App } from "./app/App";
import { enforceSecureTransport } from "./app/secureTransport";
import {
  announcePwaUpdate,
  setPwaUpdateHandler,
} from "./app/pwaUpdate";
import "./styles/global.css";
import "./styles/headerNavigation.css";
import "./styles/semanticButtons.css";
import "./styles/storageNotice.css";
import "./styles/onboarding.css";
import "./styles/studyMaterials.css";
import "./styles/buildVersion.css";
import "./styles/appearanceSettings.css";
import "./styles/assistant.css";
import "./styles/assistantServiceStatus.css";
import "./styles/assistantGuide.css";
import "./styles/assistantComparison.css";
import "./styles/assistantModes.css";
import "./styles/language.css";

if (!enforceSecureTransport()) {
  const updateServiceWorker = registerSW({
    immediate: true,
    onNeedRefresh() {
      announcePwaUpdate();
    },
    onRegisteredSW(_scriptUrl, registration) {
      void registration?.update();
    },
  });

  setPwaUpdateHandler(() => updateServiceWorker(true));

  const root = document.getElementById("root");
  if (!root) throw new Error("Application root was not found");

  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
