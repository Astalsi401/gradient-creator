import { useRef, useState } from "react";

// Pointer position relative to the center of `el`'s bounding box.
const toCenterPoint = (el, { clientX, clientY }) => {
  const { left, top, width, height } = el.getBoundingClientRect();
  return { x: clientX - (left + width / 2), y: clientY - (top + height / 2) };
};

// Ring drag: one pointer-capture drag lifecycle for a round element.
// `onPoint(point, phase)` gets the pointer relative to the element's center, with phase
// "start" (press), "move" (while dragging) or "end" (release). Interrupted drags end silently.
// `accepts(point)` optionally limits where a press may start a drag.
export default function useRingDrag(ref, onPoint, { accepts } = {}) {
  const [dragging, setDragging] = useState(false);
  // Mirrors `dragging` synchronously, so a move arriving before the re-render still counts.
  const draggingRef = useRef(false);
  const updateDragging = (value) => {
    draggingRef.current = value;
    setDragging(value);
  };
  const handlers = {
    onPointerDown: (e) => {
      if (e.button !== 0) return;
      const point = toCenterPoint(ref.current, e);
      if (accepts && !accepts(point)) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      updateDragging(true);
      onPoint(point, "start");
    },
    onPointerMove: (e) => {
      if (draggingRef.current) onPoint(toCenterPoint(ref.current, e), "move");
    },
    onPointerUp: (e) => {
      if (!draggingRef.current) return;
      onPoint(toCenterPoint(ref.current, e), "end");
      e.currentTarget.releasePointerCapture(e.pointerId);
      updateDragging(false);
    },
    onPointerCancel: () => updateDragging(false),
    onLostPointerCapture: () => updateDragging(false),
  };
  return { dragging, handlers };
}
