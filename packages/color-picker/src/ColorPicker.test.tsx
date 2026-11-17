// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeAll, afterAll } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/react";
import { ColorPicker, type Color } from "./index";

afterEach(cleanup);

// jsdom does no layout, so the picker's geometry is stubbed. Both parts share the center (200, 150):
// the Hue disc is 200px wide (radius 100), the Lightness ring 250px wide. The ring's inner area
// ends halfway between the disc rim and the ring's outer edge: (100 + 125) / 2 = 112.5px from center.
const CENTER = { x: 200, y: 150 };
const HUE_DISC_WIDTH = 200;
const LIGHTNESS_RING_WIDTH = 250;

// The one place that knows the parts' class names.
const isHueDisc = (el: Element) => el.classList.contains("hue");
const isLightnessRing = (el: Element) => el.classList.contains("lightness");
const widthOf = (el: Element) => (isHueDisc(el) ? HUE_DISC_WIDTH : isLightnessRing(el) ? LIGHTNESS_RING_WIDTH : 0);

const rectOfWidth = (width: number) => {
  const left = CENTER.x - width / 2;
  const top = CENTER.y - width / 2;
  return { left, top, width, height: width, right: left + width, bottom: top + width, x: left, y: top } as DOMRect;
};

let clientWidth: PropertyDescriptor | undefined;
let getBoundingClientRect: typeof Element.prototype.getBoundingClientRect;
beforeAll(() => {
  clientWidth = Object.getOwnPropertyDescriptor(Element.prototype, "clientWidth");
  getBoundingClientRect = Element.prototype.getBoundingClientRect;
  Object.defineProperty(Element.prototype, "clientWidth", {
    configurable: true,
    get(this: Element) {
      return widthOf(this);
    },
  });
  Element.prototype.getBoundingClientRect = function (this: Element) {
    return rectOfWidth(widthOf(this));
  };
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  );
});
afterAll(() => {
  if (clientWidth) Object.defineProperty(Element.prototype, "clientWidth", clientWidth);
  Element.prototype.getBoundingClientRect = getBoundingClientRect;
  vi.unstubAllGlobals();
});

const setup = (value: Color) => {
  const onChange = vi.fn();
  const { container, rerender } = render(<ColorPicker value={value} onChange={onChange} />);
  const parts = Array.from(container.querySelectorAll("*"));
  const hueDisc = parts.find(isHueDisc) as HTMLElement;
  const lightnessRing = parts.find(isLightnessRing) as HTMLElement;
  const update = (next: Color) => rerender(<ColorPicker value={next} onChange={onChange} />);
  return { onChange, hueDisc, lightnessRing, update };
};

// A pointer event at (dx, dy) px from the shared center.
const at = (dx: number, dy: number) => ({ clientX: CENTER.x + dx, clientY: CENTER.y + dy, pointerId: 1, button: 0 });

describe("ColorPicker", () => {
  it("emits complete Colors with the picked hue and saturation while dragging on the Hue disc", () => {
    const { onChange, hueDisc } = setup({ h: 10, s: 20, l: 30 });
    fireEvent.pointerDown(hueDisc, at(60, 0)); // right, 60% of the radius
    fireEvent.pointerMove(hueDisc, at(0, 100)); // bottom, on the rim
    fireEvent.pointerUp(hueDisc, at(0, 100));
    expect(onChange).toHaveBeenNthCalledWith(1, { h: 90, s: 60, l: 30 });
    expect(onChange).toHaveBeenNthCalledWith(2, { h: 180, s: 100, l: 30 });
    expect(onChange).toHaveBeenLastCalledWith({ h: 180, s: 100, l: 30 });
  });

  it("emits complete Colors with the picked lightness while dragging on the Lightness ring", () => {
    const { onChange, lightnessRing } = setup({ h: 10, s: 20, l: 30 });
    fireEvent.pointerDown(lightnessRing, at(0, -120)); // top: darkest
    fireEvent.pointerMove(lightnessRing, at(120, 0)); // right: halfway
    fireEvent.pointerMove(lightnessRing, at(0, 120)); // bottom: lightest
    fireEvent.pointerUp(lightnessRing, at(0, 120));
    const lightnessOf = (call: number) => ({ h: 10, s: 20, l: expect.closeTo(call) });
    expect(onChange).toHaveBeenNthCalledWith(1, lightnessOf(0));
    expect(onChange).toHaveBeenNthCalledWith(2, lightnessOf(50));
    expect(onChange).toHaveBeenNthCalledWith(3, lightnessOf(100));
  });

  it("ignores presses inside the Lightness ring's inner area", () => {
    const { onChange, lightnessRing } = setup({ h: 10, s: 20, l: 30 });
    fireEvent.pointerDown(lightnessRing, at(110, 0)); // just inside 112.5px
    fireEvent.pointerMove(lightnessRing, at(120, 0));
    fireEvent.pointerUp(lightnessRing, at(120, 0));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("moves both Marks when `value` changes", () => {
    const { hueDisc, lightnessRing, update } = setup({ h: 10, s: 20, l: 50 });
    expect(hueDisc.style.getPropertyValue("--diff")).toBe("20px"); // 20% of the radius
    expect(lightnessRing.style.getPropertyValue("--angle")).toBe("90deg"); // halfway down the right half
    update({ h: 10, s: 80, l: 0 });
    expect(hueDisc.style.getPropertyValue("--diff")).toBe("80px");
    expect(lightnessRing.style.getPropertyValue("--angle")).toBe("0deg"); // top
  });

  it("keeps the Lightness ring's Mark on the half that was last dragged", () => {
    const { lightnessRing, update } = setup({ h: 10, s: 20, l: 50 });
    fireEvent.pointerDown(lightnessRing, at(-120, 0)); // left half
    fireEvent.pointerUp(lightnessRing, at(-120, 0));
    update({ h: 10, s: 20, l: 50 });
    expect(lightnessRing.style.getPropertyValue("--angle")).toBe("270deg"); // halfway down the left half
  });
});
