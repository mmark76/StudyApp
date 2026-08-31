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
    summary: copy("StudyApp is local-first. Limited traffic measurement never includes study content.", "Το StudyApp είναι local-first. Η περιορισμένη μέτρηση επισκεψιμότητας δεν περιλαμβάνει ποτέ υλικό μελέτης."),
    lastUpdated: copy("22 August 2026", "22 Αυγούστου 2026"),
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
          copy("StudyApp AI Assistant provides a normal external link to the dedicated Custom GPT. You provide study material directly in ChatGPT; StudyApp does not read, copy or send your library or study material for this handoff.", "Ο Βοηθός AI του StudyApp παρέχει έναν κανονικό εξωτερικό σύνδεσμο προς το ειδικό Custom GPT. Προσθέτεις το υλικό μελέτης απευθείας στο ChatGPT· το StudyApp δεν διαβάζει, δεν αντιγράφει και δεν στέλνει τη βιβλιοθήκη ή το υλικό μελέτης σου για αυτή τη μετάβαση."),
          copy("Files created in ChatGPT must be downloaded to your device and added or imported into StudyApp manually. StudyApp does not receive or discover those files automatically.", "Τα αρχεία που δημιουργούνται στο ChatGPT πρέπει να κατεβαίνουν στη συσκευή σου και να προστίθενται ή να εισάγονται χειροκίνητα στο StudyApp. Το StudyApp δεν λαμβάνει ούτε εντοπίζει αυτά τα αρχεία αυτόματα."),
          copy("The AI options comparison page is informational only. Opening it does not read study data, contact ChatGPT or activate a remote AI service.", "Η σελίδα σύγκρισης επιλογών AI είναι μόνο ενημερωτική. Το άνοιγμά της δεν διαβάζει δεδομένα μελέτης, δεν επικοινωνεί με το ChatGPT και δεν ενεργοποιεί απομακρυσμένη υπηρεσία AI."),
          copy("StudyApp AI and ChatGPT App are not active yet.", "Το StudyApp AI και το ChatGPT App δεν είναι ακόμη ενεργά."),
          copy("No paid AI request or charge is currently available.", "Δεν είναι ακόμη διαθέσιμη επί πληρωμή κλήση AI ή χρέωση."),
        ],
      },
      {
        heading: copy("External links", "Εξωτερικοί σύνδεσμοι"),
        paragraphs: [copy("External services apply their own privacy and sharing rules.", "Οι εξωτερικές υπηρεσίες εφαρμόζουν τους δικούς τους κανόνες απορρήτου και κοινοποίησης.")],
      },
      {
        heading: copy("Traffic measurement", "Μέτρηση επισκεψιμότητας"),
        paragraphs: [
          copy("StudyApp uses Plausible Analytics for aggregate, cookieless traffic measurement. It receives a controlled page route, referral or campaign source, browser, operating system, device type and approximate location. Plausible derives a daily identifier from the IP address and user agent, rotates it every 24 hours and does not store the raw IP address.", "Το StudyApp χρησιμοποιεί το Plausible Analytics για συγκεντρωτική μέτρηση επισκεψιμότητας χωρίς cookies. Λαμβάνει μια ελεγχόμενη διαδρομή σελίδας, την πηγή παραπομπής ή καμπάνιας, τον browser, το λειτουργικό σύστημα, τον τύπο συσκευής και κατά προσέγγιση τοποθεσία. Το Plausible παράγει ένα ημερήσιο αναγνωριστικό από τη διεύθυνση IP και το user agent, το ανανεώνει κάθε 24 ώρες και δεν αποθηκεύει την αρχική διεύθυνση IP."),
          copy("Google Analytics is optional and loads only after consent on the current browser. It measures page views, sessions, traffic source, general device and location information and engagement time. Google advertising signals and automatic enhanced measurements are disabled.", "Το Google Analytics είναι προαιρετικό και φορτώνεται μόνο μετά από συγκατάθεση στον συγκεκριμένο browser. Μετρά προβολές σελίδων, συνεδρίες, πηγή επισκεψιμότητας, γενικές πληροφορίες συσκευής και τοποθεσίας και χρόνο αλληλεπίδρασης. Τα διαφημιστικά σήματα της Google και οι αυτόματες ενισχυμένες μετρήσεις είναι απενεργοποιημένα."),
          copy("Neither analytics service receives study material, IndexedDB content, flashcards, form entries, searches, local file names, uploads, downloads or click events. Analytics configuration values are public identifiers, not access credentials.", "Καμία υπηρεσία analytics δεν λαμβάνει υλικό μελέτης, περιεχόμενο IndexedDB, κάρτες, στοιχεία φορμών, αναζητήσεις, ονόματα τοπικών αρχείων, μεταφορτώσεις, λήψεις ή συμβάντα κλικ. Οι τιμές ρύθμισης analytics είναι δημόσια αναγνωριστικά και όχι διαπιστευτήρια πρόσβασης."),
        ],
      },
    ],
  },
  analytics: {
    title: copy("Analytics choices", "Αναλυτικά στοιχεία"),
    summary: copy("StudyApp uses minimal traffic measurement without recording study activity or content.", "Το StudyApp χρησιμοποιεί ελάχιστη μέτρηση επισκεψιμότητας χωρίς να καταγράφει δραστηριότητα ή περιεχόμενο μελέτης."),
    lastUpdated: copy("22 August 2026", "22 Αυγούστου 2026"),
    sections: [
      {
        heading: copy("Plausible Analytics", "Plausible Analytics"),
        paragraphs: [
          copy("Plausible provides the primary aggregate view of human traffic. It runs without analytics cookies or persistent identifiers and automatically filters known bots, crawlers, data-centre traffic and referrer spam. No bot filter is perfect and some privacy tools may block measurement.", "Το Plausible παρέχει την κύρια συγκεντρωτική εικόνα της ανθρώπινης επισκεψιμότητας. Λειτουργεί χωρίς cookies analytics ή μόνιμα αναγνωριστικά και φιλτράρει αυτόματα γνωστά bots, crawlers, κίνηση από data centres και referrer spam. Κανένα φίλτρο bots δεν είναι τέλειο και ορισμένα εργαλεία απορρήτου μπορεί να εμποδίζουν τη μέτρηση."),
          copy("The Plausible measurement is independent of the Google Analytics cookie choice. You can exclude this browser from all analytics below.", "Η μέτρηση του Plausible είναι ανεξάρτητη από την επιλογή cookies του Google Analytics. Μπορείς παρακάτω να εξαιρέσεις αυτόν τον browser από όλα τα analytics."),
        ],
      },
      {
        heading: copy("Optional Google Analytics", "Προαιρετικό Google Analytics"),
        paragraphs: [
          copy("Google Analytics does not load until you select Allow Google Analytics. If you block it or make no choice, no Google Analytics request or analytics cookie is created by StudyApp.", "Το Google Analytics δεν φορτώνεται πριν επιλέξεις Αποδοχή Google Analytics. Αν το αποκλείσεις ή δεν κάνεις επιλογή, το StudyApp δεν δημιουργεί αίτημα Google Analytics ή cookie analytics."),
          copy("Enhanced Measurement is off. StudyApp does not configure automatic outbound-click, download, form, search, scroll or video events. Advertising storage, advertising user data, advertising personalisation and Google Signals remain disabled.", "Το Enhanced Measurement είναι κλειστό. Το StudyApp δεν ρυθμίζει αυτόματα συμβάντα εξωτερικών κλικ, λήψεων, φορμών, αναζητήσεων, κύλισης ή βίντεο. Η αποθήκευση για διαφημίσεις, τα διαφημιστικά δεδομένα χρήστη, η εξατομίκευση διαφημίσεων και τα Google Signals παραμένουν απενεργοποιημένα."),
        ],
      },
      {
        heading: copy("What is measured", "Τι μετράται"),
        paragraphs: [
          copy("Measurements are limited to visits, safe StudyApp route names, referral and approved campaign source, general browser, operating system and device category, approximate location and engagement duration. Moving between StudyApp areas may create additional page views, but not additional visits or click events.", "Οι μετρήσεις περιορίζονται σε επισκέψεις, ασφαλή ονόματα διαδρομών του StudyApp, πηγή παραπομπής και εγκεκριμένης καμπάνιας, γενική κατηγορία browser, λειτουργικού συστήματος και συσκευής, κατά προσέγγιση τοποθεσία και διάρκεια αλληλεπίδρασης. Η μετάβαση μεταξύ περιοχών του StudyApp μπορεί να δημιουργεί πρόσθετες προβολές σελίδων, αλλά όχι πρόσθετες επισκέψεις ή συμβάντα κλικ."),
          copy("The two dashboards use different methods and must not be added together. Plausible is the broad traffic view; Google Analytics is the consented subset.", "Τα δύο dashboards χρησιμοποιούν διαφορετικές μεθόδους και δεν πρέπει να αθροίζονται. Το Plausible είναι η ευρεία εικόνα επισκεψιμότητας· το Google Analytics είναι το υποσύνολο που έχει δώσει συγκατάθεση."),
        ],
      },
      {
        heading: copy("Your controls", "Οι επιλογές σου"),
        paragraphs: [
          copy("The controls below are stored only in this browser. Blocking Google Analytics removes its StudyApp cookies where the browser permits. Excluding this device prevents future Plausible and Google Analytics measurements from this browser; repeat the choice on every browser or device you use.", "Οι παρακάτω επιλογές αποθηκεύονται μόνο σε αυτόν τον browser. Ο αποκλεισμός του Google Analytics αφαιρεί τα cookies του για το StudyApp όπου το επιτρέπει ο browser. Η εξαίρεση αυτής της συσκευής εμποδίζει μελλοντικές μετρήσεις Plausible και Google Analytics από αυτόν τον browser· επανάλαβε την επιλογή σε κάθε browser ή συσκευή που χρησιμοποιείς."),
        ],
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
