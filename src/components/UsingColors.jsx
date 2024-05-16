export default function UsingColors({ state, setState, defautlColor1 }) {
  const addColor = () => {
    setState((prev) => {
      const newId = Math.max(...prev.colors.map(({ id }) => id)) + 1;
      return { ...prev, currntID: newId, colors: [...prev.colors, { id: newId, ...defautlColor1 }] };
    });
  };
  const deleteColor = (id) => {
    state.colors.length > 1 &&
      setState((prev) => {
        const newColors = prev.colors.filter((d) => id !== d.id);
        return { ...prev, colors: newColors, currntID: newColors[newColors.length - 1].id };
      });
  };
  const selectColor = (id) => {
    setState((prev) => {
      const { saturation } = prev.colors.find((d) => d.id === id);
      const diff = (prev.hueR * saturation) / 100;
      return { ...prev, diff, currntID: id };
    });
  };
  const { colors, currntID } = state;
  return (
    <div className="using-colors my-3 d-flex align-items-center g-1">
      {colors.map(({ id, h, saturation: s, lightness: l }) => (
        <div key={id} title="Click to Select / Double Click to Delete" className={`using-color shadow-sm ${id === currntID ? "active" : ""}`} style={{ background: `hsl(${h}, ${s}%, ${l}%)` }} onClick={() => selectColor(id)} onDoubleClick={() => deleteColor(id)}></div>
      ))}
      <div title="Add Color" className="add-color" onClick={addColor}></div>
    </div>
  );
}
