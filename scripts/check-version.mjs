import { readFileSync } from "node:fs";
const version = readFileSync(new URL("../VERSION", import.meta.url), "utf8").trim();
const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const lock = JSON.parse(readFileSync(new URL("../package-lock.json", import.meta.url), "utf8"));
if (!/^\d+\.\d+\.\d+$/.test(version) || version !== pkg.version ||
    version !== lock.version || version !== lock.packages?.[""]?.version) {
  console.error("VERSION, package.json, and package-lock.json must match (X.Y.Z).");
  process.exitCode = 1;
} else {
  console.log("Verified StudyApp version v" + version);
}
