// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeAll, afterAll } from "vitest";
import { render, fireEvent, cleanup, act } from "@testing-library/react";
import { ColorPicker, type Color } from "./index";


// jsdom does no layout, so the picker's geometry is stubbed. Both parts share the center (200, 150):
// the Hue disc is 200px wide (radius 100), the Lightness ring 250px wide. The ring's inner area
// ends halfway between the disc rim and the ring's outer edge: (100 + 125) / 2 = 112.5px from center.
const CENTER = { x: 200, y: 150 };
// Widths can change mid-test (see `resize`), as when a consumer overrides `--hcp-size`.
let hueDiscWidth = 200;
let lightnessRingWidth = 250;

// The one place that knows the parts' class names.
const isHueDisc = (el: Element) => el.classList.contains("hcp-hue-disc");
const isLightnessRing = (el: Element) => el.classList.contains("hcp-lightness-ring");
const widthOf = (el: Element) => (isHueDisc(el) ? hueDiscWidth : isLightnessRing(el) ? lightnessRingWidth : 0);

// ResizeObserver stand-in: `resize` changes the stubbed widths and notifies every observer.
const resizeCallbacks = new Set<() => void>();
const resize = (hueDisc: number, lightnessRing: number) => {
  hueDiscWidth = hueDisc;
  lightnessRingWidth = lightnessRing;
  act(() => resizeCallbacks.forEach((callback) => callback()));
};

afterEach(() => {
  cleanup();
  resizeCallbacks.clear();
  hueDiscWidth = 200;
  lightnessRingWidth = 250;
});

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
      constructor(private callback: () => void) {}
      observe() {
        resizeCallbacks.add(this.callback);
      }
      unobserve() {}
      disconnect() {
        resizeCallbacks.delete(this.callback);
      }
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
  const root = container.firstElementChild as HTMLElement;
  const parts = Array.from(container.querySelectorAll("*"));
  const hueDisc = parts.find(isHueDisc) as HTMLElement;
  const lightnessRing = parts.find(isLightnessRing) as HTMLElement;
  const update = (next: Color) => rerender(<ColorPicker value={next} onChange={onChange} />);
  return { onChange, root, hueDisc, lightnessRing, update };
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

  it("keeps picking accurate after the picker is resized", () => {
    const { onChange, hueDisc, lightnessRing } = setup({ h: 10, s: 20, l: 50 });
    resize(100, 150); // Hue disc radius 50, ring inner area ends at (50 + 75) / 2 = 62.5px
    expect(hueDisc.style.getPropertyValue("--diff")).toBe("10px"); // 20% of the new radius
    fireEvent.pointerDown(hueDisc, at(25, 0)); // right, half the new radius
    fireEvent.pointerUp(hueDisc, at(25, 0));
    expect(onChange).toHaveBeenLastCalledWith({ h: 90, s: 50, l: 50 });
    onChange.mockClear();
    fireEvent.pointerDown(lightnessRing, at(60, 0)); // inside the new inner area
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.pointerDown(lightnessRing, at(70, 0)); // on the new band
    expect(onChange).toHaveBeenLastCalledWith({ h: 10, s: 20, l: expect.closeTo(50) });
  });

  it("names each part with its own hcp- class", () => {
    const { root, hueDisc, lightnessRing } = setup({ h: 10, s: 20, l: 30 });
    expect(root.classList).toContain("hcp-color-picker");
    expect(hueDisc.querySelectorAll(".hcp-hue-mark")).toHaveLength(1);
    expect(lightnessRing.querySelectorAll(".hcp-lightness-mark")).toHaveLength(1);
  });

  it("renders only hcp- prefixed class names, also while dragging", () => {
    const { root, hueDisc } = setup({ h: 10, s: 20, l: 30 });
    fireEvent.pointerDown(hueDisc, at(0, 0));
    const classes = [root, ...root.querySelectorAll("*")].flatMap((el) => [...el.classList]);
    expect(classes).toContain("hcp-dragging");
    expect(classes.filter((name) => !name.startsWith("hcp-"))).toEqual([]);
  });
});
