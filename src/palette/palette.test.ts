import { describe, it, expect } from "vitest";
import { initialPalette, paletteReducer, toCss, colorToCss, type Palette, type PaletteColor } from "./palette";
import type { Color } from "@astalsi401/hsl-color-picker";

describe("colorToCss", () => {
  it("serializes one color as an hsl string", () => {
    const color: PaletteColor = { id: 7, h: 12, s: 34, l: 56 };
    expect(colorToCss(color)).toBe("hsl(12, 34%, 56%)");
  });
});

describe("toCss", () => {
  it("serializes the initial palette as a red-to-purple 0deg linear gradient", () => {
    expect(toCss(initialPalette)).toBe("linear-gradient(0deg, hsl(0, 100%, 50%), hsl(270, 100%, 50%))");
  });

  it("serializes a single-color palette as a plain hsl color", () => {
    const palette: Palette = { angle: 45, currentId: 3, colors: [{ id: 3, h: 120, s: 40, l: 30 }] };
    expect(toCss(palette)).toBe("hsl(120, 40%, 30%)");
  });
});

describe("add", () => {
  it("appends a default color with a fresh id and selects it", () => {
    const next = paletteReducer(initialPalette, { type: "add" });
    expect(next.colors).toEqual([
      { id: 0, h: 0, s: 100, l: 50 },
      { id: 1, h: 270, s: 100, l: 50 },
      { id: 2, h: 0, s: 100, l: 50 },
    ]);
    expect(next.currentId).toBe(2);
  });
});

const threeColors: Palette = {
  angle: 0,
  currentId: 1,
  colors: [
    { id: 0, h: 0, s: 100, l: 50 },
    { id: 1, h: 90, s: 100, l: 50 },
    { id: 2, h: 180, s: 100, l: 50 },
  ],
};

describe("remove", () => {
  it("removes a non-current color and keeps the selection", () => {
    const next = paletteReducer(threeColors, { type: "remove", id: 2 });
    expect(next.colors.map((c) => c.id)).toEqual([0, 1]);
    expect(next.currentId).toBe(1);
  });

  it("selects the last remaining color when the current color is removed", () => {
    const next = paletteReducer(threeColors, { type: "remove", id: 1 });
    expect(next.colors.map((c) => c.id)).toEqual([0, 2]);
    expect(next.currentId).toBe(2);
  });

  it("does nothing when only one color remains", () => {
    const single: Palette = { angle: 0, currentId: 5, colors: [{ id: 5, h: 10, s: 20, l: 30 }] };
    expect(paletteReducer(single, { type: "remove", id: 5 })).toEqual(single);
  });
});

describe("id allocation", () => {
  it("gives a new color an id no existing color has, even after a middle color was removed", () => {
    const afterRemove = paletteReducer(threeColors, { type: "remove", id: 1 });
    const next = paletteReducer(afterRemove, { type: "add" });
    expect(next.colors.map((c) => c.id)).toEqual([0, 2, 3]);
    expect(next.currentId).toBe(3);
  });
});

describe("select", () => {
  it("makes the chosen color current", () => {
    expect(paletteReducer(threeColors, { type: "select", id: 2 }).currentId).toBe(2);
  });

  it("ignores ids that do not exist", () => {
    expect(paletteReducer(threeColors, { type: "select", id: 42 })).toEqual(threeColors);
  });
});

describe("setAngle", () => {
  it("sets the gradient angle, rounding to a whole degree", () => {
    expect(paletteReducer(threeColors, { type: "setAngle", value: 44.6 }).angle).toBe(45);
  });

  it.each([
    [-10, 0],
    [400, 360],
    [360, 360],
  ])("clamps %s to %s", (value, expected) => {
    expect(paletteReducer(threeColors, { type: "setAngle", value }).angle).toBe(expected);
  });

  it.each([NaN, Infinity, -Infinity])("keeps the last valid angle when given %o", (value) => {
    const angled = { ...threeColors, angle: 120 };
    expect(paletteReducer(angled, { type: "setAngle", value })).toEqual(angled);
  });

  it("never serializes NaNdeg after the angle input is cleared", () => {
    expect(toCss(paletteReducer(initialPalette, { type: "setAngle", value: NaN }))).not.toContain("NaN");
  });
});

describe("setChannels", () => {
  it("updates several channels of the current color at once, leaving other colors alone", () => {
    const next = paletteReducer(threeColors, { type: "setChannels", channels: { h: 200, s: 40 } });
    expect(next.colors).toEqual([
      { id: 0, h: 0, s: 100, l: 50 },
      { id: 1, h: 200, s: 40, l: 50 },
      { id: 2, h: 180, s: 100, l: 50 },
    ]);
  });

  it("updates lightness of the current color", () => {
    expect(paletteReducer(threeColors, { type: "setChannels", channels: { l: 20 } }).colors[1]).toEqual({ id: 1, h: 90, s: 100, l: 20 });
  });

  const currentAfter = (channels: Partial<Color>) => paletteReducer(threeColors, { type: "setChannels", channels }).colors[1];

  it.each([
    [{ h: 359.6 }, { h: 0 }],
    [{ h: 360 }, { h: 0 }],
    [{ h: 359.4 }, { h: 359 }],
    [{ h: -5 }, { h: 0 }],
    [{ s: 120 }, { s: 100 }],
    [{ s: -3 }, { s: 0 }],
    [{ l: 100.4 }, { l: 100 }],
    [{ l: -0.4 }, { l: 0 }],
    [{ s: 33.5, l: 66.4 }, { s: 34, l: 66 }],
  ])("constrains %o to %o", (channels, expected) => {
    expect(currentAfter(channels)).toMatchObject(expected);
  });
});

describe("setChannels with invalid input", () => {
  it.each([NaN, Infinity])("keeps the previous channel value when given %o", (value) => {
    const next = paletteReducer(threeColors, { type: "setChannels", channels: { l: value } });
    expect(next).toEqual(threeColors);
  });

  it("applies the valid channels and skips the invalid ones in the same intent", () => {
    const next = paletteReducer(threeColors, { type: "setChannels", channels: { h: NaN, s: 25 } });
    expect(next.colors[1]).toEqual({ id: 1, h: 90, s: 25, l: 50 });
  });
});
