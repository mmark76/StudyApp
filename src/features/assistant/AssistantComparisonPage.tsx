import { Link } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";

type LocalizedCopy = {
  en: string;
  el: string;
};

type ComparisonRow = {
  label: LocalizedCopy;
  customGpt: LocalizedCopy;
  mcp: LocalizedCopy;
  studyAppAi: LocalizedCopy;
};

export const AI_OPTION_COMPARISON_ROWS: readonly ComparisonRow[] = [
  {
    label: { en: "What is used", el: "Τι χρησιμοποιείται" },
    customGpt: {
      en: "The specialized StudyApp Custom GPT",
      el: "Το εξειδικευμένο Custom GPT του StudyApp",
    },
    mcp: {
      en: "The user's ChatGPT, connected to StudyApp through MCP",
      el: "Το ChatGPT του χρήστη, συνδεδεμένο με το StudyApp μέσω MCP",
    },
    studyAppAi: {
      en: "StudyApp's integrated AI through the OpenAI API",
      el: "Το ενσωματωμένο AI του StudyApp μέσω OpenAI API",
    },
  },
  {
    label: { en: "Account required", el: "Λογαριασμός που απαιτείται" },
    customGpt: {
      en: "ChatGPT account — Free or Paid",
      el: "Λογαριασμός ChatGPT — Free ή Paid",
    },
    mcp: {
      en: "ChatGPT account with a plan that supports custom MCP apps",
      el: "Λογαριασμός ChatGPT με πλάνο που υποστηρίζει custom MCP apps",
    },
    studyAppAi: {
      en: "No ChatGPT account required",
      el: "Δεν απαιτείται λογαριασμός ChatGPT",
    },
  },
  {
    label: { en: "Usage limits", el: "Όρια χρήσης" },
    customGpt: {
      en: "According to the user's ChatGPT plan",
      el: "Σύμφωνα με τα όρια του πλάνου ChatGPT του χρήστη",
    },
    mcp: {
      en: "According to the user's ChatGPT plan and App/MCP availability",
      el: "Σύμφωνα με το πλάνο ChatGPT του χρήστη και τη διαθεσιμότητα App/MCP",
    },
    studyAppAi: {
      en: "According to StudyApp usage limits when the service becomes available",
      el: "Σύμφωνα με τα όρια χρήσης του StudyApp όταν η υπηρεσία γίνει διαθέσιμη",
    },
  },
  {
    label: { en: "StudyApp contribution", el: "Συνεισφορά του StudyApp" },
    customGpt: {
      en: "Provides the study methodology and instructions and directs the user to the specialized StudyApp Custom GPT",
      el: "Παρέχει τη μεθοδολογία και τις οδηγίες μελέτης και παραπέμπει τον χρήστη στο εξειδικευμένο Custom GPT του StudyApp",
    },
    mcp: {
      en: "Provides selected StudyApp data, tools and capabilities to ChatGPT",
      el: "Παρέχει στο ChatGPT επιλεγμένα δεδομένα, εργαλεία και δυνατότητες του StudyApp",
    },
    studyAppAi: {
      en: "Provides the environment, selected material, tools and learning flow inside StudyApp",
      el: "Παρέχει το περιβάλλον, το επιλεγμένο υλικό, τα εργαλεία και την πορεία μάθησης μέσα στο StudyApp",
    },
  },
  {
    label: { en: "AI instructions / methodology", el: "Οδηγίες / μεθοδολογία AI" },
    customGpt: {
      en: "StudyApp instructions and methodology are built into the Custom GPT",
      el: "Οι οδηγίες και η μεθοδολογία του StudyApp είναι ενσωματωμένες στο Custom GPT",
    },
    mcp: {
      en: "The user's prompts work together with the rules of the StudyApp tools",
      el: "Τα prompts του χρήστη λειτουργούν μαζί με τους κανόνες των εργαλείων του StudyApp",
    },
    studyAppAi: {
      en: "StudyApp can provide guided workflows, prompts and tools",
      el: "Το StudyApp μπορεί να παρέχει καθοδηγούμενες ροές, prompts και εργαλεία",
    },
  },
  {
    label: { en: "User's own prompts", el: "Δικά του prompts ο χρήστης" },
    customGpt: {
      en: "Yes — alongside the StudyApp Custom GPT instructions",
      el: "Ναι — μαζί με τις οδηγίες του Custom GPT του StudyApp",
    },
    mcp: {
      en: "Yes — the user can define the task and workflow in ChatGPT",
      el: "Ναι — ο χρήστης μπορεί να καθορίζει την εργασία και τη ροή μέσα στο ChatGPT",
    },
    studyAppAi: {
      en: "Yes — where the StudyApp workflow offers free or custom input",
      el: "Ναι — όπου η ροή του StudyApp προσφέρει ελεύθερη ή custom εισαγωγή",
    },
  },
  {
    label: { en: "Freedom of study method", el: "Ελευθερία μεθόδου μελέτης" },
    customGpt: {
      en: "High — the user can combine StudyApp guidance with their own prompts",
      el: "Υψηλή — ο χρήστης μπορεί να συνδυάζει την καθοδήγηση του StudyApp με δικά του prompts",
    },
    mcp: {
      en: "Very high — the user defines the workflow in ChatGPT",
      el: "Πολύ υψηλή — ο χρήστης καθορίζει τη ροή μέσα στο ChatGPT",
    },
    studyAppAi: {
      en: "From guided to flexible, depending on the StudyApp workflow",
      el: "Από καθοδηγούμενη έως ευέλικτη, ανάλογα με τη ροή του StudyApp",
    },
  },
  {
    label: { en: "Use of StudyApp material", el: "Χρήση υλικού StudyApp" },
    customGpt: {
      en: "The user chooses and shares the material directly in ChatGPT",
      el: "Ο χρήστης επιλέγει και δίνει το υλικό απευθείας στο ChatGPT",
    },
    mcp: {
      en: "Selected StudyApp data can be provided through approved tools",
      el: "Επιλεγμένα δεδομένα του StudyApp μπορούν να παρέχονται μέσω εγκεκριμένων εργαλείων",
    },
    studyAppAi: {
      en: "Selected material can be used directly within the StudyApp learning flow",
      el: "Το επιλεγμένο υλικό μπορεί να χρησιμοποιείται απευθείας μέσα στη ροή μάθησης του StudyApp",
    },
  },
  {
    label: { en: "StudyApp tools", el: "Εργαλεία StudyApp" },
    customGpt: {
      en: "Uses the existing manual return and import flow",
      el: "Χρησιμοποιεί την υπάρχουσα χειροκίνητη διαδικασία επιστροφής και εισαγωγής",
    },
    mcp: {
      en: "Approved StudyApp tools are central to the connection",
      el: "Τα εγκεκριμένα εργαλεία του StudyApp αποτελούν βασικό μέρος της σύνδεσης",
    },
    studyAppAi: {
      en: "StudyApp tools can be available directly inside the learning flow",
      el: "Τα εργαλεία του StudyApp μπορούν να είναι διαθέσιμα απευθείας μέσα στη ροή μάθησης",
    },
  },
  {
    label: { en: "Flashcards / Quizzes", el: "Flashcards / Quizzes" },
    customGpt: {
      en: "Can be created in ChatGPT and imported into StudyApp",
      el: "Μπορούν να δημιουργούνται στο ChatGPT και να εισάγονται στο StudyApp",
    },
    mcp: {
      en: "Can be created through approved StudyApp tools when available",
      el: "Μπορούν να δημιουργούνται μέσω εγκεκριμένων εργαλείων του StudyApp όταν γίνουν διαθέσιμα",
    },
    studyAppAi: {
      en: "Can be generated, reviewed and used directly in StudyApp when available",
      el: "Μπορούν να δημιουργούνται, να ελέγχονται και να χρησιμοποιούνται απευθείας στο StudyApp όταν γίνουν διαθέσιμα",
    },
  },
  {
    label: {
      en: "Progress / weak areas / study history",
      el: "Πρόοδος / αδυναμίες / ιστορικό μελέτης",
    },
    customGpt: {
      en: "Can be considered when the user chooses to provide that information",
      el: "Μπορούν να λαμβάνονται υπόψη όταν ο χρήστης επιλέξει να δώσει αυτές τις πληροφορίες",
    },
    mcp: {
      en: "Can be used when they are exposed through approved StudyApp tools",
      el: "Μπορούν να χρησιμοποιούνται όταν παρέχονται μέσω εγκεκριμένων εργαλείων του StudyApp",
    },
    studyAppAi: {
      en: "Can become part of the AI-assisted learning flow inside StudyApp",
      el: "Μπορούν να αποτελούν μέρος της AI-assisted πορείας μάθησης μέσα στο StudyApp",
    },
  },
  {
    label: { en: "Actions inside StudyApp", el: "Ενέργειες μέσα στο StudyApp" },
    customGpt: {
      en: "The user manually adds or imports the results they choose",
      el: "Ο χρήστης προσθέτει ή εισάγει χειροκίνητα τα αποτελέσματα που επιλέγει",
    },
    mcp: {
      en: "Approved actions can be performed through StudyApp tools with confirmation",
      el: "Εγκεκριμένες ενέργειες μπορούν να εκτελούνται μέσω εργαλείων του StudyApp με επιβεβαίωση",
    },
    studyAppAi: {
      en: "Actions can take place inside StudyApp with review and confirmation",
      el: "Οι ενέργειες μπορούν να γίνονται μέσα στο StudyApp με έλεγχο και επιβεβαίωση",
    },
  },
  {
    label: { en: "Connection with StudyApp", el: "Σύνδεση με το StudyApp" },
    customGpt: {
      en: "External specialized assistant linked from StudyApp",
      el: "Εξωτερικός εξειδικευμένος βοηθός στον οποίο παραπέμπει το StudyApp",
    },
    mcp: {
      en: "ChatGPT connected to StudyApp data and tools",
      el: "Το ChatGPT συνδεδεμένο με δεδομένα και εργαλεία του StudyApp",
    },
    studyAppAi: {
      en: "AI integrated directly inside StudyApp",
      el: "AI ενσωματωμένο απευθείας μέσα στο StudyApp",
    },
  },
  {
    label: { en: "Main advantage", el: "Κύριο πλεονέκτημα" },
    customGpt: {
      en: "A specialized StudyApp assistant with the flexibility of ChatGPT",
      el: "Εξειδικευμένος βοηθός του StudyApp με την ευελιξία του ChatGPT",
    },
    mcp: {
      en: "The freedom of ChatGPT combined with StudyApp data and tools",
      el: "Η ελευθερία του ChatGPT μαζί με τα δεδομένα και τα εργαλεία του StudyApp",
    },
    studyAppAi: {
      en: "AI integrated directly into the StudyApp learning process",
      el: "AI ενσωματωμένο απευθείας στη διαδικασία μάθησης του StudyApp",
    },
  },
  {
    label: { en: "Ideal for", el: "Ιδανικό για" },
    customGpt: {
      en: "Users who want StudyApp guidance while working in ChatGPT",
      el: "Χρήστες που θέλουν την καθοδήγηση του StudyApp ενώ εργάζονται στο ChatGPT",
    },
    mcp: {
      en: "Users who want to define their own workflow and use StudyApp capabilities",
      el: "Χρήστες που θέλουν να καθορίζουν τη δική τους ροή και να αξιοποιούν τις δυνατότητες του StudyApp",
    },
    studyAppAi: {
      en: "Users who want an integrated AI-assisted study experience inside StudyApp",
      el: "Χρήστες που θέλουν ολοκληρωμένη AI-assisted μελέτη μέσα στο StudyApp",
    },
  },
  {
    label: { en: "Cost for the user", el: "Κόστος για τον χρήστη" },
    customGpt: {
      en: "According to the user's ChatGPT plan",
      el: "Σύμφωνα με το πλάνο ChatGPT του χρήστη",
    },
    mcp: {
      en: "According to the user's ChatGPT plan",
      el: "Σύμφωνα με το πλάνο ChatGPT του χρήστη",
    },
    studyAppAi: {
      en: "Not active yet — no charges yet",
      el: "Δεν είναι ακόμη ενεργό — δεν γίνεται χρέωση ακόμη",
    },
  },
] as const;

export function AssistantComparisonPage() {
  const { text } = useLanguage();

  return (
    <div className="assistant-comparison-page stack-lg">
      <header className="assistant-comparison-hero">
        <div>
          <p className="eyebrow">{text("AI options", "Επιλογές AI")}</p>
          <h2>{text("Compare AI options", "Σύγκριση επιλογών AI")}</h2>
          <p>
            {text(
              "Compare the available StudyApp AI Assistant with the two planned AI options.",
              "Σύγκρινε τον διαθέσιμο Βοηθό AI του StudyApp με τις δύο επιλογές AI που σχεδιάζονται.",
            )}
          </p>
          <div className="button-row">
            <Link className="button secondary" to="/ai-assistant-guide">
              {text("Back to AI Assistant", "Πίσω στον Βοηθό AI")}
            </Link>
          </div>
        </div>
      </header>

      <div className="assistant-comparison-table-wrap">
        <table
          aria-label={text(
            "Comparison of StudyApp AI options",
            "Σύγκριση επιλογών AI του StudyApp",
          )}
          className="assistant-comparison-table"
        >
          <thead>
            <tr>
              <th scope="col">{text("Parameter", "Παράμετρος")}</th>
              <th scope="col">
                <span className="assistant-comparison-status available">
                  {text("Available", "Διαθέσιμο")}
                </span>
                <strong>1. Custom GPT</strong>
              </th>
              <th scope="col">
                <span className="assistant-comparison-status soon">
                  {text("Coming soon", "Σύντομα")}
                </span>
                <strong>2. ChatGPT App / MCP</strong>
              </th>
              <th scope="col">
                <span className="assistant-comparison-status soon">
                  {text("Coming soon", "Σύντομα")}
                </span>
                <strong>3. StudyApp AI</strong>
              </th>
            </tr>
          </thead>
          <tbody>
            {AI_OPTION_COMPARISON_ROWS.map((row) => (
              <tr key={row.label.en}>
                <th scope="row">{text(row.label.en, row.label.el)}</th>
                <td>{text(row.customGpt.en, row.customGpt.el)}</td>
                <td>{text(row.mcp.en, row.mcp.el)}</td>
                <td>{text(row.studyAppAi.en, row.studyAppAi.el)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="assistant-comparison-note">
        {text(
          "ChatGPT plan features and App/MCP availability are determined by OpenAI and may change over time. StudyApp AI and ChatGPT App / MCP are not active yet.",
          "Οι δυνατότητες των πλάνων ChatGPT και η διαθεσιμότητα App/MCP καθορίζονται από την OpenAI και μπορεί να αλλάζουν με τον χρόνο. Το StudyApp AI και το ChatGPT App / MCP δεν είναι ακόμη ενεργά.",
        )}
      </p>
    </div>
  );
}
