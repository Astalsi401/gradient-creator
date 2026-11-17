// Color given to newly added colors, and the first color of the initial palette.
const defaultColor = { h: 0, s: 100, l: 50 };

export const initialPalette = {
  angle: 0,
  currentId: 0,
  colors: [
    { id: 0, ...defaultColor },
    { id: 1, h: 270, s: 100, l: 50 },
  ],
};

export const colorToCss = ({ h, s, l }) => `hsl(${h}, ${s}%, ${l}%)`;

export const toCss = ({ angle, colors }) => (colors.length === 1 ? colorToCss(colors[0]) : `linear-gradient(${angle}deg, ${colors.map(colorToCss).join(", ")})`);

// Accepts numbers or numeric strings (form inputs); returns null for anything non-finite.
const toNumber = (value) => {
  if (typeof value === "string" && value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

const channelNormalizers = {
  h: (n) => {
    const h = Math.round(n);
    return h === 360 ? 0 : clamp(h, 0, 359);
  },
  s: (n) => clamp(Math.round(n), 0, 100),
  l: (n) => clamp(Math.round(n), 0, 100),
};

export function paletteReducer(palette, intent) {
  switch (intent.type) {
    case "add": {
      const id = Math.max(...palette.colors.map((c) => c.id)) + 1;
      return { ...palette, currentId: id, colors: [...palette.colors, { id, ...defaultColor }] };
    }
    case "remove": {
      if (palette.colors.length <= 1) return palette;
      const colors = palette.colors.filter((c) => c.id !== intent.id);
      const currentId = intent.id === palette.currentId ? colors[colors.length - 1].id : palette.currentId;
      return { ...palette, currentId, colors };
    }
    case "select":
      return palette.colors.some((c) => c.id === intent.id) ? { ...palette, currentId: intent.id } : palette;
    case "setAngle": {
      const angle = toNumber(intent.value);
      return angle === null ? palette : { ...palette, angle: clamp(Math.round(angle), 0, 360) };
    }
    case "setChannels": {
      const channels = {};
      for (const [name, value] of Object.entries(intent.channels)) {
        const n = toNumber(value);
        if (name in channelNormalizers && n !== null) channels[name] = channelNormalizers[name](n);
      }
      if (Object.keys(channels).length === 0) return palette;
      return { ...palette, colors: palette.colors.map((c) => (c.id === palette.currentId ? { ...c, ...channels } : c)) };
    }
    default:
      return palette;
  }
}
