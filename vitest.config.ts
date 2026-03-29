import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
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
