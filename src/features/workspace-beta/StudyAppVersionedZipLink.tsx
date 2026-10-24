import { useEffect, useState } from "react";
import { useLanguage } from "../../i18n/LanguageContext";

export const latestStudyAppReleaseApi = "https://api.github.com/repos/mmark76/StudyApp/releases/latest";

interface ReleaseZip {
  tag: string;
  url: string;
}

/** Never display source-branch ZIPs or untrusted URLs as a release download. */
export function findVersionedZip(value: unknown): ReleaseZip | null {
  if (!value || typeof value !== "object") return null;
  const release = value as Record<string, unknown>;
  const tag = release.tag_name;
  if (typeof tag !== "string" || !/^v\d+\.\d+\.\d+$/.test(tag)) return null;
  if (release.draft === true || release.prerelease === true || !Array.isArray(release.assets)) return null;
  const filename = `StudyApp-${tag}.zip`;
  const expectedUrl = `https://github.com/mmark76/StudyApp/releases/download/${tag}/${filename}`;
  const asset = release.assets.find((candidate: unknown) => {
    if (!candidate || typeof candidate !== "object") return false;
    const fields = candidate as Record<string, unknown>;
    return fields.name === filename && fields.browser_download_url === expectedUrl;
  });
  return asset ? { tag, url: expectedUrl } : null;
}

export function StudyAppVersionedZipLink({ onClick }: { onClick?: () => void }) {
  const { text } = useLanguage();
  const [release, setRelease] = useState<ReleaseZip | null>(null);
  const [state, setState] = useState<"checking" | "available" | "unavailable">("checking");

  useEffect(() => {
    const controller = new AbortController();
    async function checkRelease() {
      try {
        const response = await fetch(latestStudyAppReleaseApi, {
          signal: controller.signal,
          headers: { Accept: "application/vnd.github+json" },
        });
        if (!response.ok) throw new Error("No current release");
        const zip = findVersionedZip(await response.json());
        if (!controller.signal.aborted) {
          setRelease(zip);
          setState(zip ? "available" : "unavailable");
        }
      } catch {
        if (!controller.signal.aborted) setState("unavailable");
      }
    }
    void checkRelease();
    return () => controller.abort();
  }, []);

  if (release && state === "available") {
    return (
      <a href={release.url} onClick={onClick} rel="noopener noreferrer" target="_blank"
        title={text(`Download verified StudyApp ZIP ${release.tag}`, `Λήψη επίσημου ZIP StudyApp ${release.tag}`)}>
        {text(`Download Versioned ZIP (${release.tag})`, `Λήψη ZIP έκδοσης (${release.tag})`)}
      </a>
    );
  }

  return (
    <span aria-live="polite" title={text(
      state === "checking" ? "Checking GitHub Releases" : "No official versioned ZIP has been published or the release is temporarily unreachable",
      state === "checking" ? "Έλεγχος εκδόσεων GitHub" : "Δεν υπάρχει ακόμη επίσημο ZIP ή δεν είναι προσωρινά προσβάσιμο",
    )}>
      {state === "checking"
        ? text("Checking release ZIP…", "Έλεγχος ZIP έκδοσης…")
        : text("Versioned ZIP not available yet", "Το ZIP έκδοσης δεν είναι ακόμη διαθέσιμο")}
    </span>
  );
}
