import { describe, expect, it } from "vitest";
import { getOfficialZipRelease } from "../src/features/workspace-beta/WorkspaceReleaseArchive";

describe("Workspace release archive", () => {
  it("lists only an official named ZIP asset from a public release", () => {
    expect(getOfficialZipRelease({
      tag_name: "v1.5.5",
      target_commitish: "1234567890abcdef",
      draft: false,
      prerelease: false,
      assets: [{
        name: "StudyApp-Local-Windows-v1.5.5.zip",
        browser_download_url: "https://github.com/mmark76/StudyApp/releases/download/v1.5.5/StudyApp-Local-Windows-v1.5.5.zip",
      }],
    })).toEqual({
      tag: "v1.5.5",
      commit: "1234567",
      zipUrl: "https://github.com/mmark76/StudyApp/releases/download/v1.5.5/StudyApp-Local-Windows-v1.5.5.zip",
    });
  });

  it("rejects draft, prerelease and non-official ZIP links", () => {
    const release = {
      tag_name: "v1.5.5",
      target_commitish: "1234567890abcdef",
      assets: [{
        name: "StudyApp-Local-Windows-v1.5.5.zip",
        browser_download_url: "https://example.invalid/StudyApp-Local-Windows-v1.5.5.zip",
      }],
    };
    expect(getOfficialZipRelease({ ...release, draft: true, prerelease: false })).toBeNull();
    expect(getOfficialZipRelease({ ...release, draft: false, prerelease: true })).toBeNull();
    expect(getOfficialZipRelease({ ...release, draft: false, prerelease: false })).toBeNull();
  });
});
