import { colorToCss } from "../palette/palette";

export default function UsingColors({ colors, currentId, angle, onAdd, onRemove, onSelect, onAngleChange }) {
  return (
    <>
      <Setting text="Angle" name="angle" min={0} max={360} value={angle} change={({ target: { value } }) => onAngleChange(value)} />
      <div className="using-colors my-3 d-flex align-items-center g-1">
        {colors.map((color) => (
          <div key={color.id} title="Click to Select / Double Click to Delete" className={`using-color shadow-sm ${color.id === currentId ? "active" : ""}`} style={{ background: colorToCss(color) }} onClick={() => onSelect(color.id)} onDoubleClick={() => onRemove(color.id)}></div>
        ))}
        <div title="Add Color" className="add-color" onClick={onAdd}></div>
      </div>
    </>
  );
}

function Setting({ text, name, min, max, value, change }) {
  return (
    <div className="w-100 my-3" key={name}>
      <div className="text-large">
        {text}: <input className="py-2 px-2" name={name} type="number" min={min} max={max} value={value} onChange={change} />
      </div>
      <div className="my-1">
        <input className="d-block w-100" name={name} type="range" min={min} max={max} value={value} onChange={change} />
      </div>
    </div>
  );
}
