// A Color is an HSL value; a PaletteColor is a Color placed in the Palette (see GLOSSARY.md).
export type Color = { h: number; s: number; l: number };
export type Channel = keyof Color;
export type PaletteColor = Color & { id: number };

export type Palette = {
  angle: number;
  currentId: number;
  colors: PaletteColor[];
};

export type PaletteIntent =
  | { type: "add" }
  | { type: "remove"; id: number }
  | { type: "select"; id: number }
  | { type: "setAngle"; value: number }
  | { type: "setChannels"; channels: Partial<Color> };

// Color given to newly added colors, and the first color of the initial palette.
const defaultColor: Color = { h: 0, s: 100, l: 50 };

export const initialPalette: Palette = {
  angle: 0,
  currentId: 0,
  colors: [
    { id: 0, ...defaultColor },
    { id: 1, h: 270, s: 100, l: 50 },
  ],
};

export const colorToCss = ({ h, s, l }: Color): string => `hsl(${h}, ${s}%, ${l}%)`;

export const toCss = ({ angle, colors }: Palette): string =>
  // Only reached with exactly one color, so colors[0] exists.
  colors.length === 1 ? colorToCss(colors[0]!) : `linear-gradient(${angle}deg, ${colors.map(colorToCss).join(", ")})`;

const clamp = (n: number, min: number, max: number): number => Math.min(max, Math.max(min, n));

const channelNormalizers: Record<Channel, (n: number) => number> = {
  h: (n) => {
    const h = Math.round(n);
    return h === 360 ? 0 : clamp(h, 0, 359);
  },
  s: (n) => clamp(Math.round(n), 0, 100),
  l: (n) => clamp(Math.round(n), 0, 100),
};

const channelNames = Object.keys(channelNormalizers) as Channel[];

// Invalid input (NaN, ±Infinity — e.g. a cleared number input) leaves the palette unchanged.
export function paletteReducer(palette: Palette, intent: PaletteIntent): Palette {
  switch (intent.type) {
    case "add": {
      const id = Math.max(...palette.colors.map((c) => c.id)) + 1;
      return { ...palette, currentId: id, colors: [...palette.colors, { id, ...defaultColor }] };
    }
    case "remove": {
      if (palette.colors.length <= 1) return palette;
      const colors = palette.colors.filter((c) => c.id !== intent.id);
      // At least one color remains: the palette had two or more, and ids are unique.
      const currentId = intent.id === palette.currentId ? colors[colors.length - 1]!.id : palette.currentId;
      return { ...palette, currentId, colors };
    }
    case "select":
      return palette.colors.some((c) => c.id === intent.id) ? { ...palette, currentId: intent.id } : palette;
    case "setAngle":
      return Number.isFinite(intent.value) ? { ...palette, angle: clamp(Math.round(intent.value), 0, 360) } : palette;
    case "setChannels": {
      const channels: Partial<Color> = {};
      for (const name of channelNames) {
        const n = intent.channels[name];
        if (n !== undefined && Number.isFinite(n)) channels[name] = channelNormalizers[name](n);
      }
      if (Object.keys(channels).length === 0) return palette;
      return { ...palette, colors: palette.colors.map((c) => (c.id === palette.currentId ? { ...c, ...channels } : c)) };
    }
    default:
      return palette;
  }
}
