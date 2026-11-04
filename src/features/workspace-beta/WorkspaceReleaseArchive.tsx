import { useEffect, useState } from "react";
import { useLanguage } from "../../i18n/LanguageContext";

const releasesApi = "https://api.github.com/repos/mmark76/StudyApp/releases?per_page=100";

interface ReleaseArchiveItem {
  tag: string;
  commit: string | null;
  zipUrl: string;
}

export function getOfficialZipRelease(value: unknown): ReleaseArchiveItem | null {
  if (!value || typeof value !== "object") return null;
  const release = value as Record<string, unknown>;
  const tag = release.tag_name;
  if (typeof tag !== "string" || !/^v\d+\.\d+\.\d+$/.test(tag)) return null;
  const assets = release.assets;
  if (release.draft === true || release.prerelease === true || !Array.isArray(assets)) return null;

  const filenames = [
    `StudyApp-Local-Windows-${tag}.zip`,
    `StudyApp-${tag}.zip`,
  ];
  const filename = filenames.find((candidate) => assets.some((asset: unknown) => {
    if (!asset || typeof asset !== "object") return false;
    const fields = asset as Record<string, unknown>;
    return fields.name === candidate
      && fields.browser_download_url === `https://github.com/mmark76/StudyApp/releases/download/${tag}/${candidate}`;
  }));
  if (!filename) return null;

  const targetCommitish = release.target_commitish;
  return {
    tag,
    commit: typeof targetCommitish === "string" && /^[0-9a-f]{7,40}$/iu.test(targetCommitish)
      ? targetCommitish.slice(0, 7)
      : null,
    zipUrl: `https://github.com/mmark76/StudyApp/releases/download/${tag}/${filename}`,
  };
}

export function WorkspaceReleaseArchive() {
  const { text } = useLanguage();
  const [releases, setReleases] = useState<ReleaseArchiveItem[] | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    async function loadReleases() {
      try {
        const response = await fetch(releasesApi, {
          signal: controller.signal,
          headers: { Accept: "application/vnd.github+json" },
        });
        if (!response.ok) throw new Error("GitHub releases are unavailable");
        const payload: unknown = await response.json();
        if (!Array.isArray(payload)) throw new Error("Invalid GitHub releases response");
        const officialReleases = payload
          .map(getOfficialZipRelease)
          .filter((release): release is ReleaseArchiveItem => release !== null);
        if (!controller.signal.aborted) setReleases(officialReleases);
      } catch {
        if (!controller.signal.aborted) setUnavailable(true);
      }
    }
    void loadReleases();
    return () => controller.abort();
  }, []);

  return (
    <div className="workspace-beta-release-archive-content">
      <p>{text(
        "Official GitHub ZIP releases. This list refreshes when you open it.",
        "Επίσημες εκδόσεις ZIP στο GitHub. Η λίστα ανανεώνεται όταν την ανοίγεις.",
      )}</p>
      {releases === null && !unavailable ? <p aria-live="polite">{text("Loading releases…", "Φόρτωση εκδόσεων…")}</p> : null}
      {unavailable ? <p aria-live="polite">{text("GitHub releases are temporarily unavailable.", "Οι εκδόσεις GitHub δεν είναι προσωρινά διαθέσιμες.")}</p> : null}
      {releases?.length === 0 ? <p>{text("No official ZIP releases are available yet.", "Δεν υπάρχουν ακόμη επίσημες εκδόσεις ZIP.")}</p> : null}
      {releases && releases.length > 0 ? (
        <ul aria-label={text("Official ZIP releases", "Επίσημες εκδόσεις ZIP")}>
          {releases.map((release) => (
            <li key={release.tag}>
              <a href={release.zipUrl} rel="noopener noreferrer" target="_blank">{release.tag}</a>
              {release.commit ? <code>{release.commit}</code> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
