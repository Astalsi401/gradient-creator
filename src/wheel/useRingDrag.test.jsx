// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { useRef } from "react";
import { render, fireEvent, cleanup } from "@testing-library/react";
import useRingDrag from "./useRingDrag";

afterEach(cleanup);

// A 200×200 element whose top-left corner sits at (100, 50): its center is (200, 150).
const RECT = { left: 100, top: 50, width: 200, height: 200, right: 300, bottom: 250, x: 100, y: 50 };

function Ring({ onPoint, accepts }) {
  const ref = useRef(null);
  const { dragging, handlers } = useRingDrag(ref, onPoint, { accepts });
  return <div data-testid="ring" data-dragging={dragging} ref={ref} {...handlers} />;
}

const setup = (accepts) => {
  const onPoint = vi.fn();
  const { getByTestId } = render(<Ring onPoint={onPoint} accepts={accepts} />);
  const ring = getByTestId("ring");
  ring.getBoundingClientRect = () => RECT;
  return { onPoint, ring };
};

const at = (clientX, clientY, extra = {}) => ({ clientX, clientY, pointerId: 1, button: 0, ...extra });

describe("useRingDrag", () => {
  it("reports the press immediately as 'start', relative to the element's center", () => {
    const { onPoint, ring } = setup();
    fireEvent.pointerDown(ring, at(230, 110));
    expect(onPoint).toHaveBeenCalledWith({ x: 30, y: -40 }, "start");
    expect(ring.dataset.dragging).toBe("true");
  });

  it("ignores pointer movement when no drag is in progress", () => {
    const { onPoint, ring } = setup();
    fireEvent.pointerMove(ring, at(230, 110));
    expect(onPoint).not.toHaveBeenCalled();
  });

  it("reports movement during a drag as 'move'", () => {
    const { onPoint, ring } = setup();
    fireEvent.pointerDown(ring, at(200, 150));
    fireEvent.pointerMove(ring, at(140, 250));
    expect(onPoint).toHaveBeenLastCalledWith({ x: -60, y: 100 }, "move");
  });

  it("reports the release as 'end' and stops tracking afterwards", () => {
    const { onPoint, ring } = setup();
    fireEvent.pointerDown(ring, at(200, 150));
    fireEvent.pointerUp(ring, at(260, 150));
    expect(onPoint).toHaveBeenLastCalledWith({ x: 60, y: 0 }, "end");
    expect(ring.dataset.dragging).toBe("false");
    onPoint.mockClear();
    fireEvent.pointerMove(ring, at(230, 110));
    expect(onPoint).not.toHaveBeenCalled();
  });

  it("captures the pointer for the whole drag, so tracking continues outside the element", () => {
    const { ring } = setup();
    fireEvent.pointerDown(ring, at(200, 150));
    expect(ring.hasPointerCapture(1)).toBe(true);
    fireEvent.pointerUp(ring, at(200, 150));
    expect(ring.hasPointerCapture(1)).toBe(false);
  });

  it.each([
    ["pointercancel", fireEvent.pointerCancel],
    ["lostpointercapture", fireEvent.lostPointerCapture],
  ])("ends the drag on %s without reporting a point", (_, interrupt) => {
    const { onPoint, ring } = setup();
    fireEvent.pointerDown(ring, at(200, 150));
    onPoint.mockClear();
    interrupt(ring, at(260, 150));
    expect(onPoint).not.toHaveBeenCalled();
    expect(ring.dataset.dragging).toBe("false");
    fireEvent.pointerMove(ring, at(230, 110));
    fireEvent.pointerUp(ring, at(230, 110));
    expect(onPoint).not.toHaveBeenCalled();
  });

  it("ignores presses with a non-primary button", () => {
    const { onPoint, ring } = setup();
    fireEvent.pointerDown(ring, at(230, 110, { button: 2 }));
    fireEvent.pointerMove(ring, at(230, 110, { button: 2 }));
    expect(onPoint).not.toHaveBeenCalled();
    expect(ring.dataset.dragging).toBe("false");
    expect(ring.hasPointerCapture(1)).toBe(false);
  });

  it("only starts a drag where `accepts` allows, judged by the center-relative point", () => {
    // Accept only the outer band (distance ≥ 80 from the center), like a ring with a dead middle.
    const { onPoint, ring } = setup(({ x, y }) => Math.hypot(x, y) >= 80);
    fireEvent.pointerDown(ring, at(230, 110)); // distance 50
    fireEvent.pointerMove(ring, at(230, 110));
    expect(onPoint).not.toHaveBeenCalled();
    expect(ring.hasPointerCapture(1)).toBe(false);
    fireEvent.pointerDown(ring, at(290, 150)); // distance 90
    expect(onPoint).toHaveBeenCalledWith({ x: 90, y: 0 }, "start");
  });
});
