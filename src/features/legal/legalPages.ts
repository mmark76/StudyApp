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
    summary: "StudyApp remains local-first and does not upload study content during its Cloud Core availability check.",
    lastUpdated: "29 July 2026",
    sections: [
      { heading: "Local data", paragraphs: ["Study progress, preferences, user-provided chapters and flashcards, saved links, and local study files are stored locally in this browser. The application has no account system or cloud sync and does not generate study content automatically.", "Browser data can be lost if site data is cleared, the browser or application is removed, the browser profile or device changes, or local storage fails. Keep original files and needed copies outside StudyApp."] },
      { heading: "Cloud Core connection", paragraphs: ["The Settings page can check whether Markellos Cloud Core is available. This operational request sends no study material, progress, local files, saved links, or settings.", "Future remote features must identify exactly what will be sent and require an intentional user action before study content leaves the browser."] },
      { heading: "Files from your device", paragraphs: ["Adding a file imports a copy into this browser on this device. The application does not upload or sync the file to a server.", "The progress/settings JSON backup does not include uploaded or generated file blobs. Split PDFs remain locally stored until removed and can be downloaded when a copy is needed outside StudyApp."] },
      { heading: "External links", paragraphs: ["For a saved link, StudyApp stores the generated display name, classification, and URL. The linked file remains with the external service chosen by the user; its access and sharing permissions are controlled through that service."] },
      { heading: "Hosting", paragraphs: ["GitHub Pages, Markellos Cloud Core, and network providers may process technical request information under their own policies."] }
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
      { heading: "User-added material", paragraphs: ["Books, notes, PDFs, documents, links, images, and other materials added by a user remain subject to their original copyright and licence terms. Users are responsible for having permission to use them."] }
    ]
  }
} as const satisfies Record<string, LegalPageContent>;
