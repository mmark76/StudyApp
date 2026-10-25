import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("StudyApp Local release package", () => {
  it("keeps local packaging in the verified CI and release paths", () => {
    const packageScript = readFileSync("scripts/prepare-studyapp-local-package.mjs", "utf8");
    const ciWorkflow = readFileSync(".github/workflows/ci.yml", "utf8");
    const releaseWorkflow = readFileSync(".github/workflows/release.yml", "utf8");

    expect(packageScript).toContain(".chatgpt-plan-venv");
    expect(packageScript).toContain("Start StudyApp Local.bat");
    expect(packageScript).toContain("Stop StudyApp Local.bat");
    expect(packageScript).toContain("Install StudyApp Local Launcher.bat");
    expect(packageScript).toContain("Uninstall StudyApp Local Launcher.bat");
    expect(packageScript).toContain("studyapp-local-protocol.ps1");
    expect(packageScript).toContain('name !== "Start-StudyApp-Local.bat"');
    expect(ciWorkflow).toContain("Verify StudyApp Local package");
    expect(ciWorkflow).toContain("Install StudyApp Local Launcher.bat");
    expect(releaseWorkflow).toContain("StudyApp-Local-Windows-v$RELEASE_VERSION.zip");
  });
});
