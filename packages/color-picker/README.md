# @astalsi401/hsl-color-picker

A React HSL color picker: a **Hue disc** (hue by angle, saturation by distance from the center) inside a **Lightness ring** (dark at the top, light at the bottom).

- Controlled `value` / `onChange`, always with the complete Color
- ESM with bundled TypeScript types; React 18 or 19 as a peer dependency
- A plain CSS stylesheet with `hcp-` prefixed class names and `--hcp-*` variables
- Pointer, mouse and touch dragging, which keeps going when the pointer leaves the picker

## Install

```sh
npm install @astalsi401/hsl-color-picker
```

## Usage

Import the component and, once anywhere in your app, the stylesheet:

```tsx
import { useState } from "react";
import { ColorPicker, type Color } from "@astalsi401/hsl-color-picker";
import "@astalsi401/hsl-color-picker/style.css";

export function App() {
  const [color, setColor] = useState<Color>({ h: 200, s: 80, l: 50 });
  return (
    <>
      <ColorPicker value={color} onChange={setColor} />
      <div style={{ background: `hsl(${color.h} ${color.s}% ${color.l}%)` }}>Picked</div>
    </>
  );
}
```

A `Color` is `{ h: number; s: number; l: number }`: hue in degrees `[0, 360)`, saturation and lightness in percent `[0, 100]`. The picker emits unrounded numbers; round them yourself if you need to.

The picker is controlled: it shows `value` and calls `onChange` with the complete new Color. A Hue disc pick changes `h` and `s`, and a Lightness ring pick changes `l`. The other channels are copied from `value`. If you skip the stylesheet, the picker renders unstyled markup with the class names below, which you can style yourself. Give the Hue disc and Lightness ring `touch-action: none` so that dragging on a touch screen does not scroll the page.

## Props

| Prop         | Type                                                | Description                                                                                         |
| ------------ | --------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `value`      | `Color`                                             | **Required.** The Color to show.                                                                    |
| `onChange`   | `(color: Color) => void`                            | **Required.** Called with the complete new Color while the user presses or drags.                   |
| `className`  | `string`                                            | Class added to the root element.                                                                    |
| `style`      | `CSSProperties`                                     | Inline style for the root element.                                                                  |
| `classNames` | `Partial<Record<Slot, string>>`                     | Classes added to each [slot](#slots).                                                               |
| `styles`     | `Partial<Record<Slot, CSSProperties>>`              | Inline styles for each [slot](#slots).                                                              |
| `labels`     | `{ hueDisc?: string; lightnessRing?: string }`      | Hover text (`title`) of the Hue disc and Lightness ring. The Hue disc defaults to `"Select Color"`; the Lightness ring has no title unless you pass one. |

Your classes are added after the default class of each part and never replace it. On the root, `className` comes after `classNames.root`, and `style` is merged over `styles.root`. Your inline styles never override the internal variables that position the Marks.

`Slot` and the props type are not exported. If you need them, use `ComponentProps<typeof ColorPicker>`.

## Slots

| Slot            | Part                             | Default class        |
| --------------- | -------------------------------- | -------------------- |
| `root`          | The outer element                | `hcp-color-picker`   |
| `hueDisc`       | The Hue disc                     | `hcp-hue-disc`       |
| `lightnessRing` | The Lightness ring               | `hcp-lightness-ring` |
| `hueMark`       | The Mark on the Hue disc         | `hcp-hue-mark`       |
| `lightnessMark` | The Mark on the Lightness ring   | `hcp-lightness-mark` |

While being dragged, the Hue disc and Lightness ring also get the class `hcp-dragging`.

```tsx
<ColorPicker
  value={color}
  onChange={setColor}
  className="my-picker"
  classNames={{ hueMark: "my-hue-mark" }}
  styles={{ lightnessRing: { cursor: "ns-resize" } }}
  labels={{ hueDisc: "Farbe wählen", lightnessRing: "Helligkeit wählen" }}
/>
```

## CSS variables

| Variable             | Default                      | What it sets                                                                                  |
| -------------------- | ---------------------------- | --------------------------------------------------------------------------------------------- |
| `--hcp-size`         | `min(100%, 400px)`           | Width of the Hue disc. The whole picker is this plus twice the ring width.                    |
| `--hcp-ring-width`   | `25px`                       | Width of the Lightness ring band. The Marks are the ring width minus 5px.                    |
| `--hcp-surface`      | `#fff`                       | The Lightness ring's inner area, the Lightness ring Mark's fill and the Hue disc Mark's border. |
| `--hcp-shadow`       | `0 0 4px rgb(0 0 0 / 0.6)`   | Shadow of the Marks and of the Lightness ring's inner edge.                                   |
| `--hcp-outer-shadow` | `0 0 0.25rem rgb(0 0 0 / 0.3)` | Shadow around the Hue disc and the Lightness ring.                                          |

Set them on the picker root or on any ancestor, for example `:root`. Setting them on another slot (such as `styles.hueDisc`) has no effect.

```css
.my-picker {
  --hcp-size: 300px;
  --hcp-ring-width: 20px;
}
```

To set them inline, cast the style object, because React's `CSSProperties` type does not include custom properties (and this package does not change it):

```tsx
import type { CSSProperties } from "react";

<ColorPicker value={color} onChange={setColor} style={{ "--hcp-size": "300px" } as CSSProperties} />;
```

The picker measures itself, so dragging stays accurate after a resize.

## License

[MIT](./LICENSE)
