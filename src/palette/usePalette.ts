import { useMemo, useReducer } from "react";
import { initialPalette, paletteReducer, toCss, type Color } from "./palette";

export default function usePalette() {
  const [palette, dispatch] = useReducer(paletteReducer, initialPalette);
  const intents = useMemo(
    () => ({
      add: () => dispatch({ type: "add" }),
      remove: (id: number) => dispatch({ type: "remove", id }),
      select: (id: number) => dispatch({ type: "select", id }),
      setChannels: (channels: Partial<Color>) => dispatch({ type: "setChannels", channels }),
      setAngle: (value: number) => dispatch({ type: "setAngle", value }),
    }),
    []
  );
  // The reducer only ever points currentId at an existing color.
  const current = palette.colors.find((c) => c.id === palette.currentId)!;
  return { palette, current, css: toCss(palette), ...intents };
}
