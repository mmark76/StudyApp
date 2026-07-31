export type LocalizedLegalText = {
  en: string;
  el: string;
};

export type LegalPageContent = {
  title: LocalizedLegalText;
  summary: LocalizedLegalText;
  lastUpdated: LocalizedLegalText;
  sections: readonly {
    heading: LocalizedLegalText;
    paragraphs: readonly LocalizedLegalText[];
  }[];
};

function copy(en: string, el: string): LocalizedLegalText {
  return { en, el };
}

export const legalPages = {
  license: {
    title: copy("License", "Άδεια"),
    summary: copy("The project is publicly visible but is not open source.", "Το έργο είναι δημόσια ορατό αλλά δεν είναι ανοικτού κώδικα."),
    lastUpdated: copy("30 July 2026", "30 Ιουλίου 2026"),
    sections: [
      {
        heading: copy("All Rights Reserved", "Με επιφύλαξη παντός δικαιώματος"),
        paragraphs: [
          copy("Copyright © 2026 Markellos Markides. All rights reserved.", "Copyright © 2026 Markellos Markides. Με επιφύλαξη παντός δικαιώματος."),
          copy("Copying, modifying, distributing or selling the project requires prior written permission.", "Η αντιγραφή, τροποποίηση, διανομή ή πώληση απαιτεί προηγούμενη γραπτή άδεια."),
        ],
      },
      {
        heading: copy("Third-party material", "Υλικό τρίτων"),
        paragraphs: [copy("Third-party software and material remain subject to their own licences.", "Το λογισμικό και το υλικό τρίτων διέπονται από τις δικές τους άδειες.")],
      },
    ],
  },
  privacy: {
    title: copy("Privacy", "Απόρρητο"),
    summary: copy("StudyApp is local-first and sends no study content automatically.", "Το StudyApp είναι local-first και δεν αποστέλλει αυτόματα υλικό μελέτης."),
    lastUpdated: copy("31 July 2026", "31 Ιουλίου 2026"),
    sections: [
      {
        heading: copy("Local data", "Τοπικά δεδομένα"),
        paragraphs: [
          copy("Progress, settings, chapters, flashcards, links and local files are stored locally in this browser and device. Available storage depends on the browser and device.", "Η πρόοδος, οι ρυθμίσεις, τα κεφάλαια, οι κάρτες, οι σύνδεσμοι και τα τοπικά αρχεία αποθηκεύονται τοπικά σε αυτόν τον browser και τη συσκευή. Ο διαθέσιμος χώρος εξαρτάται από τον browser και τη συσκευή."),
          copy("Data can be lost if site data is cleared or the browser or device fails. StudyApp is not permanent storage or a complete backup service. Keep original files and required copies outside StudyApp. The JSON backup does not include uploaded or generated file copies.", "Τα δεδομένα μπορεί να χαθούν αν διαγραφούν τα δεδομένα ιστοτόπου ή αν παρουσιαστεί βλάβη στον browser ή στη συσκευή. Το StudyApp δεν είναι υπηρεσία μόνιμης αποθήκευσης ούτε πλήρης υπηρεσία backup. Κράτησε τα πρωτότυπα αρχεία και τα απαραίτητα αντίγραφα εκτός StudyApp. Το JSON backup δεν περιλαμβάνει αρχεία που προστέθηκαν ή δημιουργήθηκαν."),
        ],
      },
      {
        heading: copy("AI Assistant", "Βοηθός AI"),
        paragraphs: [
          copy("ChatGPT Companion provides a normal external link to the dedicated StudyApp AI Assistant in ChatGPT. StudyApp does not read, copy or send your library or study material for this handoff.", "Το ChatGPT Companion παρέχει έναν κανονικό εξωτερικό σύνδεσμο προς τον ειδικό Βοηθό AI του StudyApp στο ChatGPT. Το StudyApp δεν διαβάζει, δεν αντιγράφει και δεν στέλνει τη βιβλιοθήκη ή το υλικό μελέτης σου για αυτή τη μετάβαση."),
          copy("StudyApp AI and ChatGPT App are not active yet.", "Το StudyApp AI και το ChatGPT App δεν είναι ακόμη ενεργά."),
          copy("No paid AI request or charge is currently available.", "Δεν είναι ακόμη διαθέσιμη επί πληρωμή κλήση AI ή χρέωση."),
        ],
      },
      {
        heading: copy("External links", "Εξωτερικοί σύνδεσμοι"),
        paragraphs: [copy("External services apply their own privacy and sharing rules.", "Οι εξωτερικές υπηρεσίες εφαρμόζουν τους δικούς τους κανόνες απορρήτου και κοινοποίησης.")],
      },
    ],
  },
  analytics: {
    title: copy("Analytics choices", "Αναλυτικά στοιχεία"),
    summary: copy("StudyApp does not include its own analytics or advertising system.", "Το StudyApp δεν περιλαμβάνει δικό του σύστημα analytics ή διαφημίσεων."),
    lastUpdated: copy("30 July 2026", "30 Ιουλίου 2026"),
    sections: [
      {
        heading: copy("Current behaviour", "Τρέχουσα λειτουργία"),
        paragraphs: [copy("The application does not install a first-party analytics tracker.", "Η εφαρμογή δεν εγκαθιστά tracker analytics πρώτου μέρους.")],
      },
    ],
  },
  copyright: {
    title: copy("Copyright protected", "Πνευματικά δικαιώματα"),
    summary: copy("The original project work is protected.", "Το πρωτότυπο έργο προστατεύεται."),
    lastUpdated: copy("30 July 2026", "30 Ιουλίου 2026"),
    sections: [
      {
        heading: copy("Protected material", "Προστατευόμενο υλικό"),
        paragraphs: [copy("The source code, interface, documentation and original content are protected.", "Ο πηγαίος κώδικας, η διεπαφή, η τεκμηρίωση και το πρωτότυπο περιεχόμενο προστατεύονται.")],
      },
      {
        heading: copy("User-added material", "Υλικό χρήστη"),
        paragraphs: [copy("Users are responsible for having permission to use material they add.", "Οι χρήστες είναι υπεύθυνοι για το δικαίωμα χρήσης του υλικού που προσθέτουν.")],
      },
    ],
  },
} as const satisfies Record<string, LegalPageContent>;
