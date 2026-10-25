import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("StudyApp Local Windows launcher", () => {
  it("accepts only the fixed protocol request and reuses the guarded local-server lifecycle", () => {
    const installLauncher = readFileSync("Install StudyApp Local Launcher.bat", "utf8");
    const uninstallLauncher = readFileSync("Uninstall StudyApp Local Launcher.bat", "utf8");
    const installer = readFileSync("local-companion/install-studyapp-local-launcher.ps1", "utf8");
    const uninstaller = readFileSync("local-companion/uninstall-studyapp-local-launcher.ps1", "utf8");
    const handler = readFileSync("local-companion/studyapp-local-protocol.ps1", "utf8");
    const server = readFileSync("local-companion/server.py", "utf8");

    expect(installLauncher).not.toContain("-InstallRoot");
    expect(uninstallLauncher).not.toContain("-InstallRoot");
    expect(installer).toContain('Join-Path $PSScriptRoot ".."');
    expect(uninstaller).toContain('Join-Path $PSScriptRoot ".."');
    expect(installer).not.toContain("Resolve-Path -LiteralPath $InstallRoot");
    expect(uninstaller).not.toContain("Resolve-Path -LiteralPath $InstallRoot");
    expect(installer).toContain("HKCU:\\Software\\Classes\\studyapp-local");
    expect(installer).toContain("StudyAppInstallRoot");
    expect(uninstaller).toContain("registered StudyApp Local Launcher belongs to a different extracted package");
    expect(handler).toContain('$uri.Scheme -ne "studyapp-local"');
    expect(handler).toContain('$uri.Host -ne "open"');
    expect(handler).toContain('$uri.UserInfo');
    expect(handler).toContain('$uri.Fragment');
    expect(handler).toContain('"stop-studyapp-local.ps1"');
    expect(handler).toContain("$LASTEXITCODE -ne 0");
    expect(handler).toContain('"http://127.0.0.1:8766/#/workspace-beta"');
    expect(server).toContain('os.environ.get("STUDYAPP_LOCAL_SUPPRESS_BROWSER") != "1"');
  });
});
