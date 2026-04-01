import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

export type AppVersion =
  | { kind: "tag"; ref: string }
  | { kind: "commit"; sha: string };

export function resolveAppVersion(): AppVersion | undefined {
  try {
    const bundled = readFileSync(new URL("../../.app-version", import.meta.url), "utf8").trim();
    if (bundled) {
      return /^\d+\.\d+\.\d+$/.test(bundled)
        ? { kind: "tag", ref: bundled }
        : { kind: "commit", sha: bundled };
    }
  } catch {
    // build did not bundle version metadata
  }

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
