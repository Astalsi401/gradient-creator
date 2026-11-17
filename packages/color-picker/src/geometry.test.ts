import { describe, it, expect } from "vitest";
import { pointToHueSaturation, pointToLightness, colorToMarks, type LightnessSide } from "./geometry.js";
import type { Color } from "./color.js";

describe("pointToHueSaturation", () => {
  it("measures hue clockwise from straight up (screen y points down)", () => {
    const r = 100;
    expect(pointToHueSaturation({ x: 0, y: -50 }, r).h).toBeCloseTo(0);
    expect(pointToHueSaturation({ x: 50, y: 0 }, r).h).toBeCloseTo(90);
    expect(pointToHueSaturation({ x: 0, y: 50 }, r).h).toBeCloseTo(180);
    expect(pointToHueSaturation({ x: -50, y: 0 }, r).h).toBeCloseTo(270);
  });

  it("gives saturation as distance over radius: 0 at the center, 100 at the rim", () => {
    expect(pointToHueSaturation({ x: 0, y: 0 }, 100).s).toBe(0);
    expect(pointToHueSaturation({ x: 30, y: 40 }, 100).s).toBeCloseTo(50);
    expect(pointToHueSaturation({ x: 0, y: -100 }, 100).s).toBeCloseTo(100);
  });

  it("clamps saturation to 100 outside the disc", () => {
    expect(pointToHueSaturation({ x: 300, y: 400 }, 100).s).toBe(100);
  });

  it("keeps hue in [0, 360) just left of straight up", () => {
    const { h } = pointToHueSaturation({ x: -1e-15, y: -50 }, 100);
    expect(h).toBeGreaterThanOrEqual(0);
    expect(h).toBeLessThan(360);
  });
});

describe("pointToLightness", () => {
  it("is 0 at the top, 50 at the sides, 100 at the bottom", () => {
    expect(pointToLightness({ x: 0, y: -200 }).l).toBeCloseTo(0);
    expect(pointToLightness({ x: 200, y: 0 }).l).toBeCloseTo(50);
    expect(pointToLightness({ x: -200, y: 0 }).l).toBeCloseTo(50);
    expect(pointToLightness({ x: 0, y: 200 }).l).toBeCloseTo(100);
  });

  it("is symmetric left and right, reporting which side was used", () => {
    const right = pointToLightness({ x: 120, y: -60 });
    const left = pointToLightness({ x: -120, y: -60 });
    expect(left.l).toBeCloseTo(right.l);
    expect(right.side).toBe("right");
    expect(left.side).toBe("left");
  });
});

describe("colorToMarks", () => {
  it("places the hue mark at saturation × radius from the center", () => {
    expect(colorToMarks({ h: 30, s: 40, l: 50 }, 200, "right").hueOffset).toBeCloseTo(80);
    expect(colorToMarks({ h: 30, s: 100, l: 50 }, 200, "right").hueOffset).toBeCloseTo(200);
    expect(colorToMarks({ h: 30, s: 0, l: 50 }, 200, "right").hueOffset).toBe(0);
  });

  it("scales the hue mark with the radius instead of jumping to the rim", () => {
    const color = { h: 30, s: 40, l: 50 };
    expect(colorToMarks(color, 100, "right").hueOffset).toBeCloseTo(40);
    expect(colorToMarks(color, 150, "right").hueOffset).toBeCloseTo(60);
  });

  it("places the lightness mark at top for 0, side for 50, bottom for 100", () => {
    expect(colorToMarks({ h: 0, s: 100, l: 0 }, 100, "right").lightnessAngle).toBeCloseTo(0);
    expect(colorToMarks({ h: 0, s: 100, l: 50 }, 100, "right").lightnessAngle).toBeCloseTo(90);
    expect(colorToMarks({ h: 0, s: 100, l: 100 }, 100, "right").lightnessAngle).toBeCloseTo(180);
  });

  it("mirrors the lightness mark onto the left side when asked", () => {
    expect(colorToMarks({ h: 0, s: 100, l: 50 }, 100, "left").lightnessAngle).toBeCloseTo(270);
    expect(colorToMarks({ h: 0, s: 100, l: 25 }, 100, "left").lightnessAngle).toBeCloseTo(300);
  });
});

describe("color → marks → color round trip", () => {
  // Rebuilds where the Marks sit on screen (same formulas as the stylesheet's translate) and reads the color back.
  const markPoint = (offset: number, angleDeg: number) => {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: offset * Math.sin(rad), y: -offset * Math.cos(rad) };
  };

  it.each<[Color, LightnessSide]>([
    [{ h: 0, s: 100, l: 50 }, "right"],
    [{ h: 45, s: 30, l: 12 }, "right"],
    [{ h: 200, s: 75, l: 88 }, "left"],
    [{ h: 359, s: 5, l: 63 }, "left"],
  ])("recovers %o on the %s side", (color, side) => {
    const radius = 173;
    const { hueOffset, lightnessAngle } = colorToMarks(color, radius, side);
    const { h, s } = pointToHueSaturation(markPoint(hueOffset, color.h), radius);
    const lightness = pointToLightness(markPoint(radius + 20, lightnessAngle));
    expect(Math.round(h)).toBe(color.h);
    expect(Math.round(s)).toBe(color.s);
    expect(Math.round(lightness.l)).toBe(color.l);
    expect(lightness.side).toBe(side);
  });
});
