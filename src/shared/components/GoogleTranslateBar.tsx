import { useEffect } from "react";

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: {
      translate?: {
        TranslateElement?: new (
          options: {
            pageLanguage: string;
            autoDisplay: boolean;
            layout?: number;
          },
          elementId: string,
        ) => unknown;
      };
    };
  }
}

const SCRIPT_ID = "google-translate-script";
const ELEMENT_ID = "google_translate_element";

export function GoogleTranslateBar() {
  useEffect(() => {
    document.documentElement.lang = "en";

    window.googleTranslateElementInit = () => {
      const TranslateElement = window.google?.translate?.TranslateElement;
      const element = document.getElementById(ELEMENT_ID);
      if (!TranslateElement || !element || element.childElementCount > 0) return;

      new TranslateElement(
        {
          pageLanguage: "en",
          autoDisplay: false,
          layout: 0,
        },
        ELEMENT_ID,
      );
    };

    if (document.getElementById(SCRIPT_ID)) {
      window.googleTranslateElementInit();
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return (
    <div className="translation-bar" aria-label="Language translation">
      <span>Language</span>
      <div id={ELEMENT_ID} />
    </div>
  );
}
