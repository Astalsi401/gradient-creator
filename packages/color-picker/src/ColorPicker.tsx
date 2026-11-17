import { useLayoutEffect, useState, useRef, type CSSProperties, type RefObject } from "react";
import type { Color } from "./color";
import { colorToMarks, pointToHueSaturation, pointToLightness, type LightnessSide, type Point } from "./wheel";
import useRingDrag from "./useRingDrag";

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

type ColorPickerProps = {
  value: Color;
  // Always receives the complete new Color, never a partial one.
  onChange: (color: Color) => void;
};

export default function ColorPicker({ value, onChange }: ColorPickerProps) {
  const hueRef = useRef<HTMLDivElement>(null);
  const radius = useRadius(hueRef);
  // The only other view state: which mirrored half of the lightness ring the user last dragged.
  const [lightnessSide, setLightnessSide] = useState<LightnessSide>("right");
  const { h, s, l } = value;
  const { hueOffset, lightnessAngle } = colorToMarks(value, radius, lightnessSide);
  // Both wheels share a center, so their center-relative points feed the geometry directly.
  const pickHueSaturation = (point: Point) => onChange({ ...value, ...pointToHueSaturation(point, radius) });
  const pickLightness = (point: Point) => {
    const { l, side } = pointToLightness(point);
    onChange({ ...value, l });
    setLightnessSide(side);
  };
  return (
    <div className="hcp-color-picker" style={cssVars({ "--hueR": `${radius}px`, "--h": `${h}deg`, "--s": `${s}%`, "--l": `${l}%` })}>
      <div className="hcp-layout">
        <Lightness angle={lightnessAngle} hueRadius={radius} onPoint={pickLightness} />
        <Hue hueRef={hueRef} offset={hueOffset} onPoint={pickHueSaturation} />
      </div>
    </div>
  );
}

function Lightness({ angle, hueRadius, onPoint }: { angle: number; hueRadius: number; onPoint: (point: Point) => void }) {
  // Its own ref (unlike Hue, whose ref the parent also uses to measure the radius).
  const ref = useRef<HTMLDivElement>(null);
  // The inner circle ends halfway between the hue rim and the ring's outer edge
  // (style.css insets it by half the band), so presses inside it miss the ring.
  // Only called from a pointer handler, so the ring is mounted and `ref.current` is set.
  const accepts = ({ x, y }: Point) => Math.hypot(x, y) >= (hueRadius + ref.current!.clientWidth / 2) / 2;
  const { dragging, handlers } = useRingDrag(ref, onPoint, { accepts });
  return (
    <div ref={ref} className={`hcp-lightness-ring${dragging ? " hcp-dragging" : ""}`} style={cssVars({ "--angle": `${angle}deg` })} {...handlers}>
      <div className="hcp-lightness-mark" />
    </div>
  );
}

function Hue({ hueRef, offset, onPoint }: { hueRef: RefObject<HTMLDivElement>; offset: number; onPoint: (point: Point) => void }) {
  const { dragging, handlers } = useRingDrag(hueRef, onPoint);
  return (
    <div title="Select Color" className={`hcp-hue-disc${dragging ? " hcp-dragging" : ""}`} ref={hueRef} style={cssVars({ "--diff": `${offset}px` })} {...handlers}>
      <div className="hcp-hue-mark" />
    </div>
  );
}
