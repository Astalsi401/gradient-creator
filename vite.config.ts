import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/gradient-creator/",
  test: {
    // Pure-function tests run in node; DOM tests opt in with `// @vitest-environment jsdom`.
    setupFiles: ["./src/test/setup.ts"],
  },
});
