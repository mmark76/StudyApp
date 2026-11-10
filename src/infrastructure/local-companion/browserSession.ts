import { isStudyAppLocalEdition } from "./localCompanionClient";

/** Keep only the top-level Local tab's server session alive. */
export function startLocalBrowserSession(): void {
  if (import.meta.env.MODE === "e2e" || window.top !== window || !isStudyAppLocalEdition()) return;

  const send = (state: "active" | "leave") => {
    const body = JSON.stringify({ state });
    if (state === "leave" && navigator.sendBeacon) {
      if (navigator.sendBeacon("/api/local-session", new Blob([body], { type: "application/json" }))) return;
    }
    void fetch("/api/local-session", {
      method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true,
    }).catch(() => undefined);
  };
  send("active");
  window.setInterval(() => send("active"), 15_000);
  window.addEventListener("pageshow", () => send("active"));
  window.addEventListener("pagehide", () => send("leave"));
}
