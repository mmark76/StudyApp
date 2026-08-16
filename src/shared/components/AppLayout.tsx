import { useEffect, useRef, useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigationType,
} from "react-router-dom";
import { studyConfig } from "../../app/studyConfig";
import { useAppearanceSettings } from "../../features/appearance/useAppearanceSettings";
import { AssistantPanel } from "../../features/assistant/AssistantPanel";
import { useLanguage } from "../../i18n/LanguageContext";
import { useInternetConnectivity } from "../hooks/useInternetConnectivity";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { PwaUpdateToast } from "./PwaUpdateToast";

const mainNavigation = [
  { to: "/", en: "Home", el: "Αρχική", matches: ["/"] },
  { to: "/library", en: "Library", el: "Βιβλιοθήκη", matches: ["/library"] },
  {
    to: "/study/theory",
    en: "Structured Study",
    el: "Δομημένη Μελέτη",
    matches: ["/study", "/study/theory", "/units"],
  },
  {
    to: "/learn",
    en: "Learn & Practice",
    el: "Μάθηση & Εξάσκηση",
    matches: ["/learn", "/flashcards", "/review", "/quiz", "/progress", "/import"],
  },
  { to: "/tools#split-pdf", en: "Split PDF Tool", el: "Διαχωρισμός PDF", matches: ["/tools"] },
  { to: "/important-info", en: "Important Info", el: "Σημαντικές πληροφορίες", matches: ["/important-info"] },
] as const;

const footerNavigation = [
  ["/legal/license", "License", "Άδεια"],
  ["/legal/privacy", "Privacy", "Απόρρητο"],
  ["/legal/analytics", "Analytics choices", "Αναλυτικά στοιχεία"],
  ["/legal/copyright", "Copyright protected", "Πνευματικά δικαιώματα"],
] as const;

function isActiveMainArea(pathname: string, matches: readonly string[]): boolean {
  return matches.some((match) => pathname === match || (match !== "/" && pathname.startsWith(`${match}/`)));
}

export function AppLayout() {
  useAppearanceSettings();
  const location = useLocation();
  const navigationType = useNavigationType();
  const { text } = useLanguage();
  const internetStatus = useInternetConnectivity();
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const hasHandledInitialRouteRef = useRef(false);

  function focusMainContent() {
    mainRef.current?.focus();
  }

  useEffect(() => {
    const isInitialRoute = !hasHandledInitialRouteRef.current;
    const animationFrame = window.requestAnimationFrame(() => {
      hasHandledInitialRouteRef.current = true;
      if (location.hash) {
        const target = document.getElementById(location.hash.slice(1));
        if (target) {
          target.tabIndex = -1;
          target.focus();
          target.scrollIntoView({ block: "start" });
          return;
        }
      }
      if (navigationType === "POP" && !isInitialRoute) return;

      mainRef.current?.focus({ preventScroll: true });
      window.scrollTo({ behavior: "auto", left: 0, top: 0 });
    });
    return () => window.cancelAnimationFrame(animationFrame);
    // Only a logical route or in-app fragment change should reposition the page.
  }, [location.hash, location.pathname]);
  const internetStatusLabel = internetStatus === "online"
    ? text("Internet connection: Online", "Σύνδεση στο διαδίκτυο: Online")
    : internetStatus === "offline"
      ? text("Internet connection: Offline", "Σύνδεση στο διαδίκτυο: Offline")
      : text("Checking internet connection", "Έλεγχος σύνδεσης στο διαδίκτυο");
  const internetStatusClass = internetStatus === "online"
    ? "assistant-service-dot-available"
    : internetStatus === "offline"
      ? "assistant-service-dot-unavailable"
      : "assistant-service-dot-checking";

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content" onClick={(event) => {
        event.preventDefault();
        focusMainContent();
      }}>
        {text("Skip to main content", "Μετάβαση στο κύριο περιεχόμενο")}
      </a>
      <header className="app-header">
        <div className="app-header-top">
          <div>
            <p className="eyebrow">{text("Your private study space", "Ο προσωπικός σου χώρος μελέτης")}</p>
            <h1>{studyConfig.appName}</h1>
          </div>
          <div className="utility-actions" aria-label={text("Study settings", "Ρυθμίσεις μελέτης")}>
            <button
              aria-describedby="assistant-internet-status"
              aria-haspopup="dialog"
              aria-label={text("Open StudyApp AI Assistant", "Άνοιγμα Βοηθού AI του StudyApp")}
              className="assistant-launch-button"
              onClick={() => setIsAssistantOpen(true)}
              title={text("StudyApp AI Assistant", "Βοηθός AI του StudyApp")}
              type="button"
            >
              <span className="assistant-launch-avatar-wrap" title={internetStatusLabel}>
                <img alt="" className="assistant-launch-avatar" src="/study-assistant-avatar.svg" />
                <span
                  aria-hidden="true"
                  className={`assistant-service-dot assistant-launch-connectivity-dot ${internetStatusClass}`}
                />
              </span>
              <span className="assistant-launch-copy">
                <span className="assistant-launch-label">
                  {text("StudyApp AI Assistant", "Βοηθός AI του StudyApp")}
                </span>
              </span>
            </button>
            <span
              aria-live="polite"
              className="assistant-connectivity-live"
              id="assistant-internet-status"
              role="status"
            >
              {internetStatusLabel}
            </span>
            <LanguageSwitcher />
            <NavLink to="/appearance">{text("Settings", "Ρυθμίσεις")}</NavLink>
            <a href="mailto:markellos.markides@gmail.com?subject=StudyApp%20Feedback">
              {text("Feedback", "Σχόλια")}
            </a>
            <a
              className="text-link"
              href="https://markellosecosystem.com/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: "transparent",
                border: 0,
                borderRadius: 0,
                color: "var(--blue-600)",
                padding: 0,
                textDecoration: "underline",
                textUnderlineOffset: "0.2em",
              }}
            >
              {text("Back to markellosecosystem", "Πίσω στο markellosecosystem")}
            </a>
          </div>
        </div>
        <div className="navigation-row">
          <nav className="main-nav" aria-label={text("Main navigation", "Κύρια πλοήγηση")}>
            {mainNavigation.map((item) => {
              const isActive = isActiveMainArea(location.pathname, item.matches);
              return (
                <Link
                  aria-current={isActive ? "page" : undefined}
                  className={isActive ? "active" : undefined}
                  key={item.to}
                  to={item.to}
                >
                  {text(item.en, item.el)}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <PwaUpdateToast />
      <main className="app-main" id="main-content" ref={mainRef} tabIndex={-1}>
        <Outlet />
      </main>
      <footer className="app-footer">
        <p>© 2026 Markellos Markides. {text("All rights reserved.", "Με επιφύλαξη παντός δικαιώματος.")}</p>
        <nav className="footer-meta" aria-label={text("Legal information", "Νομικές πληροφορίες")}>
          {footerNavigation.map(([to, en, el]) => <NavLink key={to} to={to}>{text(en, el)}</NavLink>)}
        </nav>
        <small
          className="build-version"
          title={text(
            "Version · Cyprus build date and local time · commit reference",
            "Έκδοση · ημερομηνία και τοπική ώρα Κύπρου · αναφορά commit",
          )}
        >
          {__APP_BUILD_ID__}
        </small>
      </footer>
      <AssistantPanel open={isAssistantOpen} onClose={() => setIsAssistantOpen(false)} />
    </div>
  );
}
