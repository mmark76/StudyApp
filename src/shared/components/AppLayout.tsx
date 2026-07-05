import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { studyConfig } from "../../app/studyConfig";
import { useAppearanceSettings } from "../../features/appearance/useAppearanceSettings";

const mainNavigation = [
  { to: "/", label: "Home", matches: ["/"] },
  { to: "/study/theory", label: "Study", matches: ["/study", "/study/theory", "/units", "/import"] },
  { to: "/learn", label: "Learn", matches: ["/learn", "/flashcards", "/review", "/quiz", "/progress"] },
  { to: "/library", label: "Library", matches: ["/library", "/study-materials"] },
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
        <div>
          <p className="eyebrow">Your private study space</p>
          <h1>{studyConfig.appName}</h1>
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
          <div className="utility-actions" aria-label="Study settings">
            <NavLink to="/appearance">Settings</NavLink>
          </div>
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
      </footer>
      <small
        className="build-version"
        title="Version · Cyprus build date (YYYYMMDD) and local time · commit reference"
      >
        {__APP_BUILD_ID__}
      </small>
    </div>
  );
}
