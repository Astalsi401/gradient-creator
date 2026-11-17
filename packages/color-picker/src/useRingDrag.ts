import { useRef, useState, type PointerEvent, type RefObject } from "react";
import type { Point } from "./geometry.js";

export type DragPhase = "start" | "move" | "end";

type RingDragOptions = {
  // Limits where a press may start a drag.
  accepts?: (point: Point) => boolean;
};

// Pointer position relative to the center of `el`'s bounding box.
const toCenterPoint = (el: Element, { clientX, clientY }: { clientX: number; clientY: number }): Point => {
  const { left, top, width, height } = el.getBoundingClientRect();
  return { x: clientX - (left + width / 2), y: clientY - (top + height / 2) };
};

// Ring drag: one pointer-capture drag lifecycle for a round element.
// `onPoint(point, phase)` gets the pointer relative to the element's center, with phase
// "start" (press), "move" (while dragging) or "end" (release). Interrupted drags end silently.
// `accepts(point)` optionally limits where a press may start a drag.
export default function useRingDrag(
  ref: RefObject<Element>,
  onPoint: (point: Point, phase: DragPhase) => void,
  { accepts }: RingDragOptions = {}
) {
  const [dragging, setDragging] = useState(false);
  // Mirrors `dragging` synchronously, so a move arriving before the re-render still counts.
  const draggingRef = useRef(false);
  const updateDragging = (value: boolean) => {
    draggingRef.current = value;
    setDragging(value);
  };
  // Pointer events only reach a mounted element, so `ref.current` is set whenever a handler runs.
  const handlers = {
    onPointerDown: (e: PointerEvent<Element>) => {
      if (e.button !== 0) return;
      const point = toCenterPoint(ref.current!, e);
      if (accepts && !accepts(point)) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      updateDragging(true);
      onPoint(point, "start");
    },
    onPointerMove: (e: PointerEvent<Element>) => {
      if (draggingRef.current) onPoint(toCenterPoint(ref.current!, e), "move");
    },
    onPointerUp: (e: PointerEvent<Element>) => {
      if (!draggingRef.current) return;
      onPoint(toCenterPoint(ref.current!, e), "end");
      e.currentTarget.releasePointerCapture(e.pointerId);
      updateDragging(false);
    },
    onPointerCancel: () => updateDragging(false),
    onLostPointerCapture: () => updateDragging(false),
  };
  return { dragging, handlers };
}
