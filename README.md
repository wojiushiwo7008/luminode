# Luminode · 智慧路灯 Design System

> A coherent, calm, technical brand for **智慧路灯** — a smart-streetlight IoT product
> that reads sensors and controls hardware over the OneNET cloud. Built for two surfaces:
> a **mobile / kiosk hardware control panel** and a **city operator web dashboard**.

This system was created from scratch (no existing codebase, Figma, or brand was provided),
informed only by one reference screenshot supplied by the user (`assets/reference/user-mobile-ui.jpg`)
and the description "智慧路灯, 接入 OneNET 云平台读取和控制硬件设备".

---

## Sources

| Source | Path / Link | Notes |
|---|---|---|
| User reference UI screenshot | `assets/reference/user-mobile-ui.jpg` | The user's existing mobile screen — basis for the device-card pattern. |
| OneNET cloud platform | https://open.iot.10086.cn/ | Backend integration target. Not visually copied; mentioned for context. |
| Codebase | _none provided_ | Brand is invented from scratch. |
| Figma | _none provided_ | — |

---

## Index — what's in this folder

```
README.md                  — this file (start here)
SKILL.md                   — agent-skill manifest, drop into Claude Code as-is
colors_and_type.css        — design tokens (color, type, spacing, radius, shadow, motion)
fonts/                     — substitution notes (web-loaded via Google Fonts)
assets/
  logo/                    — Luminode wordmark + mark, light & dark
  icons/                   — 30+ custom 1.5px-stroke SVG icons + manifest
  reference/               — user-supplied reference images
preview/                   — design-system tab cards (one HTML per concept)
ui_kits/
  device-panel/            — mobile/kiosk hardware control panel (matches user ref)
  operator-dashboard/      — web dashboard for city operators
```

---

## 1. Brand Identity

**Name:** Luminode (Lumen + Node) · 智慧路灯
**One-liner (EN):** Every lamp, a node. Every street, a signal.
**One-liner (CN):** 每一盏灯，都是一个节点；每一条街，都是一段信号。
**Promise:** Calm, civic, technical. The streetlight is invisible infrastructure; the dashboard makes it legible.

The mark fuses three IoT-native motifs:
1. A **streetlight pole** (the physical thing).
2. A **halo / ring** (the wireless signal radius around it).
3. An **amber data-node** at its center (the lamp's actual lit bulb + a status dot).

Files: `assets/logo/luminode-lockup.svg`, `assets/logo/luminode-mark.svg`,
       `assets/logo/luminode-lockup-dark.svg`.

---

## 2. Content Fundamentals

The product is **bilingual** — Chinese-Simplified primary in mainland deployment,
English-equal in international/marketing contexts. Every UI string ships as a pair.

### Voice & tone

| Trait | Description | Example (CN) | Example (EN) |
|---|---|---|---|
| **Calm** | Never urgent unless something is actually wrong. State facts. | `当前在线 1,284 盏` | `1,284 lamps online` |
| **Civic** | Talks about *the city*, *the street*, *citizens* — not "users". | `本街区今日节能 12%` | `This block saved 12% energy today` |
| **Technical but plain** | Use real units (W, kWh, lux, PM2.5, dBm). Don't dumb down. Don't show off. | `光照度 18.4 lux` | `Illuminance 18.4 lux` |
| **Direct** | "你 / You" sparingly. Most copy is impersonal status. The system narrates the world; it doesn't address the user. | `路灯已开启` | `Streetlight on` |
| **Honest about uncertainty** | Show last-update timestamp. Say "未知 / Unknown" when offline; never fake a value. | `离线 · 最后通讯 12 分钟前` | `Offline · last seen 12m ago` |

### Casing & punctuation

- **Chinese:** sentence-style, no period at the end of UI strings. Use 全角 punctuation in body text (，。；：) and 半角 in tabular data.
- **English:** Sentence case for UI labels (`Energy usage`, not `Energy Usage`). Title case only for proper nouns (Luminode, OneNET).
- Numbers in tables / metrics: tabular figures (the type system enables `font-feature-settings: "tnum"`).
- Units: thin-space between number and unit in EN (`24 °C`); no space in CN (`24°C`).

### Pronouns

We **avoid "you"** in operator surfaces — operators want status, not a chatbot.
The mobile/kiosk surface may use "你 / You" sparingly in onboarding only.

### Emoji

**No emoji in product UI.** Marketing/celebration moments may use a single 🟢 dot status (rendered as SVG, not glyph) — but the brand prefers iconography over emoji. The reference screenshot used a few flat-color domain illustrations (thermometer, fan, etc.) — we replace these with our own line-icon set.

### Sample microcopy (CN / EN)

| Context | Chinese | English |
|---|---|---|
| Lamp turned on | 路灯已开启 | Streetlight on |
| Offline alarm | 设备失联，请检查网络 | Device offline — check connectivity |
| Energy savings | 本月节能 8.4 万度 · 较去年同期下降 14% | Saved 84,000 kWh this month — 14% YoY |
| Empty alert list | 一切正常 | All clear |
| Confirm shutdown | 确定关闭整条街区的路灯吗？ | Turn off every lamp on this block? |

---

## 3. Visual Foundations

### 3.1 Color

Light mode is primary. The palette is built around a **warm-cool dialogue**:
the *Lamp Glow* (mint-teal) reads as the lit bulb of a streetlight at dusk;
the *Civic Indigo* and *Night* deep-blues anchor data and dark surfaces;
the *Sodium Amber* is the legacy-light callback used sparingly for emphasis.

| Token | Hex | Usage |
|---|---|---|
| `--brand-glow` | `#14B8A6` | Primary accent, ON state, brand mark |
| `--brand-glow-deep` | `#0F766E` | Hover on glow, lamp head |
| `--brand-civic` | `#1E40AF` | Links, focus ring, secondary CTA |
| `--brand-amber` | `#F59E0B` | Data-node, "lit" indicator, sparingly |
| `--brand-night` | `#0B1220` | Dark mode bg, deep contrast |
| `--n-50…900` | warm-cool greys | Surface, fg-1/2/3, borders |
| Status | `online / warn / alarm / info / maint` | All paired with a soft-tinted bg |

A **dark-mode variant** is provided (`.theme-dark`) for the operator dashboard's
map/command-center view. Light is the default everywhere else.

### 3.2 Type

| Family | Use |
|---|---|
| **Inter** | Latin UI, headings, metrics |
| **Noto Sans SC** | CJK UI (PingFang SC / HarmonyOS Sans on devices that have them) |
| **JetBrains Mono** | Numeric metrics, tabular figures, sensor readings, log lines |
| **Noto Serif SC** | Reserved for editorial / press / annual-report only — not in product UI |

Bilingual rule: **CJK and Latin share a baseline**, with CJK letter-spacing
slightly opened (0.04–0.08em) to match Inter's optical density.

### 3.3 Spacing & layout

- 4px base grid. Tokens `--sp-1`…`--sp-20`.
- Comfortable density for ops dashboards (16-px row height baseline,
  not 12px Bloomberg-style).
- Cards have **24px internal padding** by default.
- Page gutters: 24px mobile, 32px tablet, 48px desktop.
- Map / command-center pages are **edge-to-edge**; chrome floats over the map.

### 3.4 Cards & surfaces

The signature Luminode card:
- `background: var(--bg-elevated)` (white in light)
- `border: 1px solid var(--border)` (a single hairline, very pale)
- `border-radius: var(--r-lg)` (14px) — softer than enterprise SaaS, less than consumer
- `box-shadow: var(--shadow-sm)` — barely there, just enough to lift
- **No left-border-accent stripe.** Status is shown via a small dot or pill chip,
  never a colored gutter on the card.

### 3.5 Borders, corners, radii

- Inputs / buttons: `--r-md` (10px).
- Cards / panels: `--r-lg` (14px).
- Sheets / modals: `--r-xl` (20px).
- Pills / chips: `--r-pill`.
- Avoid sharp 0px corners except in dense data tables (header divider only).

### 3.6 Shadows

5-step elevation scale (`--shadow-xs` … `--shadow-xl`) plus two specials:
`--shadow-glow` (mint focus halo, used on selected lamp pin or active toggle)
and `--shadow-focus` (civic-indigo focus ring on form elements).
Inner shadow is reserved for inset wells (sliders, segmented controls).

### 3.7 Backgrounds & motifs

- The default page background is **`--bg`** (very pale cool grey, `#F4F6F8`).
- A signature **blueprint grid** texture is used on hero / login / empty-state surfaces:
  a 24-px square grid drawn in `var(--n-100)` at 30% opacity.
- The dashboard map page uses **`--bg-canvas`** (`#F7F9FB`) with the map tiles desaturated.
- **No** hand-drawn illustrations. **No** photography in product UI.
  Marketing pages may use overhead/dusk photography of streetlights —
  always desaturated to 70% with a subtle teal duotone.
- **Avoid:** purple-blue gradients, glassmorphism, neon-on-black — even though we're
  "command center"-adjacent, we keep things calm and legible.

### 3.8 Animation

- Easing: `cubic-bezier(0.22, 1, 0.36, 1)` (out-quart) by default.
- Durations: 120ms (micro), 200ms (default), 360ms (transitions), 520ms (page).
- A single **brand motion**: lamp pins on the map *pulse* their halo at 2s intervals
  when in alarm state; otherwise static. Pulses stop completely after 5 cycles to
  avoid screen anxiety.
- No bounce / spring on production UI. Spring is reserved for the mobile
  toggle thumb only (matches OS feel).
- Hover transitions: opacity / background-color only, never transform.

### 3.9 Hover & press states

| State | Effect |
|---|---|
| Hover (button, card) | Background shifts to `bg-sunken` (or `glow-deep` on solid CTAs); cursor becomes pointer. |
| Press / active | Scale 0.98 on buttons; bg goes one step darker. |
| Focus | 3px civic-indigo ring (`--shadow-focus`), never a teal ring (teal is for *state*, not focus). |
| Disabled | `opacity: 0.4`, no events. |
| Selected (e.g. map pin) | `--shadow-glow` mint halo + `--brand-amber` interior dot. |

### 3.10 Transparency & blur

Used **sparingly**. Two approved uses:
1. **Map chrome** — floating top bar over the map: `rgba(255,255,255,0.78)` + `backdrop-filter: blur(16px)`.
2. **Bottom-sheet protection gradient** on the mobile detail panel — a 24px linear gradient from `bg` to `transparent` so list items don't visually collide with the sheet handle.

No frosted-glass cards. No translucent buttons.

### 3.11 Imagery

If used in marketing: dusk / blue-hour streetlight photography, desaturated to 60–70%, with a teal-to-indigo duotone tint. Grain is allowed (subtle). Never warm orange — that's been retired with sodium-vapor lamps.

---

## 4. Iconography

**Approach:** custom **24×24 line icons, 1.5-px stroke, `currentColor`**. The set covers
brand-domain glyphs (lamp, sensor, fan, sprayer, water-pump, PM2.5, wind, grid, signal)
and a small functional UI set (search, filter, edit, etc.). All in `assets/icons/`.

The reference screenshot used flat-color domain illustrations; we deliberately move to
**stroke icons** because they:
1. Read better at small sizes in dense dashboards.
2. Inherit `currentColor`, so a single SVG works in light/dark/status themes.
3. Compose visually with chart / graph elements better than colored cartoons.

### Style rules

- Stroke `1.5`, `linecap=round`, `linejoin=round`.
- Filled accents (e.g. amber data-node on `streetlight-on`) are reserved for status indication, not decoration.
- Optical alignment matters: square icons should fill a ~16×16 visual rect inside the 24×24 viewBox.
- Domain icons should be unmistakable at 16 px. If an icon needs a label to be read, the icon is wrong — redraw it.

### Manifest

`assets/icons/icons.json` lists every icon with bilingual label and group (`domain` vs `ui`).

### Fallback

For long-tail UI icons not in our set (e.g. a chevron-double, drag-handle), fall back
to **Lucide** (`https://unpkg.com/lucide@latest`) — same 1.5px stroke, same vibe.
**Flagged substitution.** This is acceptable; we will replace with our own as needs grow.

### Emoji & unicode

Not used as iconography in product UI. Acceptable in casual marketing copy only
(e.g. a tweet, a release note); always paired with — or replaceable by — a real icon.

---

## 5. Open caveats

- **Fonts substituted:** Inter (Google Fonts) + Noto Sans SC (Google Fonts) are used
  in place of bespoke web fonts — the user did not provide any. PingFang SC and
  HarmonyOS Sans are listed in the font-stack and will be used on devices that have them.
- **Logo:** drafted from scratch as a placeholder wordmark. Easy to swap out.
- **No real OneNET API mock** — the UI kits show the device-control patterns but
  do not call OneNET. Toggles and sliders are local state.
- **Map tile** in the operator dashboard is rendered as a stylized SVG city plan,
  not a real map (no API key was provided).

---

## 6. Index of files (manifest)

| Folder | What's there |
|---|---|
| `colors_and_type.css` | All tokens. Import this and you have the brand. |
| `assets/logo/` | `luminode-lockup.svg`, `luminode-mark.svg`, `luminode-lockup-dark.svg` |
| `assets/icons/` | 32 SVG icons + `icons.json` manifest |
| `assets/reference/` | User's original mobile screenshot (for reference only) |
| `preview/` | One HTML card per design-system concept (rendered in the Design System tab) |
| `ui_kits/device-panel/` | Mobile / kiosk hardware control panel — `index.html` + JSX components |
| `ui_kits/operator-dashboard/` | City-operator dashboard — `index.html` + JSX components |
| `SKILL.md` | Agent-skill manifest |
