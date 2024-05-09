export default function ColorPicker() {
  return (
    <>
      <input name="red" type="range" min="0" max="255" value={0} />
      <input name="green" type="range" min="0" max="255" value={0} />
      <input name="blue" type="range" min="0" max="255" value={0} />
    </>
  );
}
