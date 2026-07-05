import { NavLink, Outlet } from "react-router-dom";
import { studyConfig } from "../../app/studyConfig";
import { useAppearanceSettings } from "../../features/appearance/useAppearanceSettings";
import { EducationLevelSelector } from "../../features/education/EducationLevelSelector";
import { useEducationProfile } from "../../features/education/useEducationProfile";

const primaryNavigation = [
  ["/", "Home"],
  ["/study", "Study & Learn"],
  ["/library", "Library"],
] as const;

const footerNavigation = [
  ["/legal/license", "License"],
  ["/legal/privacy", "Privacy"],
  ["/legal/analytics", "Analytics choices"],
  ["/legal/copyright", "Copyright protected"]
] as const;

export function AppLayout() {
  useAppearanceSettings();
  const { profile, isLoading, selectEducationLevel, clearEducationLevel } = useEducationProfile();

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Your private study space</p>
          <h1>{studyConfig.appName}</h1>
          {profile ? <p className="education-context">{profile.title} · {profile.studyLabel}</p> : null}
        </div>
        {profile ? (
          <div className="navigation-row">
            <nav className="main-nav" aria-label="Main navigation">
              {primaryNavigation.map(([to, label]) => (
                <NavLink end={to === "/"} key={to} to={to}>{label}</NavLink>
              ))}
            </nav>
            <div className="utility-actions" aria-label="Study settings">
              <NavLink to="/appearance">Settings</NavLink>
              <button type="button" onClick={() => void clearEducationLevel()}>
                Choose Education Level
              </button>
            </div>
          </div>
        ) : null}
      </header>
      <main className="app-main">
        {isLoading ? (
          <section className="empty-state"><p>Preparing your study space…</p></section>
        ) : profile ? (
          <Outlet />
        ) : (
          <EducationLevelSelector onSelect={selectEducationLevel} />
        )}
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
