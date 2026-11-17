// jsdom lacks pointer capture; give DOM tests a minimal, observable stand-in.
if (typeof Element !== "undefined" && !Element.prototype.setPointerCapture) {
  const captured = new WeakMap<Element, Set<number>>();
  Element.prototype.setPointerCapture = function (pointerId) {
    const ids = captured.get(this) ?? new Set<number>();
    ids.add(pointerId);
    captured.set(this, ids);
  };
  Element.prototype.releasePointerCapture = function (pointerId) {
    captured.get(this)?.delete(pointerId);
  };
  Element.prototype.hasPointerCapture = function (pointerId) {
    return !!captured.get(this)?.has(pointerId);
  };
}
