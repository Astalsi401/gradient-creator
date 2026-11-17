import Gradient from "./components/Gradient";
import UsingColors from "./components/UsingColors";
import { ColorPicker } from "@astalsi401/hsl-color-picker";
import usePalette from "./palette/usePalette";
import "./assets/main.scss";
import "@astalsi401/hsl-color-picker/style.css";

function App() {
  const { palette, current, css, add, remove, select, setChannels, setAngle } = usePalette();
  return (
    <div className="container-fluid">
      <Gradient gradient={css} />
      <div className="container px-3">
        <UsingColors colors={palette.colors} currentId={palette.currentId} angle={palette.angle} onAdd={add} onRemove={remove} onSelect={select} onAngleChange={setAngle} />
        {/* The picker leaves outer spacing to its consumer. */}
        <div className="my-3">
          <ColorPicker value={current} onChange={setChannels} />
        </div>
      </div>
    </div>
  );
}

export default App;
