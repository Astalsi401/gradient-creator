import { useState, useRef, useEffect } from "react";
import Gradient from "./components/Gradient";
import UsingColors from "./components/UsingColors";
import ColorPicker from "./components/ColorPicker";
import usePalette from "./palette/usePalette";
import "./assets/main.scss";

function App() {
  const { palette, current, css, add, remove, select, setChannels, setAngle } = usePalette();
  // Color-wheel marker geometry is view state, not part of the Palette.
  const [wheel, setWheel] = useState({ angle: 0, diff: 0, hueR: 0 });
  const hueRef = useRef(null);
  const handleResize = () => {
    const hueR = hueRef.current.clientWidth / 2;
    setWheel((prev) => ({ ...prev, diff: hueRef.current ? hueR : prev.diff, hueR }));
  };
  useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [hueRef.current]);
  const selectColor = (id) => {
    select(id);
    const color = palette.colors.find((c) => c.id === id);
    if (color) setWheel((prev) => ({ ...prev, diff: (prev.hueR * color.s) / 100 }));
  };
  return (
    <div className="container-fluid">
      <Gradient gradient={css} />
      <div className="container px-3">
        <UsingColors colors={palette.colors} currentId={palette.currentId} angle={palette.angle} onAdd={add} onRemove={remove} onSelect={selectColor} onAngleChange={setAngle} />
        <ColorPicker hueRef={hueRef} current={current} wheel={wheel} setWheel={setWheel} setChannels={setChannels} />
      </div>
    </div>
  );
}

export default App;
