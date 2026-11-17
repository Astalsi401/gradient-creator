# Gradient Creator

A tool for composing a CSS gradient from a set of HSL colors and copying the result.

## Language

**Color**:
A single HSL value — hue, saturation and lightness — with no identity of its own.
_Avoid_: Swatch, HSL (as a noun)

**PaletteColor**:
A Color placed in the Palette, carrying an identity so it can be selected, edited or removed.
_Avoid_: Swatch, stop, entry

**Palette**:
The ordered PaletteColors that make up the gradient, together with the gradient's angle and which PaletteColor is current.

**Current color**:
The one PaletteColor in the Palette that is being edited; selecting a PaletteColor makes it current.
_Avoid_: Selected color, active color

### Color picker

**Hue disc**:
The round area where hue (angle) and saturation (distance from center) of the Current color are picked.
_Avoid_: Color wheel, hue wheel

**Lightness ring**:
The ring around the Hue disc where lightness is picked; its left and right halves mirror each other, dark at the top and light at the bottom.
_Avoid_: Lightness wheel, lightness slider

**Mark**:
The dot on the Hue disc or Lightness ring showing where the Current color sits.
_Avoid_: Handle, thumb, cursor
