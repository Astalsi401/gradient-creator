import { useLayoutEffect, useState, useRef, type RefObject } from "react";
import type { Color } from "../palette/palette";
import { colorToMarks, pointToHueSaturation, pointToLightness, type LightnessSide, type Point } from "../wheel/wheel";
import useRingDrag from "../wheel/useRingDrag";

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

type ColorPickerProps = {
  current: Color;
  setChannels: (channels: Partial<Color>) => void;
};

export default function ColorPicker({ current, setChannels }: ColorPickerProps) {
  const hueRef = useRef<HTMLDivElement>(null);
  const radius = useRadius(hueRef);
  // The only other view state: which mirrored half of the lightness ring the user last dragged.
  const [lightnessSide, setLightnessSide] = useState<LightnessSide>("right");
  const { h, s, l } = current;
  const { hueOffset, lightnessAngle } = colorToMarks(current, radius, lightnessSide);
  // Both wheels share a center, so their center-relative points feed the geometry directly.
  const pickHueSaturation = (point: Point) => setChannels(pointToHueSaturation(point, radius));
  const pickLightness = (point: Point) => {
    const { l, side } = pointToLightness(point);
    setChannels({ l });
    setLightnessSide(side);
  };
  return (
    <div className="hsl-color-picker my-3" style={{ "--hueR": `${radius}px`, "--h": `${h}deg`, "--s": `${s}%`, "--l": `${l}%` }}>
      <div className="hue-container my-3">
        <Lightness angle={lightnessAngle} hueRadius={radius} onPoint={pickLightness} />
        <Hue hueRef={hueRef} offset={hueOffset} onPoint={pickHueSaturation} />
      </div>
    </div>
  );
}

function Lightness({ angle, hueRadius, onPoint }: { angle: number; hueRadius: number; onPoint: (point: Point) => void }) {
  // Its own ref (unlike Hue, whose ref the parent also uses to measure the radius).
  const ref = useRef<HTMLDivElement>(null);
  // The inner white circle ends halfway between the hue rim and the ring's outer edge
  // (colorPicker.scss insets it by half the band), so presses inside it miss the ring.
  // Only called from a pointer handler, so the ring is mounted and `ref.current` is set.
  const accepts = ({ x, y }: Point) => Math.hypot(x, y) >= (hueRadius + ref.current!.clientWidth / 2) / 2;
  const { dragging, handlers } = useRingDrag(ref, onPoint, { accepts });
  return (
    <div ref={ref} className={`lightness shadow-sm ${dragging ? "dragging" : ""}`} style={{ "--angle": `${angle}deg` }} {...handlers}>
      <div className="mark" />
    </div>
  );
}

function Hue({ hueRef, offset, onPoint }: { hueRef: RefObject<HTMLDivElement>; offset: number; onPoint: (point: Point) => void }) {
  const { dragging, handlers } = useRingDrag(hueRef, onPoint);
  return (
    <div title="Select Color" className={`hue mx-auto shadow-sm ${dragging ? "dragging" : ""}`} ref={hueRef} style={{ "--diff": `${offset}px` }} {...handlers}>
      <div className="mark" />
    </div>
  );
}
