import { useEffect, useState, useRef } from "react";

export default function ColorPicker({ hueRef, current, state, setState }) {
  const { gradientAngle, hueR } = state;
  const { h, saturation, lightness } = current;
  const handleColorChange = ({ target: { value, name, min, max } }) => {
    const newValue = Math.round(parseFloat(value));
    setState((prev) => ({ ...prev, colors: prev.colors.map((d) => (d.id === prev.currntID ? { ...d, [name]: newValue < min ? min : newValue > max ? max : newValue } : d)) }));
  };
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
    <div className="hsl-color-picker my-3" style={{ "--hueR": `${hueR}px`, "--h": `${h}deg`, "--s": `${saturation}%`, "--l": `${lightness}%` }}>
      <div className="hue-container my-3">
        <Lightness current={current} state={state} setState={setState} calculateAngle={calculateAngle} handleColorChange={handleColorChange} />
        <Hue hueRef={hueRef} current={current} state={state} setState={setState} calculateAngle={calculateAngle} handleColorChange={handleColorChange} />
      </div>
    </div>
  );
}

function Lightness({ current, state, setState, calculateAngle, handleColorChange }) {
  const [isDragging, setIsDragging] = useState(false);
  const lightnessRef = useRef(null);
  const { lightness } = current;
  const { currntID } = state;
  const handleMove = (clientX, clientY) => {
    const { angle, offsetY } = calculateAngle(clientX, clientY);
    handleColorChange({ target: { value: offsetY, name: "lightness" } });
    setState((prev) => ({ ...prev, angle }));
  };
  const handleDrag = (clientX, clientY, isDragging) => {
    setIsDragging(isDragging);
    handleMove(clientX, clientY);
  };
  const calculateLightnessAngle = () => setState((prev) => ({ ...prev, angle: Math.acos(1 - 2 * (lightness / 100)) * (180 / Math.PI) }));
  useEffect(() => calculateLightnessAngle(), [currntID]);
  return (
    <div ref={lightnessRef} className={`lightness shadow-sm ${isDragging ? "dragging" : ""}`} style={{ "--angle": `${state.angle}deg` }} onPointerDown={({ clientX, clientY }) => handleDrag(clientX, clientY, true)} onPointerUp={({ clientX, clientY }) => handleDrag(clientX, clientY, false)} onPointerMove={({ clientX, clientY }) => isDragging && handleMove(clientX, clientY)}>
      <div className="mark" />
    </div>
  );
}

function Hue({ hueRef, current, state, setState, calculateAngle, handleColorChange }) {
  const [isDragging, setIsDragging] = useState(false);
  const { diff, hueR } = state;
  const { h, saturation, lightness } = current;
  const handleDrag = (newIsDragging) => setIsDragging(newIsDragging);
  const handleHueChange = ({ clientX, clientY }, isDragging) => {
    const { angle, diff } = calculateAngle(clientX, clientY);
    setState((prev) => ({ ...prev, diff }));
    handleColorChange({ target: { value: angle < 0 ? 360 + angle : angle, name: "h" } });
    handleColorChange({ target: { value: (diff / hueR) * 100, name: "saturation" } });
    handleDrag(isDragging);
  };
  return (
    <div title="Select Color" className={`hue mx-auto shadow-sm ${isDragging ? "dragging" : ""}`} ref={hueRef} style={{ "--diff": `${diff}px`, "--h": `${h}deg`, "--s": `${saturation}%`, "--l": `${lightness}%` }} onPointerDown={() => handleDrag(true)} onPointerUp={(e) => handleHueChange(e, false)} onPointerMove={(e) => hueRef.current && isDragging && handleHueChange(e, true)}>
      <div className="mark" />
    </div>
  );
}
