import { useLayoutEffect, useState, useRef } from "react";
import { colorToMarks, pointToHueSaturation, pointToLightness } from "../wheel/wheel";

// Measured radius of the hue disc; follows any layout change, not just window resizes.
function useRadius(ref) {
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

export default function ColorPicker({ current, setChannels }) {
  const hueRef = useRef(null);
  const radius = useRadius(hueRef);
  // The only other view state: which mirrored half of the lightness ring the user last dragged.
  const [lightnessSide, setLightnessSide] = useState("right");
  const { h, s, l } = current;
  const { hueOffset, lightnessAngle } = colorToMarks(current, radius, lightnessSide);
  // Pointer position relative to the shared center of the hue disc and lightness ring.
  const toWheelPoint = (clientX, clientY) => {
    const { left, top, width, height } = hueRef.current.getBoundingClientRect();
    return { x: clientX - (left + width / 2), y: clientY - (top + height / 2) };
  };
  const pickHueSaturation = (clientX, clientY) => setChannels(pointToHueSaturation(toWheelPoint(clientX, clientY), radius));
  const pickLightness = (clientX, clientY) => {
    const { l, side } = pointToLightness(toWheelPoint(clientX, clientY));
    setChannels({ l });
    setLightnessSide(side);
  };
  return (
    <div className="hsl-color-picker my-3" style={{ "--hueR": `${radius}px`, "--h": `${h}deg`, "--s": `${s}%`, "--l": `${l}%` }}>
      <div className="hue-container my-3">
        <Lightness angle={lightnessAngle} onPick={pickLightness} />
        <Hue hueRef={hueRef} offset={hueOffset} onPick={pickHueSaturation} />
      </div>
    </div>
  );
}

function Lightness({ angle, onPick }) {
  const [isDragging, setIsDragging] = useState(false);
  const handleDrag = (clientX, clientY, isDragging) => {
    setIsDragging(isDragging);
    onPick(clientX, clientY);
  };
  return (
    <div className={`lightness shadow-sm ${isDragging ? "dragging" : ""}`} style={{ "--angle": `${angle}deg` }} onPointerDown={({ clientX, clientY }) => handleDrag(clientX, clientY, true)} onPointerUp={({ clientX, clientY }) => handleDrag(clientX, clientY, false)} onPointerMove={({ clientX, clientY }) => isDragging && onPick(clientX, clientY)}>
      <div className="mark" />
    </div>
  );
}

function Hue({ hueRef, offset, onPick }) {
  const [isDragging, setIsDragging] = useState(false);
  const handlePick = ({ clientX, clientY }, isDragging) => {
    onPick(clientX, clientY);
    setIsDragging(isDragging);
  };
  return (
    <div title="Select Color" className={`hue mx-auto shadow-sm ${isDragging ? "dragging" : ""}`} ref={hueRef} style={{ "--diff": `${offset}px` }} onPointerDown={() => setIsDragging(true)} onPointerUp={(e) => handlePick(e, false)} onPointerMove={(e) => isDragging && handlePick(e, true)}>
      <div className="mark" />
    </div>
  );
}
