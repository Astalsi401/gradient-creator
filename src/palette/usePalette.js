import { useMemo, useReducer } from "react";
import { initialPalette, paletteReducer, toCss } from "./palette";

export default function usePalette() {
  const [palette, dispatch] = useReducer(paletteReducer, initialPalette);
  const intents = useMemo(
    () => ({
      add: () => dispatch({ type: "add" }),
      remove: (id) => dispatch({ type: "remove", id }),
      select: (id) => dispatch({ type: "select", id }),
      setChannels: (channels) => dispatch({ type: "setChannels", channels }),
      setAngle: (value) => dispatch({ type: "setAngle", value }),
    }),
    []
  );
  const current = palette.colors.find((c) => c.id === palette.currentId);
  return { palette, current, css: toCss(palette), ...intents };
}
