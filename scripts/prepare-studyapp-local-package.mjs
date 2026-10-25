import { access, cp, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { basename, join, relative, resolve } from "node:path";

const requiredCompanionFiles = [
  "README.md",
  "credential_vault.py",
  "openai_connection.py",
  "requirements-chatgpt-plan.txt",
  "server.py",
  "setup-chatgpt-connection.ps1",
];

const root = resolve(process.cwd());
const outputArgument = process.argv[2];

if (!outputArgument) {
  throw new Error("Provide an empty destination directory for the StudyApp Local package.");
}

const output = resolve(outputArgument);
if (output === root) {
  throw new Error("Refusing to stage the StudyApp Local package at the repository root.");
}

try {
  if ((await readdir(output)).length > 0) {
    throw new Error("The StudyApp Local package destination must be empty.");
  }
} catch (error) {
  if (!(error instanceof Error) || !error.message.includes("ENOENT")) throw error;
}

async function requireFile(path) {
  try {
    await access(path);
  } catch {
    throw new Error(`Required StudyApp Local package file is missing: ${relative(root, path)}`);
  }
}

await requireFile(join(root, "dist", "index.html"));
await requireFile(join(root, "Start StudyApp Local.bat"));
for (const file of requiredCompanionFiles) {
  await requireFile(join(root, "local-companion", file));
}

await mkdir(output, { recursive: true });
await cp(join(root, "dist"), join(output, "dist"), { recursive: true });
await cp(join(root, "local-companion"), join(output, "local-companion"), {
  recursive: true,
  filter: (source) => {
    const name = basename(source);
    return name !== ".chatgpt-plan-venv"
      && name !== "__pycache__"
      && name !== "Start-StudyApp-Local.bat"
      && !name.endsWith(".pyc");
  },
});
await cp(join(root, "Start StudyApp Local.bat"), join(output, "Start StudyApp Local.bat"));

const version = (await readFile(join(root, "VERSION"), "utf8")).trim();
await writeFile(
  join(output, "RELEASE.txt"),
  `product=StudyApp Local Windows\nversion=${version}\nlauncher=Start StudyApp Local.bat\n`,
  "utf8",
);
