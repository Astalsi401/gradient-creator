// Checks what `npm pack` would publish: only the build output, README, LICENSE and
// package.json, and all of those present. Source, tests and scripts must stay out.
import { execSync } from "node:child_process";
import process from "node:process";

// npm returns an array, or (newer npm inside a workspace) an object keyed by package name.
const [pack] = Object.values(JSON.parse(execSync("npm pack --dry-run --json --ignore-scripts", { encoding: "utf8" })));
const files = pack.files.map((file) => file.path);
const required = ["package.json", "README.md", "LICENSE", "dist/index.js", "dist/index.d.ts", "dist/style.css"];
const failures = [
  ...required.filter((file) => !files.includes(file)).map((file) => `missing ${file}`),
  ...files.filter((file) => !file.startsWith("dist/") && !required.includes(file)).map((file) => `unexpected ${file}`),
];
if (failures.length) {
  console.error(`check-pack failed:\n  ${failures.join("\n  ")}`);
  process.exit(1);
}
console.log(`check-pack: ${files.length} files, only dist, README.md, LICENSE and package.json`);
