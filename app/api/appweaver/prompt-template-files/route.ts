import { readdir } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

const TEMPLATE_ROOT_SUFFIX = path.join("route-data", "system-config", "llm", "templates");

function getTemplateRootCandidates() {
  return [
    process.env.APPWEAVER_PROMPT_TEMPLATE_ROOT,
    process.env.PROMPT_TEMPLATE_ROOT,
    path.resolve(process.cwd(), TEMPLATE_ROOT_SUFFIX),
    path.resolve(process.cwd(), "..", TEMPLATE_ROOT_SUFFIX),
    path.resolve(
      process.cwd(),
      "..",
      "..",
      "appweaverbackend",
      "appweaver-integration-core",
      "appweaver-integration-core-test",
      TEMPLATE_ROOT_SUFFIX,
    ),
  ].filter((candidate): candidate is string => Boolean(candidate));
}

async function collectMarkdownFiles(root: string, current = root): Promise<string[]> {
  const entries = await readdir(current, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(current, entry.name);

      if (entry.isDirectory()) {
        return collectMarkdownFiles(root, fullPath);
      }

      if (!entry.isFile() || !entry.name.toLowerCase().endsWith(".md")) {
        return [];
      }

      return [`/${path.relative(root, fullPath).replace(/\\/g, "/")}`];
    }),
  );

  return files.flat();
}

export async function GET() {
  for (const root of getTemplateRootCandidates()) {
    try {
      const templates = await collectMarkdownFiles(root);
      return NextResponse.json(
        templates.sort((first, second) => first.localeCompare(second)).map((templatePath) => ({
          path: templatePath,
        })),
      );
    } catch {
      // Try the next likely local template root.
    }
  }

  return NextResponse.json([]);
}
