const STUDYAPP_ASSISTANT_WINDOW_NAME = "studyapp-ai-assistant";

interface PositionedScreen extends Screen {
  availLeft?: number;
  availTop?: number;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

export function buildAttachedAssistantPopupFeatures(): string {
  const panelRect = document
    .querySelector<HTMLElement>(".assistant-panel")
    ?.getBoundingClientRect();
  const progressRect = document
    .querySelector<HTMLElement>(".assistant-progress")
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

  const panelWidth = panelRect?.width ?? 430;
  const popupWidth = Math.round(clamp(panelWidth - 8, 380, 460));
  const panelInset = panelRect
    ? Math.max(0, (panelRect.width - popupWidth) / 2)
    : 0;
  const desiredLeft = panelRect
    ? viewportScreenLeft + panelRect.left + panelInset
    : viewportScreenLeft + window.innerWidth - popupWidth;
  const desiredTop = progressRect
    ? viewportScreenTop + progressRect.bottom + 12
    : viewportScreenTop + (panelRect?.top ?? 0) + 150;

  const left = Math.round(
    clamp(desiredLeft, screenLeft, Math.max(screenLeft, screenRight - popupWidth)),
  );
  const availablePopupHeight = Math.max(420, screenBottom - desiredTop - 20);
  const popupHeight = Math.round(clamp(availablePopupHeight, 420, 620));
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

  window.open = ((
    url?: string | URL,
    target?: string,
    features?: string,
  ): WindowProxy | null => {
    if (target !== STUDYAPP_ASSISTANT_WINDOW_NAME) {
      return nativeOpen(url, target, features);
    }

    return nativeOpen(url, target, buildAttachedAssistantPopupFeatures());
  }) as typeof window.open;
}
