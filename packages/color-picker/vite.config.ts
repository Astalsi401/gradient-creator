import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import { readFileSync } from "node:fs";
import type { Plugin } from "vite";

// The stylesheet is plain CSS that the JS never imports (consumers opt in through the
// `style.css` subpath export), so it is copied into the build as-is.
const emitStylesheet = (): Plugin => ({
  name: "hcp-emit-stylesheet",
  generateBundle() {
    this.emitFile({ type: "asset", fileName: "style.css", source: readFileSync("src/style.css", "utf8") });
  },
});

// Library build: ESM only, React left to the consumer. Types come from `tsc -p tsconfig.build.json`;
// `scripts/check-dist.js` then checks the output.
export default defineConfig({
  plugins: [react(), emitStylesheet()],
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
