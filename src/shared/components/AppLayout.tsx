import { NavLink, Outlet } from "react-router-dom";
import { studyConfig } from "../../app/studyConfig";
import { useAppearanceSettings } from "../../features/appearance/useAppearanceSettings";

const footerNavigation = [
  ["/legal/license", "License"],
  ["/legal/privacy", "Privacy"],
  ["/legal/analytics", "Analytics choices"],
  ["/legal/copyright", "Copyright protected"]
] as const;

export function AppLayout() {
  useAppearanceSettings();

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Your private study space</p>
          <h1>{studyConfig.appName}</h1>
        </div>
        <div
          className="navigation-row"
          style={{ alignItems: "center", flexDirection: "row", flexWrap: "nowrap" }}
        >
          <nav className="main-nav" style={{ alignItems: "center", flexWrap: "nowrap" }} aria-label="Home navigation">
            <NavLink end to="/">Home</NavLink>
          </nav>
          <div className="utility-actions" style={{ alignItems: "center", flexWrap: "nowrap" }} aria-label="Study settings">
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
