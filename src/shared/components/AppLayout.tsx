import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { studyConfig } from "../../app/studyConfig";
import { useAppearanceSettings } from "../../features/appearance/useAppearanceSettings";

const mainNavigation = [
  { to: "/", label: "Home", matches: ["/"] },
  { to: "/library", label: "Library", matches: ["/library"] },
  { to: "/study/theory", label: "Structured Study", matches: ["/study", "/study/theory", "/units", "/import"] },
  { to: "/learn", label: "Learn & Practice", matches: ["/learn", "/flashcards", "/review", "/quiz", "/progress"] },
  { to: "/tools#split-pdf", label: "Split PDF Tool", matches: ["/tools"] },
  { to: "/study-materials", label: "Add / Remove Material", matches: ["/study-materials"] },
] as const;

const footerNavigation = [
  ["/legal/license", "License"],
  ["/legal/privacy", "Privacy"],
  ["/legal/analytics", "Analytics choices"],
  ["/legal/copyright", "Copyright protected"]
] as const;

function isActiveMainArea(pathname: string, matches: readonly string[]): boolean {
  return matches.some((match) => pathname === match || (match !== "/" && pathname.startsWith(`${match}/`)));
}

export function AppLayout() {
  useAppearanceSettings();
  const location = useLocation();

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-top">
          <div>
            <p className="eyebrow">Your private study space</p>
            <h1>{studyConfig.appName}</h1>
          </div>
          <div className="utility-actions" aria-label="Study settings">
            <NavLink to="/appearance">Settings</NavLink>
            <a href="mailto:markellos.markides@gmail.com?subject=StudyApp%20Feedback">
              Feedback
            </a>
            <a href="https://markellosecosystem.com/" target="_blank" rel="noreferrer">
              Back to markellosecosystem
            </a>
          </div>
        </div>
        <div className="navigation-row">
          <nav className="main-nav" aria-label="Main navigation">
            {mainNavigation.map((item) => {
              const isActive = isActiveMainArea(location.pathname, item.matches);
              return (
                <Link
                  aria-current={isActive ? "page" : undefined}
                  className={isActive ? "active" : undefined}
                  key={item.to}
                  to={item.to}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
      <footer className="app-footer">
        <p>© 2026 Markellos Markides. All rights reserved.</p>
        <nav className="footer-meta" aria-label="Legal information">
          {footerNavigation.map(([to, label]) => <NavLink key={to} to={to}>{label}</NavLink>)}
        </nav>
        <small
          className="build-version"
          title="Version · Cyprus build date (YYYYMMDD) and local time · commit reference"
        >
          {__APP_BUILD_ID__}
        </small>
      </footer>
    </div>
  );
}
