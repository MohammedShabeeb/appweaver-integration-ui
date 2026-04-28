import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const featuresDir = path.join(root, "specs", "features");
const requiredSections = [
  "Goal",
  "Users",
  "Scope",
  "Acceptance Criteria",
  "Data And State",
  "Validation",
  "Open Questions",
];

function hasHeading(content, section) {
  const pattern = new RegExp(`^##\\s+${section}\\s*$`, "m");
  return pattern.test(content);
}

const entries = await readdir(featuresDir, { withFileTypes: true });
const files = entries
  .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
  .map((entry) => path.join(featuresDir, entry.name));

if (files.length === 0) {
  console.error("No feature specs found in specs/features.");
  process.exit(1);
}

let hasFailure = false;

for (const file of files) {
  const content = await readFile(file, "utf8");
  const missing = requiredSections.filter((section) => !hasHeading(content, section));

  if (missing.length > 0) {
    hasFailure = true;
    console.error(`${path.relative(root, file)} is missing: ${missing.join(", ")}`);
  }
}

if (hasFailure) {
  process.exit(1);
}

console.log(`Checked ${files.length} feature spec${files.length === 1 ? "" : "s"}.`);
