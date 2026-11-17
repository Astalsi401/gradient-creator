import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";

// Library build: ESM only, React left to the consumer. Types come from `tsc -p tsconfig.build.json`.
export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: "src/index.ts",
      formats: ["es"],
      fileName: "index",
    },
    rollupOptions: {
      // react, react-dom and their subpaths (e.g. react/jsx-runtime).
      external: (id) => /^react(-dom)?(\/|$)/.test(id),
    },
  },
  test: {
    // Pure-function tests run in node; DOM tests opt in with `// @vitest-environment jsdom`.
    setupFiles: ["./src/test-setup.ts"],
  },
});
