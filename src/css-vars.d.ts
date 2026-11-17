// Lets `style` props set CSS custom properties (e.g. `--gradient`) without casts.
import "react";

declare module "react" {
  interface CSSProperties {
    [property: `--${string}`]: string | number | undefined;
  }
}
