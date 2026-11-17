# Color picker is a published package with a controlled value/onChange API

The Color picker is extracted into `packages/color-picker` (published as `@astalsi401/hsl-color-picker`) inside an npm workspaces monorepo, with the app staying at the repo root as its first consumer. The package knows nothing of the Palette: its API is the controlled `value: Color` / `onChange(color: Color)` pair, even though the app edits colors through `setChannels(Partial<Color>)` — the app adapts at the call site rather than leaking the Palette reducer's vocabulary into a public API.

## Considered Options

- **Separate repo** — rejected: every picker change would need a release before the app could exercise it.
- **Keep `current` / `setChannels`** — rejected: partial-channel patches serve the Palette reducer, not a general consumer, and a public API is hard to change once published.

## Consequences

- Only `ColorPicker` and `Color` are public; the wheel geometry and ring drag stay internal so they can change freely.
- Glossary terms (Hue disc, Lightness ring, Mark) are the public slot names for `classNames` / `styles`, so renaming one is a breaking change.
