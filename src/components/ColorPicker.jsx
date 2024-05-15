export default function ColorPicker({ hueRef, current, state, setState }) {
  const handleColorChange = ({ target: { value, name, min, max } }) => {
    const newValue = Math.round(parseFloat(value));
    setState((prev) => ({ ...prev, colors: prev.colors.map((d) => (d.id === prev.currntID ? { ...d, [name]: newValue < min ? min : newValue > max ? max : newValue } : d)) }));
  };
  const { rotate } = state;
  return (
    <div className="hsl-color-picker my-3">
      <ColorSettings name="rotate" min={0} max={360} value={rotate} change={({ target: { value } }) => setState((prev) => ({ ...prev, rotate: Math.round(parseFloat(value)) }))} />
      <div className="hue-container">
        <Hue hueRef={hueRef} current={current} state={state} setState={setState} handleColorChange={handleColorChange} />
      </div>
      <div className="my-3 p-2 d-flex flex-wrap" style={{ "--h": `${current.h}deg`, "--s": `${current.saturation}%`, "--l": `${current.lightness}%` }}>
        {[{ name: "lightness", min: 0, max: 100, value: current.lightness, change: handleColorChange }].map((d) => (
          <ColorSettings key={d.name} {...d} />
        ))}
      </div>
    </div>
  );
}

function Hue({ hueRef, current, state, setState, handleColorChange }) {
  const handleDrag = (isDragging) => setState((prev) => ({ ...prev, isDragging }));
  const calculateAngle = ({ clientX, clientY }, isDragging) => {
    const { width, left, top } = hueRef.current.getBoundingClientRect();
    const center = { x: width / 2 + left, y: width / 2 + top };
    const d1 = { x: 0, y: -width / 2 };
    const d2 = { x: clientX - center.x, y: clientY - center.y };
    const angle = (Math.atan2(d1.y, d1.x) - Math.atan2(d2.y, d2.x)) * (-180 / Math.PI);
    const r = width / 2;
    let diff = Math.sqrt(d2.x ** 2 + d2.y ** 2);
    diff = diff > r ? r : diff;
    setState((prev) => ({ ...prev, diff }));
    handleColorChange({ target: { value: angle < 0 ? 360 + angle : angle, name: "h" } });
    handleColorChange({ target: { value: (diff / r) * 100, name: "saturation" } });
    handleDrag(isDragging);
  };
  const { diff, isDragging } = state;
  const { h, saturation, lightness } = current;
  return (
    <div title="Select Color" className="hue mx-auto shadow-sm" ref={hueRef} style={{ "--diff": `${diff}px`, "--h": `${h}deg`, "--s": `${saturation}%`, "--l": `${lightness}%` }} onPointerDown={() => handleDrag(true)} onPointerUp={(e) => calculateAngle(e, false)} onPointerMove={(e) => hueRef.current && isDragging && calculateAngle(e, true)}>
      <div className="mark"></div>
    </div>
  );
}
function ColorSettings({ name, min, max, value, change }) {
  return (
    <div className="w-100 my-1" key={name}>
      <div className="text-large">
        {name}: <input className="py-2 px-2" name={name} type="number" min={min} max={max} value={value} onChange={change} />
      </div>
      <div className="my-1">
        <div className={`slider-blocks d-flex ${name}`}>
          {name !== "rotate" &&
            Array(100)
              .fill(null)
              .map((_, i) => <span key={`${name}-slider-${i}`} className="d-block" style={{ "--i": `${i}%` }}></span>)}
        </div>
        <input className="d-block w-100" name={name} type="range" min={min} max={max} value={value} onChange={change} />
      </div>
    </div>
  );
}
