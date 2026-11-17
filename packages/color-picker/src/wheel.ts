// Color-wheel geometry: pure conversions between pointer positions and color channels.
// Convention: angles start straight up at 0° and grow clockwise; screen y points down.
import type { Color } from "./color.js";

// A position relative to the center shared by the Hue disc and Lightness ring, in px.
export type Point = { x: number; y: number };
// Which mirrored half of the Lightness ring.
export type LightnessSide = "left" | "right";
// Where the two Marks sit, in the units of the SCSS variables.
export type Marks = { hueOffset: number; lightnessAngle: number };

const toDegrees = (rad: number): number => (rad * 180) / Math.PI;
const toRadians = (deg: number): number => (deg * Math.PI) / 180;

// Clockwise angle from straight up, in [0, 360).
const pointAngle = ({ x, y }: Point): number => {
  const deg = toDegrees(Math.atan2(x, -y));
  // `% 360` because a tiny negative angle plus 360 can round up to exactly 360.
  return deg < 0 ? (deg + 360) % 360 : deg;
};

// `point` is relative to the hue disc's center.
export const pointToHueSaturation = (point: Point, radius: number): Pick<Color, "h" | "s"> => {
  const distance = Math.hypot(point.x, point.y);
  const s = radius > 0 ? Math.min(distance / radius, 1) * 100 : 0;
  return { h: pointAngle(point), s };
};

// `point` is relative to the ring's center. Top is 0 (dark), bottom is 100 (light);
// the ring is mirrored, so the side (0–180° right, 180–360° left) is reported too.
export const pointToLightness = (point: Point): { l: number; side: LightnessSide } => {
  const theta = pointAngle(point);
  return { l: ((1 - Math.cos(toRadians(theta))) / 2) * 100, side: theta < 180 ? "right" : "left" };
};

// Where the two marks sit for `color`, in the units of the SCSS variables:
// `hueOffset` → `--_hcp-hue-mark-distance` (px from the disc center, along the hue direction),
// `lightnessAngle` → `--_hcp-lightness-mark-angle` (deg, clockwise from top, on the chosen side of the ring).
export const colorToMarks = ({ s, l }: Color, radius: number, side: LightnessSide): Marks => {
  const theta = toDegrees(Math.acos(Math.min(1, Math.max(-1, 1 - (2 * l) / 100))));
  return {
    hueOffset: (Math.min(s, 100) / 100) * radius,
    lightnessAngle: side === "left" ? 360 - theta : theta,
  };
};
