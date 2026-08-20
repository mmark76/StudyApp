import { useEffect, useState } from "react";
import { useLanguage } from "../../i18n/LanguageContext";

type WorkspaceTheme = "light" | "dark";

const WORKSPACE_THEME_STORAGE_KEY = "studyapp-workspace-theme";
const workspaceFrameSelector = [
  "iframe.workspace-beta-frame",
  "iframe.workspace-beta-info-modal-frame",
].join(", ");

function readWorkspaceTheme(): WorkspaceTheme {
  try {
    return window.localStorage.getItem(WORKSPACE_THEME_STORAGE_KEY) === "dark"
      ? "dark"
      : "light";
  } catch {
    return "light";
  }
}

function applyThemeToFrame(frame: HTMLIFrameElement, theme: WorkspaceTheme) {
  try {
    frame.contentDocument?.documentElement.setAttribute("data-workspace-theme", theme);
  } catch {
    // Workspace frames are same-origin. Fail open if a browser blocks access.
  }
}

function applyThemeToWorkspaceFrames(theme: WorkspaceTheme) {
  document.querySelectorAll<HTMLIFrameElement>(workspaceFrameSelector)
    .forEach((frame) => applyThemeToFrame(frame, theme));
}

export function WorkspaceThemeToggle() {
  const { text } = useLanguage();
  const [theme, setTheme] = useState<WorkspaceTheme>(readWorkspaceTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-workspace-theme", theme);
    applyThemeToWorkspaceFrames(theme);

    try {
      window.localStorage.setItem(WORKSPACE_THEME_STORAGE_KEY, theme);
    } catch {
      // The visual preference still works for the current session.
    }

    const applyThemeOnFrameLoad = (event: Event) => {
      if (!(event.target instanceof HTMLIFrameElement)) return;
      if (!event.target.matches(workspaceFrameSelector)) return;
      applyThemeToFrame(event.target, theme);
    };

    document.addEventListener("load", applyThemeOnFrameLoad, true);
    return () => document.removeEventListener("load", applyThemeOnFrameLoad, true);
  }, [theme]);

  useEffect(() => () => {
    document.documentElement.removeAttribute("data-workspace-theme");
  }, []);

  const isDark = theme === "dark";
  const nextThemeLabel = isDark
    ? text("Light", "Φωτεινό")
    : text("Dark", "Σκούρο");
  const accessibleLabel = isDark
    ? text("Switch to light mode", "Μετάβαση σε φωτεινή λειτουργία")
    : text("Switch to dark mode", "Μετάβαση σε σκούρα λειτουργία");

  return (
    <button
      aria-label={accessibleLabel}
      aria-pressed={isDark}
      className="workspace-beta-theme-toggle"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      title={accessibleLabel}
      type="button"
    >
      {nextThemeLabel}
    </button>
  );
}
