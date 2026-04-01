import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

export type AppVersion =
  | { kind: "tag"; ref: string }
  | { kind: "commit"; sha: string };

export function resolveAppVersion(): AppVersion | undefined {
  const override = process.env.ASSET_VERSION?.trim();
  if (override) return { kind: "tag", ref: override };

  try {
    const tag = execSync("git describe --tags --exact-match HEAD", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();
    if (tag) return { kind: "tag", ref: tag };
  } catch {
    // HEAD is not on an exact tag
  }

  try {
    const sha = execSync("git rev-parse --short HEAD", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();
    if (sha) return { kind: "commit", sha };
  } catch {
    // git not available
  }

  return undefined;
}

export function resolveSwissqrbillVersion(): string | undefined {
  try {
    const pkg = JSON.parse(
      readFileSync(new URL("../../package.json", import.meta.url), "utf8")
    ) as { dependencies?: Record<string, string> };
    return pkg.dependencies?.swissqrbill;
  } catch {
    return undefined;
  }
}
