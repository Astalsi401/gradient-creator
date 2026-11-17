// Lets `style` props set CSS custom properties (e.g. `--hueR`) without casts.
// Internal only: a .d.ts is not emitted, so the published types carry no augmentation.
import "react";

declare module "react" {
  interface CSSProperties {
    [property: `--${string}`]: string | number | undefined;
  }
}
