// Post-build check of what consumers get: every published export resolves to a built file,
// and the emitted type declarations do not augment React's types (no `declare module`).
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

const failures = [];
const pkg = JSON.parse(readFileSync("package.json", "utf8"));
for (const [subpath, conditions] of Object.entries(pkg.exports)) {
  for (const [condition, target] of Object.entries(conditions)) {
    if (condition !== "source" && !existsSync(target)) failures.push(`export "${subpath}" (${condition}) → missing ${target}`);
  }
}
const declarations = readdirSync("dist", { recursive: true }).filter((file) => file.endsWith(".d.ts"));
if (declarations.length === 0) failures.push("no .d.ts emitted");
for (const file of declarations) {
  if (/declare\s+(module|global)/.test(readFileSync(join("dist", file), "utf8"))) failures.push(`dist/${file} augments a module or the global scope`);
}
if (failures.length) {
  console.error(`check-dist failed:\n  ${failures.join("\n  ")}`);
  process.exit(1);
}
console.log(`check-dist: exports resolve; ${declarations.length} .d.ts files, no augmentation`);
