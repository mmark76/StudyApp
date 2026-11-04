import { describe, expect, it } from "vitest";
import { findStudyAppLocalWindowsZip, findVersionedZip } from "../src/shared/components/StudyAppReleaseZipLinks";

const zipUrl = "https://github.com/mmark76/StudyApp/releases/download/v1.1.0/StudyApp-v1.1.0.zip";
const valid = {
  tag_name: "v1.1.0", draft: false, prerelease: false,
  assets: [{ name: "StudyApp-v1.1.0.zip", browser_download_url: zipUrl }],
};

describe("StudyApp versioned ZIP selection", () => {
  it("returns only the official versioned ZIP", () => {
    expect(findVersionedZip(valid)).toEqual({ tag: "v1.1.0", url: zipUrl });
    const stableUrl = "https://github.com/mmark76/StudyApp/releases/download/v1.1.0/StudyApp-Stable-v1.1.0.zip";
    expect(findVersionedZip({ ...valid, assets: [{ name: "StudyApp-Stable-v1.1.0.zip", browser_download_url: stableUrl }] }))
      .toEqual({ tag: "v1.1.0", url: stableUrl });
  });
  it("rejects source ZIP, missing assets, drafts and pre-releases", () => {
    expect(findVersionedZip({ ...valid, assets: [{ name: "main.zip", browser_download_url: "https://github.com/mmark76/StudyApp/archive/refs/heads/main.zip" }] })).toBeNull();
    expect(findVersionedZip({ ...valid, assets: [] })).toBeNull();
    expect(findVersionedZip({ ...valid, draft: true })).toBeNull();
    expect(findVersionedZip({ ...valid, prerelease: true })).toBeNull();
    expect(findVersionedZip({ ...valid, tag_name: "main" })).toBeNull();
  });

  it("selects only the separate verified Windows Local package", () => {
    const localUrl = "https://github.com/mmark76/StudyApp/releases/download/v1.1.0/StudyApp-Local-Windows-v1.1.0.zip";
    const localRelease = {
      ...valid,
      assets: [
        ...valid.assets,
        { name: "StudyApp-Local-Windows-v1.1.0.zip", browser_download_url: localUrl },
      ],
    };

    expect(findStudyAppLocalWindowsZip(localRelease)).toEqual({ tag: "v1.1.0", url: localUrl });
    const stableLocalUrl = "https://github.com/mmark76/StudyApp/releases/download/v1.1.0/StudyApp-Local-Windows-Stable-v1.1.0.zip";
    expect(findStudyAppLocalWindowsZip({
      ...valid,
      assets: [{ name: "StudyApp-Local-Windows-Stable-v1.1.0.zip", browser_download_url: stableLocalUrl }],
    })).toEqual({ tag: "v1.1.0", url: stableLocalUrl });
    expect(findStudyAppLocalWindowsZip(valid)).toBeNull();
  });
});
