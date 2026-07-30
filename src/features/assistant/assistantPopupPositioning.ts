export const ASSISTANT_POPUP_WIDTH = 460;
export const ASSISTANT_POPUP_HEIGHT = 600;
export const SAFE_COMPANION_FALLBACK_URL = "https://chatgpt.com/";

const ASSISTANT_POPUP_MARGIN = 20;
const STUDYAPP_ASSISTANT_WINDOW_NAME = "studyapp-ai-assistant";
const APPROVED_COMPANION_HOSTNAMES = new Set(["chatgpt.com"]);

export interface AssistantPopupScreen {
  availHeight: number;
  availLeft?: number;
  availTop?: number;
  availWidth: number;
  windowLeft?: number;
  windowTop?: number;
}

export type AssistantPopupResult =
  | { status: "opened"; url: string }
  | { status: "blocked"; url: string }
  | { status: "invalid-url"; url: typeof SAFE_COMPANION_FALLBACK_URL };

type PopupOpener = (
  url?: string | URL,
  target?: string,
  features?: string,
) => WindowProxy | null;

function positiveDimension(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 1;
}

function availableOrigin(
  explicitOrigin: number | undefined,
  windowPosition: number | undefined,
  availableDimension: number,
): number {
  if (explicitOrigin !== undefined) return explicitOrigin;
  if (windowPosition === undefined || !Number.isFinite(windowPosition)) return 0;
  return Math.floor(windowPosition / availableDimension) * availableDimension;
}

function currentPopupScreen(): AssistantPopupScreen {
  return {
    availHeight: window.screen.availHeight,
    availLeft: (window.screen as Screen & { availLeft?: number }).availLeft,
    availTop: (window.screen as Screen & { availTop?: number }).availTop,
    availWidth: window.screen.availWidth,
    windowLeft: window.screenX,
    windowTop: window.screenY,
  };
}

export function validateCompanionUrl(value: string): string | null {
  try {
    const url = new URL(value);
    const approvedHostname = APPROVED_COMPANION_HOSTNAMES.has(
      url.hostname.toLowerCase(),
    );

    if (
      url.protocol !== "https:" ||
      !approvedHostname ||
      url.username ||
      url.password ||
      url.port
    ) {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

export function calculateCenteredPopupFeatures(
  screen: AssistantPopupScreen,
): string {
  const availableWidth = positiveDimension(screen.availWidth);
  const availableHeight = positiveDimension(screen.availHeight);
  const screenLeft = availableOrigin(
    screen.availLeft,
    screen.windowLeft,
    availableWidth,
  );
  const screenTop = availableOrigin(
    screen.availTop,
    screen.windowTop,
    availableHeight,
  );
  const popupWidth = Math.min(
    ASSISTANT_POPUP_WIDTH,
    Math.max(1, availableWidth - ASSISTANT_POPUP_MARGIN * 2),
  );
  const popupHeight = Math.min(
    ASSISTANT_POPUP_HEIGHT,
    Math.max(1, availableHeight - ASSISTANT_POPUP_MARGIN * 2),
  );
  const left = Math.round(screenLeft + (availableWidth - popupWidth) / 2);
  const top = Math.round(screenTop + (availableHeight - popupHeight) / 2);

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

export function openStudyAppAssistant(
  configuredUrl: string,
  openPopup: PopupOpener = window.open.bind(window),
  screen: AssistantPopupScreen = currentPopupScreen(),
): AssistantPopupResult {
  const validatedUrl = validateCompanionUrl(configuredUrl);
  if (!validatedUrl) {
    return { status: "invalid-url", url: SAFE_COMPANION_FALLBACK_URL };
  }

  const popup = openPopup(
    validatedUrl,
    STUDYAPP_ASSISTANT_WINDOW_NAME,
    calculateCenteredPopupFeatures(screen),
  );

  return popup === null
    ? { status: "blocked", url: validatedUrl }
    : { status: "opened", url: validatedUrl };
}
