import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/gradient-creator/",
  resolve: {
    // Workspace packages export their TypeScript source under "source": the app runs
    // and builds from it (with hot reload), so packages need no build first.
    conditions: ["source"],
  },
  test: {
    // Workspace packages run their own tests (see vitest.workspace.ts).
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
