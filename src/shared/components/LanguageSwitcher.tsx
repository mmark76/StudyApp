import { useLanguage, type AppLanguage } from "../../i18n/LanguageContext";

const languages: readonly { value: AppLanguage; label: string; name: string }[] = [
  { value: "el", label: "GR", name: "Ελληνικά" },
  { value: "en", label: "EN", name: "English" },
];

export function LanguageSwitcher() {
  const { language, setLanguage, text } = useLanguage();

  return (
    <div className="language-switcher" aria-label={text("Language", "Γλώσσα")}>
      {languages.map((option) => (
        <button
          aria-pressed={language === option.value}
          className={language === option.value ? "active" : undefined}
          key={option.value}
          onClick={() => setLanguage(option.value)}
          title={option.name}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
