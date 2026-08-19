import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function readRepositoryFile(path: string): string {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

describe("release safety configuration", () => {
  it("runs every required check in CI before allowing the production deployment path", () => {
    const ciWorkflow = readRepositoryFile(".github/workflows/ci.yml");
    const deployWorkflow = readRepositoryFile(".github/workflows/deploy-pages.yml");
    const requiredChecks = [
      "npm ci",
      "npm run typecheck",
      "npm test",
      "npm run test:e2e",
      "npm run build",
    ];
    const positions = requiredChecks.map((command) => ciWorkflow.indexOf(command));

    expect(ciWorkflow).toContain("pull_request:");
    expect(ciWorkflow).toContain("container:");
    expect(ciWorkflow).toContain("mcr.microsoft.com/playwright:v1.62.1-noble");
    expect(ciWorkflow).not.toContain("playwright install");
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((first, second) => first - second));
    expect(ciWorkflow).not.toMatch(/run: npm install\s/u);
    expect(ciWorkflow).not.toMatch(/uses: [^\s]+@v\d/u);

    expect(deployWorkflow).toContain("branches: [main]");
    expect(deployWorkflow).toContain("npm ci");
    expect(deployWorkflow).toContain("npm run build");
    expect(deployWorkflow).not.toContain("npm run typecheck");
    expect(deployWorkflow).not.toContain("npm test");
    expect(deployWorkflow).not.toContain("playwright install");
    expect(deployWorkflow).not.toContain("npm run test:e2e");
    expect(deployWorkflow).not.toMatch(/run: npm install\s/u);
    expect(deployWorkflow).not.toMatch(/uses: [^\s]+@v\d/u);
  });

  it("precaches offline PDF and import resources", () => {
    const config = readRepositoryFile("vite.config.ts");

    expect(config).toContain("mjs");
    expect(config).toContain("templates/*.csv");
    expect(config).toContain("templates/*.json");
    expect(config).toContain("study-assistant-avatar.svg");
  });

  it("keeps a keyboard skip target and responsive Structured Study grid", () => {
    const layout = readRepositoryFile("src/shared/components/AppLayout.tsx");
    const structuredStudy = readRepositoryFile("src/features/study/StudyTheoryPage.tsx");
    const styles = readRepositoryFile("src/styles/global.css");

    expect(layout).toContain('className="skip-link"');
    expect(layout).toContain('id="main-content"');
    expect(structuredStudy).not.toContain('style={{ gridTemplateColumns: "repeat(3');
    expect(styles).toContain("--blue-600: #b45309;");
    expect(styles).toContain("--blue-600: #047857;");
    expect(styles).toContain("outline: 3px solid var(--focus-ring)");
  });
});
