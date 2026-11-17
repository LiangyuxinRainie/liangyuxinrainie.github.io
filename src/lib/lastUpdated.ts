import { execFileSync } from "node:child_process";

export function getLastModified(): Date | undefined {
  try {
    const iso = execFileSync(
      "git",
      ["log", "-1", "--format=%cI", "--", ".", ":(exclude)public/visitor-stats.json"],
      { encoding: "utf8" }
    ).trim();

    return iso ? new Date(iso) : undefined;
  } catch {
    return undefined;
  }
}

export function getLastUpdated(): string {
  const lastModified = getLastModified();
  if (!lastModified) return "Recently";

  return lastModified.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
