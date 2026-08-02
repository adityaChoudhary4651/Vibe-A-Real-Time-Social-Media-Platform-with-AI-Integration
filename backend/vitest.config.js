import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["src/tests/setup.js"],
    include: ["src/**/*.test.js"],
    testTimeout: 20000, // 20s timeout in case database connections are slow
    hookTimeout: 20000
  }
});
