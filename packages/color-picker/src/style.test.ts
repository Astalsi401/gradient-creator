import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

// The shipped stylesheet must work on any host page: it may lean on nothing the host defines.
const css = readFileSync(new URL("./style.css", import.meta.url), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

// `var(--name)` with no fallback, and `var(--name, fallback)`.
const references = [...css.matchAll(/var\(\s*(--[\w-]+)\s*(,)?/g)].map(([, name, comma]) => ({ name: name!, fallback: !!comma }));
const declared = new Set([...css.matchAll(/(--[\w-]+)\s*:/g)].map(([, name]) => name!));

describe("style.css", () => {
  it("defines a default for every CSS variable it references", () => {
    const undefinedVars = references.filter(({ name, fallback }) => !fallback && !declared.has(name)).map(({ name }) => name);
    expect(undefinedVars).toEqual([]);
  });

  it("never declares the public --hcp-* variables itself, so consumers can set them on any ancestor", () => {
    expect([...declared].filter((name) => name.startsWith("--hcp-"))).toEqual([]);
  });

  it.each(["--hcp-size", "--hcp-ring-width", "--hcp-surface", "--hcp-shadow", "--hcp-outer-shadow"])(
    "lets %s be overridden",
    (name) => {
      expect(references.some((ref) => ref.name === name && ref.fallback)).toBe(true);
    }
  );

  it("only styles hcp- prefixed classes", () => {
    const classes = [...css.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map(([, name]) => name!);
    expect(classes.length).toBeGreaterThan(0);
    expect(classes.filter((name) => !name.startsWith("hcp-"))).toEqual([]);
  });
});
