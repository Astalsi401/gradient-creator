// jsdom lacks pointer capture; give DOM tests a minimal, observable stand-in.
if (typeof Element !== "undefined" && !Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = function (pointerId) {
    (this._captured ??= new Set()).add(pointerId);
  };
  Element.prototype.releasePointerCapture = function (pointerId) {
    this._captured?.delete(pointerId);
  };
  Element.prototype.hasPointerCapture = function (pointerId) {
    return !!this._captured?.has(pointerId);
  };
}
