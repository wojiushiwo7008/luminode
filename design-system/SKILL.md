# SKILL.md — Luminode 智慧路灯 Design System

> Drop this folder into a project and Claude Code (or any agent) will know
> how to build for the Luminode brand.

## What this is

Luminode is a smart-streetlight IoT product that talks to OneNET.
Two surfaces:
- **Mobile / kiosk hardware-control panel** (`ui_kits/device-panel/`)
- **City operator web dashboard** (`ui_kits/operator-dashboard/`)

Light-mode primary; bilingual (CN + EN, equal weight); calm + civic + technical tone.

## Quick-start

1. Import tokens: `<link rel="stylesheet" href="colors_and_type.css">`
2. Use `var(--brand-glow)`, `var(--fg-1)`, `var(--sp-4)`, etc — never hex values.
3. Icons: `<img src="assets/icons/<name>.svg">` (line, currentColor, 24×24).
4. Logo: `assets/logo/luminode-lockup.svg` (light) or `-dark.svg`.
5. Read `README.md` for full content / voice / motion rules.

## Hard rules

- **Never** invent new colors — use tokens. If a needed token is missing, add it to `colors_and_type.css`.
- **Never** use emoji in product UI. Marketing only.
- **Never** use purple-blue gradients, glassmorphism, or neon-on-black, even though we're "command center"-adjacent.
- **Always** ship strings as `中文 / English` pairs. CN is primary in mainland UI.
- **Always** use tabular figures (`font-feature-settings: "tnum"` or `var(--font-mono)`) for metrics.
- **Always** show last-update timestamps on live data. Never fake values.

## Voice

Calm. Civic. Technical-but-plain. The system narrates the world; it doesn't address the user.
- Say `1,284 路灯在线`, not `You have 1,284 active devices 🎉`.
- Say `设备失联，请检查网络`, not `哎呀，设备好像断网了 😅`.

## Components on hand

Look at `preview/` for visual examples of every token.
Look at `ui_kits/*/app.jsx` for working React patterns.
Look at `assets/icons/icons.json` for the icon manifest.

## Substitutions flagged

- Fonts: Inter + Noto Sans SC + JetBrains Mono via Google Fonts.
  Replace with HarmonyOS Sans / PingFang SC / SF Mono if licensed.
- Map: stylized SVG (no real tile API). Wire to a real map provider later.
- OneNET: not actually called; toggles are local state.
- Logo: placeholder wordmark. Easy to swap.
