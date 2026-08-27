import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Anchored to the real suite so stray checkouts under the repo root
    // (e.g. git worktrees in .claude/) are never picked up as tests.
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      thresholds: {
        branches: 70,
        functions: 80,
        lines: 80,
        statements: 80
      },
      include: ["src/**/*.ts"],
      exclude: ["src/server.ts", "src/views/**"]
    }
  }
});
