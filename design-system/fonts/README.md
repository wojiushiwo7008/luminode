# Fonts

This project uses Google Fonts loaded via `@import` from `colors_and_type.css`:

- **Inter** — Latin UI, headings, metrics
- **Noto Sans SC** — Chinese (Simplified) UI
- **Noto Serif SC** — editorial only
- **JetBrains Mono** — numeric / mono / log

## Substitutions flagged for the user

No font files were provided by the user. The above are reasonable defaults:

| Intended (typical CN-IoT) | Substitute we use | Why |
|---|---|---|
| HarmonyOS Sans / PingFang SC | **Noto Sans SC** | Closest free Google-Fonts equivalent for CJK at all weights. |
| SF Pro / system-ui | **Inter** | Free, geometric, neutral, ships every weight we need. |
| SF Mono / Monaco | **JetBrains Mono** | Free, tabular, distinguishes 0/O and 1/l/I. |

If you have licensed copies of HarmonyOS Sans, PingFang SC, or a custom display
face, drop the `.ttf` / `.woff2` files into this folder and replace the
`@import` block at the top of `colors_and_type.css` with `@font-face` declarations.

The font-stack in `--font-cjk`, `--font-latin`, etc. already lists the licensed
faces *first*, so they'll be picked up automatically on devices that have them.
