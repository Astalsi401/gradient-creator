import { useLayoutEffect, useState, useRef, type CSSProperties, type RefObject } from "react";
import type { Color } from "./color.js";
import { colorToMarks, pointToHueSaturation, pointToLightness, type LightnessSide, type Point } from "./geometry.js";
import useRingDrag from "./useRingDrag.js";

// Measured radius of the Hue disc; follows any layout change, not just window resizes.
function useRadius(ref: RefObject<HTMLElement>) {
  const [radius, setRadius] = useState(0);
  // Layout effect so the first paint already has the real radius (no Mark flash at the center).
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setRadius(el.clientWidth / 2);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return radius;
}

// Inline styles that set CSS custom properties. A local assertion rather than a global
// augmentation of React's CSSProperties, so installing the package changes no one's types.
type CssVars = Record<`--${string}`, string>;
const cssVars = (vars: CssVars) => vars as CSSProperties;

// Customisable parts, named after the glossary terms. Renaming one is a breaking change (ADR 0001).
type Slot = "root" | "hueDisc" | "lightnessRing" | "hueMark" | "lightnessMark";
type SlotClassNames = Partial<Record<Slot, string>>;
type SlotStyles = Partial<Record<Slot, CSSProperties>>;

const DEFAULT_CLASSES: Record<Slot, string> = {
  root: "hcp-color-picker",
  hueDisc: "hcp-hue-disc",
  lightnessRing: "hcp-lightness-ring",
  hueMark: "hcp-hue-mark",
  lightnessMark: "hcp-lightness-mark",
};

type ColorPickerProps = {
  value: Color;
  // Always receives the complete new Color, never a partial one.
  onChange: (color: Color) => void;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotClassNames;
  styles?: SlotStyles;
  // Hover text of the two pickable parts. The Hue disc falls back to "Select Color";
  // the Lightness ring has no title unless one is passed.
  labels?: { hueDisc?: string; lightnessRing?: string };
};

const DEFAULT_HUE_DISC_LABEL = "Select Color";

// Default class first, consumer classes appended after it, never replacing it.
const classes = (...names: (string | false | undefined)[]) => names.filter(Boolean).join(" ");

export default function ColorPicker({ value, onChange, className, style, classNames = {}, styles = {}, labels }: ColorPickerProps) {
  const hueDiscRef = useRef<HTMLDivElement>(null);
  const radius = useRadius(hueDiscRef);
  // The only other view state: which mirrored half of the Lightness ring the user last dragged.
  const [lightnessSide, setLightnessSide] = useState<LightnessSide>("right");
  const { h, s } = value;
  const { hueOffset, lightnessAngle } = colorToMarks(value, radius, lightnessSide);
  // The Hue disc and Lightness ring share a center, so their center-relative points feed the geometry directly.
  const pickHueSaturation = (point: Point) => onChange({ ...value, ...pointToHueSaturation(point, radius) });
  const pickLightness = (point: Point) => {
    const { l, side } = pointToLightness(point);
    onChange({ ...value, l });
    setLightnessSide(side);
  };
  const customisation = { classNames, styles };
  return (
    <div className={classes(DEFAULT_CLASSES.root, classNames.root, className)} style={{ ...styles.root, ...style }}>
      <div className="hcp-layout">
        <LightnessRing {...customisation} hue={h} saturation={s} hueDiscRadius={radius} markAngle={lightnessAngle} onPoint={pickLightness} label={labels?.lightnessRing} />
        <HueDisc {...customisation} hueDiscRef={hueDiscRef} hue={h} markDistance={hueOffset} onPoint={pickHueSaturation} label={labels?.hueDisc ?? DEFAULT_HUE_DISC_LABEL} />
      </div>
    </div>
  );
}

type PartProps = {
  classNames: SlotClassNames;
  styles: SlotStyles;
  onPoint: (point: Point) => void;
  label: string | undefined;
};

function LightnessRing({ hue, saturation, hueDiscRadius, markAngle, ...part }: PartProps & { hue: number; saturation: number; hueDiscRadius: number; markAngle: number }) {
  // Its own ref (unlike HueDisc, whose ref the parent also uses to measure the radius).
  const ref = useRef<HTMLDivElement>(null);
  // The inner circle ends halfway between the Hue disc rim and the ring's outer edge
  // (style.css insets it by half the band), so presses inside it miss the ring.
  // Only called from a pointer handler, so the ring is mounted and `ref.current` is set.
  const accepts = ({ x, y }: Point) => Math.hypot(x, y) >= (hueDiscRadius + ref.current!.clientWidth / 2) / 2;
  return (
    <PickablePart
      {...part}
      slot="lightnessRing"
      markSlot="lightnessMark"
      partRef={ref}
      accepts={accepts}
      // The ring's gradient is drawn in the picked hue and saturation.
      vars={{ "--_hcp-hue": `${hue}deg`, "--_hcp-saturation": `${saturation}%` }}
      markVars={{ "--_hcp-hue-disc-radius": `${hueDiscRadius}px`, "--_hcp-lightness-mark-angle": `${markAngle}deg` }}
    />
  );
}

function HueDisc({ hueDiscRef, hue, markDistance, ...part }: PartProps & { hueDiscRef: RefObject<HTMLDivElement>; hue: number; markDistance: number }) {
  return (
    <PickablePart
      {...part}
      slot="hueDisc"
      markSlot="hueMark"
      partRef={hueDiscRef}
      vars={{}}
      markVars={{ "--_hcp-hue": `${hue}deg`, "--_hcp-hue-mark-distance": `${markDistance}px` }}
    />
  );
}

type PickablePartProps = PartProps & {
  slot: "hueDisc" | "lightnessRing";
  markSlot: "hueMark" | "lightnessMark";
  partRef: RefObject<HTMLDivElement>;
  accepts?: (point: Point) => boolean;
  // Positioning variables, set on the element that reads them.
  vars: CssVars;
  markVars: CssVars;
};

// The markup shared by the Hue disc and Lightness ring: the draggable part with its Mark inside.
// Each element gets its default class, then `hcp-dragging` (part only), then the slot's class;
// its style is the slot's style with the positioning variables last, so no consumer style can move a Mark.
function PickablePart({ slot, markSlot, partRef, onPoint, accepts, label, vars, markVars, classNames, styles }: PickablePartProps) {
  const { dragging, handlers } = useRingDrag(partRef, onPoint, { accepts });
  return (
    <div
      ref={partRef}
      title={label}
      className={classes(DEFAULT_CLASSES[slot], dragging && "hcp-dragging", classNames[slot])}
      style={{ ...styles[slot], ...cssVars(vars) }}
      {...handlers}
    >
      <div className={classes(DEFAULT_CLASSES[markSlot], classNames[markSlot])} style={{ ...styles[markSlot], ...cssVars(markVars) }} />
    </div>
  );
}
