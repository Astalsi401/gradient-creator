import { useEffect, useState, useRef } from "react";

export default function ColorPicker({ hueRef, current, wheel, setWheel, setChannels }) {
  const { hueR } = wheel;
  const { h, s, l } = current;
  const calculateAngle = (clientX, clientY) => {
    const { left, top } = hueRef.current.getBoundingClientRect();
    const center = { x: hueR + left, y: hueR + top };
    const d1 = { x: 0, y: -hueR };
    const d2 = { x: clientX - center.x, y: clientY - center.y };
    const angle = (Math.atan2(d1.y, d1.x) - Math.atan2(d2.y, d2.x)) * (-180 / Math.PI);
    let diff = Math.sqrt(d2.x ** 2 + d2.y ** 2);
    diff = diff > hueR ? hueR : diff;
    return { angle, diff, offsetY: Math.round(((1 - Math.cos((angle * Math.PI) / 180)) / 2) * 100) };
  };
  return (
    <div className="hsl-color-picker my-3" style={{ "--hueR": `${hueR}px`, "--h": `${h}deg`, "--s": `${s}%`, "--l": `${l}%` }}>
      <div className="hue-container my-3">
        <Lightness current={current} wheel={wheel} setWheel={setWheel} calculateAngle={calculateAngle} setChannels={setChannels} />
        <Hue hueRef={hueRef} current={current} wheel={wheel} setWheel={setWheel} calculateAngle={calculateAngle} setChannels={setChannels} />
      </div>
    </div>
  );
}

function Lightness({ current, wheel, setWheel, calculateAngle, setChannels }) {
  const [isDragging, setIsDragging] = useState(false);
  const lightnessRef = useRef(null);
  const { id, l } = current;
  const handleMove = (clientX, clientY) => {
    const { angle, offsetY } = calculateAngle(clientX, clientY);
    setChannels({ l: offsetY });
    setWheel((prev) => ({ ...prev, angle }));
  };
  const handleDrag = (clientX, clientY, isDragging) => {
    setIsDragging(isDragging);
    handleMove(clientX, clientY);
  };
  const calculateLightnessAngle = () => setWheel((prev) => ({ ...prev, angle: Math.acos(1 - 2 * (l / 100)) * (180 / Math.PI) }));
  useEffect(() => calculateLightnessAngle(), [id]);
  return (
    <div ref={lightnessRef} className={`lightness shadow-sm ${isDragging ? "dragging" : ""}`} style={{ "--angle": `${wheel.angle}deg` }} onPointerDown={({ clientX, clientY }) => handleDrag(clientX, clientY, true)} onPointerUp={({ clientX, clientY }) => handleDrag(clientX, clientY, false)} onPointerMove={({ clientX, clientY }) => isDragging && handleMove(clientX, clientY)}>
      <div className="mark" />
    </div>
  );
}

function Hue({ hueRef, current, wheel, setWheel, calculateAngle, setChannels }) {
  const [isDragging, setIsDragging] = useState(false);
  const { diff, hueR } = wheel;
  const { h, s, l } = current;
  const handleDrag = (newIsDragging) => setIsDragging(newIsDragging);
  const handleHueChange = ({ clientX, clientY }, isDragging) => {
    const { angle, diff } = calculateAngle(clientX, clientY);
    setWheel((prev) => ({ ...prev, diff }));
    setChannels({ h: angle < 0 ? 360 + angle : angle, s: (diff / hueR) * 100 });
    handleDrag(isDragging);
  };
  return (
    <div title="Select Color" className={`hue mx-auto shadow-sm ${isDragging ? "dragging" : ""}`} ref={hueRef} style={{ "--diff": `${diff}px`, "--h": `${h}deg`, "--s": `${s}%`, "--l": `${l}%` }} onPointerDown={() => handleDrag(true)} onPointerUp={(e) => handleHueChange(e, false)} onPointerMove={(e) => hueRef.current && isDragging && handleHueChange(e, true)}>
      <div className="mark" />
    </div>
  );
}
