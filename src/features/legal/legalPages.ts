export type LegalPageContent = {
  title: string;
  summary: string;
  lastUpdated: string;
  sections: readonly { heading: string; paragraphs: readonly string[] }[];
};

export const legalPages = {
  license: {
    title: "License",
    summary: "This project is publicly visible but is not open source.",
    lastUpdated: "25 June 2026",
    sections: [
      { heading: "All Rights Reserved", paragraphs: ["Copyright © 2026 Markellos Markides. All rights reserved.", "No permission is granted to copy, modify, distribute, rehost, sublicense, sell, or otherwise reuse the project without prior written permission."] },
      { heading: "Third-party material", paragraphs: ["Third-party software and materials remain subject to their respective licences and rights."] }
    ]
  },
  privacy: {
    title: "Privacy",
    summary: "The application is designed as a local-first study tool.",
    lastUpdated: "1 July 2026",
    sections: [
      { heading: "Local data", paragraphs: ["Study progress, preferences, user-added content, and saved links are stored locally in the browser. The application does not require an account."] },
      { heading: "PDFs from your device", paragraphs: ["PDFs added from your device stay inside this browser on this device. The application does not upload or sync them.", "Local PDFs are not included when you save a copy of your study progress. Clearing browser data may permanently remove them."] },
      { heading: "Cloud links", paragraphs: ["Cloud files remain with the service chosen by the user, such as Google Drive, OneDrive, or Dropbox. Access and sharing permissions are controlled through that service."] },
      { heading: "Hosting", paragraphs: ["GitHub Pages and network providers may process technical request information under their own policies."] }
    ]
  },
  analytics: {
    title: "Analytics choices",
    summary: "The application does not include its own analytics preference or advertising system.",
    lastUpdated: "25 June 2026",
    sections: [{ heading: "Current behaviour", paragraphs: ["The application does not install a first-party analytics tracker. Infrastructure providers may still produce operational statistics."] }]
  },
  copyright: {
    title: "Copyright protected",
    summary: "The project's original work is protected under an All Rights Reserved position.",
    lastUpdated: "25 June 2026",
    sections: [
      { heading: "Protected material", paragraphs: ["The original source code, interface, documentation, and educational content are protected. Public visibility is not permission for reuse."] },
      { heading: "User-added material", paragraphs: ["Books, notes, PDFs, links, and other materials added by a user remain subject to their original copyright and licence terms. Users are responsible for having permission to use them."] }
    ]
  }
} as const satisfies Record<string, LegalPageContent>;
