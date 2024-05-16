import { useState, useRef, useEffect } from "react";
import Gradient from "./components/Gradient";
import UsingColors from "./components/UsingColors";
import ColorPicker from "./components/ColorPicker";
import "./assets/main.scss";

function App() {
  const defautlColor1 = { h: 0, saturation: 100, lightness: 50 };
  const defautlColor2 = { h: 270, saturation: 100, lightness: 50 };
  const [state, setState] = useState({
    angle: 0,
    diff: 0,
    rotate: 0,
    currntID: 0,
    colors: [
      { id: 0, ...defautlColor1 },
      { id: 1, ...defautlColor2 },
    ],
  });
  const hueRef = useRef(null);
  const { colors, currntID, rotate } = state;
  const current = colors.find((d) => d.id === currntID);
  const gradient = colors.length === 1 ? `hsl(${current.h}, ${current.saturation}%, ${current.lightness}%)` : `linear-gradient(${rotate}deg, ${colors.map(({ h, saturation: s, lightness: l }) => `hsl(${h}, ${s}%, ${l}%)`).join(", ")})`;
  const handleResize = () => {
    const hueR = hueRef.current.clientWidth / 2;
    setState((prev) => ({ ...prev, diff: hueRef.current ? hueR : prev.diff, hueR }));
  };
  useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [hueRef.current]);
  return (
    <div className="container px-3">
      <Gradient gradient={gradient} />
      <UsingColors state={state} setState={setState} defautlColor1={defautlColor1} />
      <ColorPicker hueRef={hueRef} current={current} state={state} setState={setState} />
    </div>
  );
}

export default App;
