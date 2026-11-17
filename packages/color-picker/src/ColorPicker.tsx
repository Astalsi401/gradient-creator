import { useLayoutEffect, useState, useRef, type CSSProperties, type RefObject } from "react";
import type { Color } from "./color.js";
import { colorToMarks, pointToHueSaturation, pointToLightness, type LightnessSide, type Point } from "./wheel.js";
import useRingDrag from "./useRingDrag.js";

// Measured radius of the hue disc; follows any layout change, not just window resizes.
function useRadius(ref: RefObject<HTMLElement>) {
  const [radius, setRadius] = useState(0);
  // Layout effect so the first paint already has the real radius (no mark flash at the center).
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
const cssVars = (vars: Record<`--${string}`, string>) => vars as CSSProperties;

// Customisable parts, named after the glossary terms. Renaming one is a breaking change (ADR 0001).
type Slot = "root" | "hueDisc" | "lightnessRing" | "hueMark" | "lightnessMark";

type ColorPickerProps = {
  value: Color;
  // Always receives the complete new Color, never a partial one.
  onChange: (color: Color) => void;
  className?: string;
  style?: CSSProperties;
  classNames?: Partial<Record<Slot, string>>;
  styles?: Partial<Record<Slot, CSSProperties>>;
  // Hover text of the two pickable parts. The Hue disc falls back to "Select Color";
  // the Lightness ring has no title unless one is passed.
  labels?: { hueDisc?: string; lightnessRing?: string };
};

const DEFAULT_HUE_DISC_LABEL = "Select Color";

// Default class first, consumer classes appended after it, never replacing it.
const classes = (...names: (string | false | undefined)[]) => names.filter(Boolean).join(" ");

export default function ColorPicker({ value, onChange, className, style, classNames = {}, styles = {}, labels }: ColorPickerProps) {
  const hueRef = useRef<HTMLDivElement>(null);
  const radius = useRadius(hueRef);
  // The only other view state: which mirrored half of the lightness ring the user last dragged.
  const [lightnessSide, setLightnessSide] = useState<LightnessSide>("right");
  const { h, s } = value;
  const { hueOffset, lightnessAngle } = colorToMarks(value, radius, lightnessSide);
  // Both wheels share a center, so their center-relative points feed the geometry directly.
  const pickHueSaturation = (point: Point) => onChange({ ...value, ...pointToHueSaturation(point, radius) });
  const pickLightness = (point: Point) => {
    const { l, side } = pointToLightness(point);
    onChange({ ...value, l });
    setLightnessSide(side);
  };
  return (
    <div
      className={classes("hcp-color-picker", classNames.root, className)}
      style={{ ...styles.root, ...style }}
    >
      <div className="hcp-layout">
        <Lightness angle={lightnessAngle} hueRadius={radius} hue={h} saturation={s} onPoint={pickLightness} classNames={classNames} styles={styles} label={labels?.lightnessRing} />
        <Hue hueRef={hueRef} offset={hueOffset} hue={h} onPoint={pickHueSaturation} classNames={classNames} styles={styles} label={labels?.hueDisc ?? DEFAULT_HUE_DISC_LABEL} />
      </div>
    </div>
  );
}

type PartProps = {
  onPoint: (point: Point) => void;
  classNames: Partial<Record<Slot, string>>;
  styles: Partial<Record<Slot, CSSProperties>>;
  label: string | undefined;
};

function Lightness({ angle, hueRadius, hue, saturation, onPoint, classNames, styles, label }: PartProps & { angle: number; hueRadius: number; hue: number; saturation: number }) {
  // Its own ref (unlike Hue, whose ref the parent also uses to measure the radius).
  const ref = useRef<HTMLDivElement>(null);
  // The inner circle ends halfway between the hue rim and the ring's outer edge
  // (style.css insets it by half the band), so presses inside it miss the ring.
  // Only called from a pointer handler, so the ring is mounted and `ref.current` is set.
  const accepts = ({ x, y }: Point) => Math.hypot(x, y) >= (hueRadius + ref.current!.clientWidth / 2) / 2;
  const { dragging, handlers } = useRingDrag(ref, onPoint, { accepts });
  return (
    <div title={label} ref={ref} className={classes("hcp-lightness-ring", dragging && "hcp-dragging", classNames.lightnessRing)} style={{ ...styles.lightnessRing, ...cssVars({ "--_hcp-hue": `${hue}deg`, "--_hcp-saturation": `${saturation}%` }) }} {...handlers}>
      <div className={classes("hcp-lightness-mark", classNames.lightnessMark)} style={{ ...styles.lightnessMark, ...cssVars({ "--_hcp-hue-disc-radius": `${hueRadius}px`, "--_hcp-lightness-mark-angle": `${angle}deg` }) }} />
    </div>
  );
}

function Hue({ hueRef, offset, hue, onPoint, classNames, styles, label }: PartProps & { hueRef: RefObject<HTMLDivElement>; offset: number; hue: number }) {
  const { dragging, handlers } = useRingDrag(hueRef, onPoint);
  return (
    <div title={label} className={classes("hcp-hue-disc", dragging && "hcp-dragging", classNames.hueDisc)} ref={hueRef} style={styles.hueDisc} {...handlers}>
      <div className={classes("hcp-hue-mark", classNames.hueMark)} style={{ ...styles.hueMark, ...cssVars({ "--_hcp-hue": `${hue}deg`, "--_hcp-hue-mark-distance": `${offset}px` }) }} />
    </div>
  );
}
