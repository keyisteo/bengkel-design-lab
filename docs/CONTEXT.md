# Bengkel Design Lab — Context and Architecture

This document explains the concepts and architecture behind the Design Lab. Read it to understand *why* the lab is structured the way it is before making significant changes.

---

## What is the Design Lab?

The Design Lab is a **multi-project UI prototyping environment**. It renders fully interactive mobile mockups inside a desktop browser frame, paired with living documentation. Each project is a self-contained React app with its own design system, routing, and mock data.

The primary user of the lab is a **human designer or product manager** reviewing screens with a proto-persona. The secondary user is an **AI agent** iterating on the design based on persona feedback.

---

## The Two-Column Layout

```
┌──────────────────────┬────────────────────────────┐
│  Left Sidebar        │  Right Viewport             │
│  340px fixed width   │  Flexible                   │
│                      │                            │
│  - Project switcher  │  ┌────────────────────┐   │
│  - Scenario selector │  │  Mobile mockup      │   │
│  - Stepper dots      │  │  375 × 812px       │   │
│  - Screen docs        │  │  (iPhone frame)     │   │
│  - Persona library    │  └────────────────────┘   │
│                      │                            │
│  Adapts to active    │  Shows the active project │
│  project brand        │  in the current screen     │
└──────────────────────┴────────────────────────────┘
```

**Left sidebar** is always the same DOM — it adapts via props. The brand colors, logo, and content all come from `ProjectConfig`. The project switcher (`ProjectSwitcher.tsx`) is a searchable dropdown that reads all projects from `PROJECT_CONFIGS` dynamically.

**Right viewport** renders the active project's React component inside a 375x812 mobile frame.

---

## Multi-Project Architecture

### How projects are isolated

Each project in `src/projects/<name>/` is a fully independent React app:
- Own routing state (screen state in `index.tsx`)
- Own CSS tokens scoped under `.<project-name>`
- Own page components
- Own mock data

Projects do **not** share state, styles, or components. The only shared infrastructure is:
- The lab shell (`App.tsx`)
- Shared types (`types.ts`)
- Screen documentation data (`data/screenDocs.ts`)
- The component library (`src/components/ui/`)

### Dynamic rendering

Each `ProjectConfig` in `registry.ts` includes a `component` field — the React component to render. `App.tsx` renders it dynamically:

```tsx
const config = PROJECT_CONFIGS[activeProject]
const ProjectApp = config.component
return <ProjectApp screen={screen} onScreenChange={setScreen} />
```

Adding a new project never requires touching `App.tsx`. The registry is the single source of truth.

### How the sidebar adapts

When you switch projects, `App.tsx`:
1. Looks up the `ProjectConfig` from `PROJECT_CONFIGS`
2. Passes `brand`, `scenarios`, `personaIndex`, `personaFiles`, and `projects` to `LeftPanel`
3. Renders the project's component in the viewport

The sidebar reads brand properties directly — no conditional rendering. The project switcher is automatically populated from `PROJECT_CONFIGS` — adding a new config automatically adds it to the dropdown.

---

## Brand System

### ProjectBrand interface

The `ProjectBrand` interface defines how the sidebar adapts to each project:

| Property | Used for |
|---|---|
| `logoChar` | Single character in the sidebar logo circle |
| `accentColor` | Active step dots, selected scenario, CTA buttons in sidebar |
| `accentLight` | Avatar ring color, selection borders |
| `accentMuted` | Secondary accent uses |
| `bgSubtle` | Sidebar background, scenario selector background |
| `bgSubtleAlt` | Secondary subtle surfaces |
| `textPrimary` | Project name, step labels |
| `textSecondary` | Scenario descriptions, inactive labels |
| `textMuted` | Timestamps, helper text |

The sidebar uses inline `style={{ color: brand.accentColor }}` for dynamic values. Dark theme detection uses `isDarkBrand(brand.bgSubtle)` from `src/lib/utils.ts` — it checks luminance, not project IDs.

---

## Routing Architecture

### State-based, not URL-based

Projects use `useState` for routing. This choice was made for simplicity — no React Router, no URL synchronization, no server config.

The `Screen` type is `string` in `src/types.ts`. Each project defines its own screen string literals internally and prefixes them to avoid collisions (e.g., `tugas-home`, `tugas-add`).

### External vs internal navigation

```
User clicks inside mockup → project updates its own screen state → fires onScreenChange → App.tsx updates its screen state
User clicks stepper dot   → App.tsx updates its screen state     → passes new screen prop → project re-renders
```

Both directions work. The project app's `useEffect` watches the external `screen` prop and syncs it internally.

---

## CSS Token Strategy

Each project scopes all CSS custom properties under a unique class:

```css
.tugas {
  --tg-bg: #F8FAFC;
  --tg-primary: #4F46E5;
  ...
}

.my-other-project {
  --mo-bg: #0D0D0D;
  --mo-primary: #E8C84A;
  ...
}
```

This means:
- Tokens are isolated — one project's tokens don't conflict with another's
- The sidebar can reference tokens dynamically for color swatches
- No global namespace pollution

When adding a new project, choose a 2-3 character prefix (e.g., `tg` for "Tugas") and scope all tokens under `.<project-name>`.

---

## Persona System

### Schema

The `LabPersona` type in `types.ts` defines the persona shape with optional fields to accommodate different project needs:

- `trustSignals` — optional
- `bookingBehaviour` — required (can be adapted to any project's context)
- `feedbackHistory` — required, array of screen-level feedback entries

### Where personas are used

- **PersonaPanel** (`src/components/PersonaPanel.tsx`) — renders the sidebar persona library. Reads from JSON files via `personaFiles`.
- **SCREEN_DOCS** (`src/data/screenDocs.ts`) — contains `personaFeedbacks[]` arrays per screen, shown in the docs panel.
- **DECISIONS.md** — references feedback by `feedbackIds` string like `'budi-tugas-home-8'`.

### Updating feedback

When a persona provides feedback on a screen:
1. Append to the JSON file's `feedbackHistory[]`
2. Add to `SCREEN_DOCS.personaFeedbacks[]` for that screen
3. Update `latestScore` in `_index.json`

Both the JSON file and `SCREEN_DOCS` must be kept in sync — the persona panel reads the JSON, the docs panel reads `SCREEN_DOCS`.
