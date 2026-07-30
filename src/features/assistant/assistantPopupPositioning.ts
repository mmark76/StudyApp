const STUDYAPP_ASSISTANT_WINDOW_NAME = "studyapp-ai-assistant";

interface PositionedScreen extends Screen {
  availLeft?: number;
  availTop?: number;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function removeStepThreeHelperMessages(): void {
  const panel = document.querySelector<HTMLElement>(".assistant-panel");
  const progressText = panel
    ?.querySelector<HTMLElement>(".assistant-progress")
    ?.textContent?.trim();

  const isStepThree =
    progressText === "Step 3 of 3" || progressText === "Βήμα 3 από 3";

  if (!panel || !isStepThree) return;

  panel
    .querySelector<HTMLElement>("section .assistant-step-intro")
    ?.remove();
  panel
    .querySelectorAll<HTMLElement>(".assistant-status")
    .forEach((status) => status.remove());
}

export function buildAttachedAssistantPopupFeatures(): string {
  const panelRect = document
    .querySelector<HTMLElement>(".assistant-panel")
    ?.getBoundingClientRect();

  const availableWidth = window.screen.availWidth || window.outerWidth;
  const availableHeight = window.screen.availHeight || window.outerHeight;
  const positionedScreen = window.screen as PositionedScreen;
  const screenLeft = positionedScreen.availLeft ?? 0;
  const screenTop = positionedScreen.availTop ?? 0;
  const screenRight = screenLeft + availableWidth;
  const screenBottom = screenTop + availableHeight;

  const horizontalBrowserChrome = Math.max(
    0,
    (window.outerWidth - window.innerWidth) / 2,
  );
  const verticalBrowserChrome = Math.max(
    0,
    window.outerHeight - window.innerHeight - horizontalBrowserChrome,
  );
  const viewportScreenLeft = window.screenX + horizontalBrowserChrome;
  const viewportScreenTop = window.screenY + verticalBrowserChrome;

  // Match the requested visual layout: the popup sits inside the right-hand
  // assistant panel with an 8 px horizontal inset and starts 200 px below
  // the panel top, directly beneath the Step 3 heading.
  const panelWidth = panelRect?.width ?? 500;
  const popupWidth = Math.round(clamp(panelWidth - 40, 380, 460));
  const popupHeight = Math.round(
    clamp((panelRect?.height ?? 870) - 250, 420, 620),
  );
  const desiredLeft = panelRect
    ? viewportScreenLeft + panelRect.left + 8
    : viewportScreenLeft + window.innerWidth - popupWidth - 8;
  const desiredTop = panelRect
    ? viewportScreenTop + panelRect.top + 200
    : viewportScreenTop + 200;

  const left = Math.round(
    clamp(desiredLeft, screenLeft, Math.max(screenLeft, screenRight - popupWidth)),
  );
  const top = Math.round(
    clamp(desiredTop, screenTop, Math.max(screenTop, screenBottom - popupHeight)),
  );

  return [
    "popup=yes",
    `width=${popupWidth}`,
    `height=${popupHeight}`,
    `left=${left}`,
    `top=${top}`,
    "noopener",
    "noreferrer",
  ].join(",");
}

export function installAssistantPopupPositioning(): void {
  const nativeOpen = window.open.bind(window);
  const observer = new MutationObserver(removeStepThreeHelperMessages);

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  window.open = ((
    url?: string | URL,
    target?: string,
    features?: string,
  ): WindowProxy | null => {
    if (target !== STUDYAPP_ASSISTANT_WINDOW_NAME) {
      return nativeOpen(url, target, features);
    }

    removeStepThreeHelperMessages();
    return nativeOpen(url, target, buildAttachedAssistantPopupFeatures());
  }) as typeof window.open;
}