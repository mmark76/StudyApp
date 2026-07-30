import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type AppLanguage = "en" | "el";

interface LanguageContextValue {
  language: AppLanguage;
  locale: "en-GB" | "el-GR";
  setLanguage: (language: AppLanguage) => void;
  text: (english: string, greek: string) => string;
}

const LANGUAGE_STORAGE_KEY = "studyapp.language.v1";
const defaultLanguageContext: LanguageContextValue = {
  language: "en",
  locale: "en-GB",
  setLanguage: () => undefined,
  text: (english) => english,
};
const LanguageContext = createContext<LanguageContextValue>(defaultLanguageContext);

function readInitialLanguage(): AppLanguage {
  if (typeof window === "undefined") return "en";

  const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (storedLanguage === "en" || storedLanguage === "el") return storedLanguage;

  return window.navigator.language.toLowerCase().startsWith("el") ? "el" : "en";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<AppLanguage>(readInitialLanguage);
  const text = useCallback(
    (english: string, greek: string) => (language === "el" ? greek : english),
    [language],
  );

  useEffect(() => {
    document.documentElement.lang = language;
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }, [language]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      locale: language === "el" ? "el-GR" : "en-GB",
      setLanguage,
      text,
    }),
    [language, text],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext);
}
