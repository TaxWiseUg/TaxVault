import { defineConfig } from "vitest/config";
import path from "node:path";
// Merge into your existing vitest config if you have one.
export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: { include: ["src/features/know-your-taxes/**/*.test.{js,jsx}"], environment: "node" },
});
