# PRD-011: Design Token Visualizer & Editor

## Summary
A visual editor for design tokens that shows the project's entire token system — colors, typography, spacing, radii, shadows — as an interactive palette. Edit tokens visually (color picker, slider for spacing) and see changes reflected live in the mockup.

## Problem
- Design tokens are defined in CSS files and `DESIGN_TOKENS.md` — you need to read code to understand the system.
- Tweaking a token (e.g., adjusting accent color) requires editing CSS, saving, and checking the result.
- There's no bird's-eye view of the token system: which colors exist, how they relate, what the type scale looks like.

## Goals
1. Parse the project's CSS file and render all tokens as a visual palette.
2. Color tokens: swatch grid with hex/rgb values, contrast ratios between pairs.
3. Typography tokens: rendered type scale samples ("Aa" in each weight/size).
4. Spacing tokens: visual ruler showing the spacing scale.
5. Live edit: click a swatch → color picker → CSS custom property updates in real-time.
6. Export: generate updated CSS file with new token values.

## Non-Goals
- Creating tokens from scratch (edit existing ones only).
- Cross-project token inheritance or aliasing.
- Runtime token switching (dark mode themes).

## Proposed Solution

### Token Parser
```ts
interface ParsedTokens {
  colors: { name: string; value: string; variable: string }[]
  typography: { name: string; family: string; size: string; weight: string; lineHeight: string }[]
  spacing: { name: string; value: string }[]
  radii: { name: string; value: string }[]
  shadows: { name: string; value: string }[]
}
```

Parse from:
1. Project's `.css` file (`:root` or scoped selector custom properties).
2. Tailwind config extensions (if any).

### Live Editing
- When a token value changes in the editor, update the CSS custom property via `document.documentElement.style.setProperty()`.
- Changes are temporary (in-memory) until "Save" is clicked.
- "Save" writes the updated CSS file to disk via the existing Vite middleware.
- "Reset" reverts to the file's saved values.

### Contrast Checker
- For every color pair (text on background), compute WCAG contrast ratio.
- Flag pairs that fail AA (< 4.5:1 for normal text, < 3:1 for large text).
- Visual indicator: green check / red warning on each pair.

### UI
- "Tokens" tab in the docs panel.
- Sections: Colors, Typography, Spacing, Shadows.
- Each token: visual preview + name + value + edit button.
- Color picker: embedded, appears on click.
- Contrast matrix: expandable grid of text/bg combinations.

## Success Criteria
- Parses 100% of CSS custom properties from project CSS files.
- Live edits reflect in the mockup within 100ms.
- Contrast checker matches WebAIM's calculator results.

## Risks
- Tailwind v4 uses `@theme` directive — parser needs to handle this format.
- Some tokens may be computed (e.g., `oklch()`) — color picker must support modern color spaces.

## Effort Estimate
**M (1–2 weeks)** — CSS parser, visual palette UI, color picker integration, live editing, contrast checker.
