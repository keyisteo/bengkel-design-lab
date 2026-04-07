# PRD-004: Figma Import/Export Bridge

## Summary
Two-way sync between Bengkel Design Lab and Figma. Import Figma frames as reference images overlaid on the mockup for pixel-comparison. Export the live mockup as a Figma-compatible format (SVG layers or Figma plugin payload) so design artifacts can flow back to the broader team's Figma workspace.

## Problem
- Many design teams use Figma as the system of record. The lab operates in isolation.
- Designers want to compare their coded prototype against a Figma comp pixel-for-pixel.
- Sharing prototypes with non-technical stakeholders currently means "look at localhost" or deploy.

## Goals
1. **Import:** Paste a Figma frame URL → fetch the frame as PNG → overlay on the mockup with adjustable opacity for comparison.
2. **Export:** Capture the mockup as layered SVG and push to a Figma file via the Figma REST API.
3. **Reference panel:** Show the Figma frame alongside the live mockup in a split view.

## Non-Goals
- Full design-to-code conversion (Figma → React components).
- Real-time sync (manual trigger only).
- Replacing Figma as the design tool.

## Proposed Solution

### Import Flow
1. User pastes a Figma file URL + frame node ID.
2. Backend calls Figma Images API (`GET /v1/images/:file_key?ids=:node_id&format=png`).
3. PNG is cached locally and displayed as a semi-transparent overlay on the mockup.
4. Overlay controls: opacity slider, toggle on/off, nudge offset.

### Export Flow
1. User clicks "Export to Figma."
2. System captures the mockup DOM, converts to SVG using `html-to-image`.
3. SVG is uploaded to a Figma file via the Figma Plugin API or a companion Figma plugin.
4. Alternative: download as SVG/PNG for manual import.

### Configuration
```ts
interface FigmaConfig {
  personalAccessToken: string  // stored in .env, never committed
  defaultFileKey?: string
}
```

### UI
- "Figma" tab in the docs panel.
- Import: URL input + "Fetch Frame" button.
- Overlay toggle button in the mockup toolbar.
- Export: "Export to Figma" button with format picker.

## Success Criteria
- Import a Figma frame and overlay it in under 5 seconds.
- Overlay alignment is pixel-accurate at 1x scale.
- Export produces a clean SVG that opens correctly in Figma.

## Risks
- Figma API rate limits (30 req/min for personal tokens) — cache aggressively.
- SVG export fidelity: Tailwind utility classes don't map cleanly to SVG — accept "good enough" fidelity.
- Figma token security: must be in `.env`, never in client code.

## Dependencies
- Figma Personal Access Token from the user.
- `html-to-image` or `dom-to-svg` npm package.

## Effort Estimate
**XL (4+ weeks)** — Figma API integration, overlay system, SVG export pipeline, Figma plugin (optional).
