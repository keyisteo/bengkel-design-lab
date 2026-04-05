# Design Spec: Annotation System + Multi-View Support

**Date:** 2026-04-05
**Status:** Approved

---

## Overview

Extend the Design Lab with two interrelated features:

1. **Multi-view mockup frame** — scenarios can be mobile-only, web-only, or both. The mockup switches between a 375×812 phone frame and a 1440×900 web canvas. A view switcher appears only when a scenario supports both.
2. **Annotation system** — merge the existing annotation feature from git (commits `9e7d913`, `bd54c83`) and extend it with: view-scoping, JSON archive persistence, and richer copy output that includes CSS class selectors for agent use.

Three showcase scenarios are added to the Tugas project to demonstrate all three view modes.

---

## Section 1: Type System

### `Scenario` (updated)

```ts
export interface Scenario {
  id: string
  label: string
  description: string
  views?: ('mobile' | 'web')[]   // defaults to ['mobile'] if absent
  steps: { screen: Screen; label: string }[]
}
```

`views` is optional and backward-compatible. Any scenario without it is treated as mobile-only.

### `Annotation` (updated)

```ts
export interface Annotation {
  id: number
  x: number              // px from left of mockup container
  y: number              // px from top of mockup container
  elementLabel: string   // tag + first class (e.g. "button.bg-indigo-600")
  elementClasses: string // full class list for copy output
  comment: string
  screen: string
  view: 'mobile' | 'web'
}
```

### `AnnotationSession` (new)

```ts
export interface AnnotationSession {
  projectId: string
  savedAt: string          // ISO 8601 timestamp
  annotations: Annotation[]
}
```

Saved to: `src/projects/<name>/annotations/YYYY-MM-DD-HH-mm.json`

### Persona `feedbackHistory` entry (updated)

```ts
// in LabPersona.feedbackHistory[]
view?: 'mobile' | 'web'   // absent = applies to both / legacy entry
```

### `ProjectAppProps` (updated)

```ts
export interface ProjectAppProps {
  screen?: Screen
  onScreenChange?: (screen: Screen) => void
  view?: 'mobile' | 'web'   // project components may adapt layout
}
```

---

## Section 2: Multi-view Mockup Frame

### Frame sizes

| View   | Width   | Height | Frame style              |
|--------|---------|--------|--------------------------|
| mobile | 375px   | 812px  | `rounded-3xl` phone frame |
| web    | 1440px  | 900px  | `rounded-xl` browser-ish |

The right column in `App.tsx` becomes `overflow-x-auto` so the 1440px web frame is reachable on smaller screens.

### View switcher

- Renders above the mockup as a small two-tab pill: `Mobile | Web`
- Only visible when `activeScenario.views` contains both `'mobile'` and `'web'`
- Switching view keeps the current screen but resets any pending annotation
- If a scenario is single-view, the switcher is hidden and the frame locks to that view

### Active view state

`activeView: 'mobile' | 'web'` lives in `App.tsx`. It resets to the scenario's first supported view whenever the active scenario changes.

`activeView` is passed to:
- The mockup frame (controls dimensions + border-radius)
- `AnnotationLayer` (filters pins by view)
- `LeftPanel` → `PersonaPanel` (filters feedback by view)
- `ProjectApp` (as `view` prop)

---

## Section 3: Annotation System

### Source

Merge `AnnotationLayer.tsx` and `AnnotationPanel.tsx` from git commits `9e7d913` / `bd54c83`. These provide:
- Inspect-element style hover highlight
- Amber numbered pins
- Comment popover (Enter to save, Escape to cancel)
- Side panel listing annotations per screen
- "Copy summary for Claude" button

### View-scoping

`AnnotationLayer` filters saved pins by `annotation.screen === screen && annotation.view === activeView`. Pins from the other view are invisible but not deleted — switching view reveals them.

### Richer copy output

The `buildSummary` function in `AnnotationPanel` is updated to include element context:

```
## Design Feedback — <project> / <screen> / <view>
Annotated: <ISO timestamp>

1. [button.bg-indigo-600 | classes: bg-indigo-600 text-white rounded-lg px-4 py-2 font-medium]
   "CTA label is too generic — change to 'Add Task' not just 'Add'"

2. [div.flex | classes: flex items-center gap-3 border-b border-zinc-200 py-3]
   "Missing priority indicator — Budi won't know urgency at a glance"
```

Format per annotation: `[tag.firstClass | classes: <full-class-list>]` then the comment on the next line. Gives agents enough to `grep` for the class combination.

Sections for "Other screens" follow the same format.

### `getElementLabel` update

Current implementation skips generic tags and grabs one class. Updated to also capture `elementClasses` — the full `el.className` string — stored on the `Annotation` object.

### Archive & persistence

**Auto-save on demand:** A "Save session" button in the `AnnotationPanel` footer writes the current annotations to disk via a `POST /api/annotations` endpoint served by a Vite dev-only middleware registered in `vite.config.ts` under `server.middlewares`. The handler receives `{ projectId, annotations }`, constructs the file path, and writes JSON. File path: `src/projects/<projectId>/annotations/YYYY-MM-DD-HH-mm.json`. Saving does not auto-clear the current session — user clears manually if desired.

**Past sessions in panel:** Below the current annotation list, a collapsible "Past sessions" section loads JSON files for the current project. Reads via a `/api/annotations/<projectId>` list endpoint. Sessions listed by `savedAt` descending. Clicking a session expands it read-only with the same annotation list UI. Each past session has its own "Copy" button.

---

## Section 4: Showcase Scenarios — Tugas

Three scenarios demonstrate all three view modes.

### Scenario 1 — Happy Path (mobile only)
- **ID:** `tugas-happy-path`
- **Views:** `['mobile']`
- **Steps:** Home → Add Task → Detail
- **Story:** User adds and checks a task on their phone
- **Persona feedback:** Budi's existing entries (no `view` field = legacy, treated as mobile)

### Scenario 2 — Weekly Review (mobile + web)
- **ID:** `tugas-weekly-review`
- **Views:** `['mobile', 'web']`
- **Steps:** Home → Stats → Detail
- **Story:** User reviews progress — could be on phone or laptop
- **Persona feedback:** Budi gets two new `feedbackHistory` entries on the Stats screen — one with `view: 'mobile'`, one with `view: 'web'` — demonstrating view-specific persona comments

### Scenario 3 — Admin Audit (web only)
- **ID:** `tugas-admin-audit`
- **Views:** `['web']`
- **Steps:** Stats → Detail
- **Story:** An admin reviewing task data from a desktop dashboard
- **Persona feedback:** New entry with `view: 'web'` on the Stats screen

---

## Section 5: Files to Create / Modify

| File | Change |
|---|---|
| `src/types.ts` | Add `views` to `Scenario`, add `Annotation`, `AnnotationSession`, update `ProjectAppProps` |
| `src/App.tsx` | Add `activeView` state, view switcher UI, pass view to all consumers; merge annotation wiring from git |
| `src/components/AnnotationLayer.tsx` | Merge from git + filter by view + capture `elementClasses` |
| `src/components/AnnotationPanel.tsx` | Merge from git + richer copy output + "Save session" + "Past sessions" |
| `src/components/LeftPanel.tsx` | Accept + pass `activeView` to `PersonaPanel` |
| `src/components/PersonaPanel.tsx` | Filter `feedbackHistory` by `view` (show untagged + matching) |
| `src/projects/registry.ts` | Add `views` to all scenarios; add `tugas-admin-audit` scenario |
| `src/projects/tugas/personas/budi-santoso.json` | Add new `feedbackHistory` entries with `view` fields |
| `vite.config.ts` | Add dev-only middleware for annotation file read/write |
| `src/projects/tugas/annotations/` | New folder, initially empty |

---

## Out of Scope

- Annotation editing (only delete is supported)
- Collaborative annotations / multi-user
- Annotation export to formats other than clipboard text
- CI/CD or automated tests
- The `view` prop causing actual layout differences in project components (project authors may use it but it is not required)
