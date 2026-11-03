import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const sourceDirectory = fileURLToPath(new URL("../src", import.meta.url));

function cssFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return cssFiles(path);
    return entry.isFile() && path.endsWith(".css") ? [path] : [];
  });
}

describe("typography consistency", () => {
  it("allows only the shared app font or documented technical identifier font", () => {
    const declarations = cssFiles(sourceDirectory).flatMap((path) => {
      const content = readFileSync(path, "utf8");
      return [...content.matchAll(/^\s*font-family\s*:\s*([^;]+);/gmu)].map((match) => ({
        path: relative(sourceDirectory, path).replaceAll("\\", "/"),
        value: match[1].trim(),
      }));
    });

    expect(declarations).toEqual([
      { path: "styles/buildVersion.css", value: "var(--app-technical-font-family)" },
      { path: "styles/global.css", value: "var(--app-font-family)" },
      { path: "styles/workspaceBetaInfo.css", value: "var(--app-technical-font-family)" },
      { path: "styles/workspaceBetaTypography.css", value: "var(--app-font-family, ui-sans-serif, system-ui, sans-serif)" },
    ]);
  });

  it("rejects unapproved custom font sources and font shorthands", () => {
    const source = cssFiles(sourceDirectory).map((path) => readFileSync(path, "utf8")).join("\n");
    const fontShorthands = [...source.matchAll(/^[\t ]*font\s*:\s*([^;]+);/gmu)].map((match) => match[1].trim());

    expect(source).not.toMatch(/@font-face\b/iu);
    expect(fontShorthands).toEqual(Array(fontShorthands.length).fill("inherit"));
  });

  it("keeps Windows Local chat text on shared Workspace typography tokens", () => {
    const localChat = readFileSync(
      join(sourceDirectory, "styles/workspaceBetaLocalChat.css"),
      "utf8",
    );
    const workspaceTypography = readFileSync(
      join(sourceDirectory, "styles/workspaceBetaTypography.css"),
      "utf8",
    );
    const literalFontSizes = [...localChat.matchAll(/font-size\s*:\s*([^;]+);/gu)]
      .map((match) => match[1].trim())
      .filter((value) => !value.startsWith("var(--workspace-type-"));

    // The attachment plus is an icon-sized control rather than text content.
    expect(literalFontSizes).toEqual(["1.5rem"]);
    expect(localChat).not.toContain("font-family:");
    expect(localChat).toContain("var(--workspace-weight-control)");
    expect(workspaceTypography).toContain(".workspace-local-chat .ai-capabilities-limits summary");
    expect(workspaceTypography).toContain(".local-chatgpt-plan-page .local-pdf-rag");
  });
});
