import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { App } from "./app/App";
import "./styles/global.css";
import "./styles/onboarding.css";
import "./styles/studyMaterials.css";
import "./styles/navigationDropdown.css";
import "./styles/buildVersion.css";
import "./styles/appearanceSettings.css";

const updateServiceWorker = registerSW({
  immediate: true,
  onNeedRefresh() {
    void updateServiceWorker(true);
  },
  onRegisteredSW(_scriptUrl, registration) {
    void registration?.update();
  },
});

const root = document.getElementById("root");
if (!root) throw new Error("Application root was not found");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
