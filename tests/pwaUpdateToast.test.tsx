import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { AppLanguage } from "../src/i18n/LanguageContext";
import type { PwaUpdateState } from "../src/app/pwaUpdate";
import {
  PWA_UPDATE_COPY,
  PwaUpdateNotification,
} from "../src/shared/components/PwaUpdateToast";

const availableState: PwaUpdateState = {
  errorCode: null,
  isApplying: false,
  isAvailable: true,
};

function renderNotification(
  language: AppLanguage,
  updateState: PwaUpdateState = availableState,
): string {
  return renderToStaticMarkup(
    <PwaUpdateNotification
      language={language}
      onApply={vi.fn()}
      onDismiss={vi.fn()}
      updateState={updateState}
    />,
  );
}

describe("PWA update notification", () => {
  it("is absent when no update is available", () => {
    expect(
      renderNotification("en", {
        ...availableState,
        isAvailable: false,
      }),
    ).toBe("");
  });

  it.each([
    ["en", PWA_UPDATE_COPY.en],
    ["el", PWA_UPDATE_COPY.el],
  ] as const)("renders the exact %s title, message, and actions", (language, copy) => {
    const markup = renderNotification(language);

    expect(markup).toContain(copy.title);
    expect(markup).toContain(copy.message);
    expect(markup).toContain(`>${copy.update}</button>`);
    expect(markup).toContain(`>${copy.later}</button>`);
  });

  it("removes the obsolete long instruction in both languages", () => {
    const markup = `${renderNotification("en")}${renderNotification("el")}`;

    expect(markup).not.toContain(
      "Update when you finish your current work.",
    );
    expect(markup).not.toContain(
      "Κάνε ενημέρωση όταν ολοκληρώσεις την τρέχουσα εργασία.",
    );
  });

  it.each([
    ["en", PWA_UPDATE_COPY.en.applying],
    ["el", PWA_UPDATE_COPY.el.applying],
  ] as const)("disables both %s controls and uses the applying label", (
    language,
    applyingLabel,
  ) => {
    const markup = renderNotification(language, {
      ...availableState,
      isApplying: true,
    });

    expect(markup).toContain(applyingLabel);
    expect(markup.match(/disabled=""/gu)).toHaveLength(2);
  });

  it.each([
    ["en", PWA_UPDATE_COPY.en.failure],
    ["el", PWA_UPDATE_COPY.el.failure],
  ] as const)("renders the localized %s failure without raw errors", (
    language,
    failure,
  ) => {
    const markup = renderNotification(language, {
      ...availableState,
      errorCode: "apply-failed",
    });

    expect(markup).toContain(failure);
    expect(markup).not.toContain("service worker failure");
    expect(markup).not.toContain("Error:");
  });

  it("retranslates one neutral error state when the language changes", () => {
    const errorState: PwaUpdateState = {
      ...availableState,
      errorCode: "apply-failed",
    };
    const englishMarkup = renderNotification("en", errorState);
    const greekMarkup = renderNotification("el", errorState);

    expect(englishMarkup).toContain(PWA_UPDATE_COPY.en.failure);
    expect(greekMarkup).toContain(PWA_UPDATE_COPY.el.failure);
    expect(greekMarkup).not.toContain(PWA_UPDATE_COPY.en.failure);
  });

  it("uses one labelled complementary notification and one polite status region", () => {
    const markup = renderNotification("en");

    expect(markup).toContain('aria-labelledby="pwa-update-title"');
    expect(markup).toContain('aria-describedby="pwa-update-message"');
    expect(markup).toContain('id="pwa-update-title"');
    expect(markup).toContain('id="pwa-update-message"');
    expect(markup).toContain('role="status"');
    expect(markup).toContain('aria-live="polite"');
    expect(markup).toContain('aria-atomic="true"');
    expect(markup.match(/aria-live=/gu)).toHaveLength(1);
    expect(markup).not.toContain("autofocus");
  });
});
