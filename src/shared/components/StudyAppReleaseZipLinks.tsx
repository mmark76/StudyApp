import { useEffect, useState } from "react";
import { useLanguage } from "../../i18n/LanguageContext";

export const latestStudyAppReleaseApi = "https://api.github.com/repos/mmark76/StudyApp/releases/latest";
const stableStudyAppReleaseApi = "https://api.github.com/repos/mmark76/StudyApp/releases/tags/v1.1.5";

interface ReleaseZip {
  tag: string;
  url: string;
}

function findOfficialReleaseAsset(value: unknown, filenameForTag: (tag: string) => string): ReleaseZip | null {
  if (!value || typeof value !== "object") return null;
  const release = value as Record<string, unknown>;
  const tag = release.tag_name;
  if (typeof tag !== "string" || !/^v\d+\.\d+\.\d+$/.test(tag)) return null;
  if (release.draft === true || release.prerelease === true || !Array.isArray(release.assets)) return null;
  const filename = filenameForTag(tag);
  const expectedUrl = `https://github.com/mmark76/StudyApp/releases/download/${tag}/${filename}`;
  const asset = release.assets.find((candidate: unknown) => {
    if (!candidate || typeof candidate !== "object") return false;
    const fields = candidate as Record<string, unknown>;
    return fields.name === filename && fields.browser_download_url === expectedUrl;
  });
  return asset ? { tag, url: expectedUrl } : null;
}

/** Never display source-branch ZIPs or untrusted URLs as a release download. */
export function findVersionedZip(value: unknown): ReleaseZip | null {
  return findOfficialReleaseAsset(value, (tag) => `StudyApp-${tag}.zip`);
}

/** The Windows Local package is a separate, explicitly named release asset. */
export function findStudyAppLocalWindowsZip(value: unknown): ReleaseZip | null {
  return findOfficialReleaseAsset(value, (tag) => `StudyApp-Local-Windows-${tag}.zip`);
}

function VersionedReleaseZipLink({
  findAsset,
  onClick,
  label,
  unavailableLabel,
  className,
  releaseApi = latestStudyAppReleaseApi,
}: {
  findAsset: (value: unknown) => ReleaseZip | null;
  onClick?: () => void;
  label: (tag: string) => string;
  unavailableLabel: string;
  className?: string;
  releaseApi?: string;
}) {
  const { text } = useLanguage();
  const [release, setRelease] = useState<ReleaseZip | null>(null);
  const [state, setState] = useState<"checking" | "available" | "unavailable">("checking");

  useEffect(() => {
    const controller = new AbortController();
    async function checkRelease() {
      try {
        const response = await fetch(releaseApi, {
          signal: controller.signal,
          headers: { Accept: "application/vnd.github+json" },
        });
        if (!response.ok) throw new Error("No current release");
        const zip = findAsset(await response.json());
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
  }, [findAsset, releaseApi]);

  if (release && state === "available") {
    return (
      <a className={className} href={release.url} onClick={onClick} rel="noopener noreferrer" target="_blank"
        title={text(`Download verified StudyApp ZIP ${release.tag}`, `Λήψη επίσημου ZIP StudyApp ${release.tag}`)}>
        {label(release.tag)}
      </a>
    );
  }

  return (
    <span aria-live="polite" className={className} title={text(
      state === "checking" ? "Checking GitHub Releases" : "No official versioned ZIP has been published or the release is temporarily unreachable",
      state === "checking" ? "Έλεγχος εκδόσεων GitHub" : "Δεν υπάρχει ακόμη επίσημο ZIP ή δεν είναι προσωρινά προσβάσιμο",
    )}>
      {state === "checking"
        ? text("Checking release ZIP…", "Έλεγχος ZIP έκδοσης…")
        : unavailableLabel}
    </span>
  );
}

export function StudyAppVersionedZipLink({ onClick }: { onClick?: () => void }) {
  const { text } = useLanguage();
  return (
    <VersionedReleaseZipLink
      findAsset={findVersionedZip}
      onClick={onClick}
      label={(tag) => text(`Download Versioned ZIP (${tag})`, `Λήψη ZIP έκδοσης (${tag})`)}
      unavailableLabel={text("Versioned ZIP not available yet", "Το ZIP έκδοσης δεν είναι ακόμη διαθέσιμο")}
    />
  );
}

/** The user-confirmed working Windows release remains available beside latest. */
export function StudyAppStableLocalWindowsZipLink({ className }: { className?: string }) {
  const { text } = useLanguage();
  return (
    <VersionedReleaseZipLink
      findAsset={findStudyAppLocalWindowsZip}
      releaseApi={stableStudyAppReleaseApi}
      className={className}
      label={() => text("Download working v1.1.5", "Λήψη λειτουργικής v1.1.5")}
      unavailableLabel={text("v1.1.5 download unavailable", "Η λήψη v1.1.5 δεν είναι διαθέσιμη")}
    />
  );
}

export function StudyAppLocalWindowsZipLink({
  onClick,
  className,
  compact = false,
}: {
  onClick?: () => void;
  className?: string;
  compact?: boolean;
}) {
  const { text } = useLanguage();
  return (
    <>
    <StudyAppStableLocalWindowsZipLink className={className} />
    <VersionedReleaseZipLink
      findAsset={findStudyAppLocalWindowsZip}
      onClick={onClick}
      className={className}
      label={(tag) => compact
        ? text(`Download ${tag} ↓`, `Λήψη ${tag} ↓`)
        : text(`Download StudyApp Local (${tag})`, `Λήψη StudyApp Local (${tag})`)}
      unavailableLabel={compact
        ? text("Download not available yet", "Η λήψη δεν είναι ακόμη διαθέσιμη")
        : text("StudyApp Local download not available yet", "Το StudyApp Local δεν είναι ακόμη διαθέσιμο για λήψη")}
    />
    </>
  );
}
