# Bengkel Design Lab — Agent Guide

This is the **entry point** for any AI agent working in the Design Lab. It's a navigation document — if you need detailed information, it points you to the right file.

---

## Start Here

**New to the Design Lab?** Read `docs/CONTEXT.md` first. It explains the architecture, why decisions were made, and how the pieces fit together.

**Want to add a new project?** Read `docs/NEW-PROJECT.md` end-to-end. It has the complete step-by-step procedure. You can also use the scaffolding script: `./scripts/create-project.sh`

**Want to iterate on a screen with persona feedback?** Read `docs/WORKFLOWS.md`. It covers the full loop from feedback to shipped change.

**Encountering a bug or unexpected behavior?** Check `docs/TROUBLESHOOTING.md`.

**Want to see a working example?** Study `src/projects/tugas/` — it's a fully fleshed to-do list app demonstrating every framework feature.

---

## Quick Reference

### I want to know...

| I want to know... | Read |
|---|---|
| What the Design Lab is and why it's structured this way | `docs/CONTEXT.md` |
| How to add a new project from scratch | `docs/NEW-PROJECT.md` |
| How to scaffold a project quickly | `./scripts/create-project.sh --help` |
| How to add a new screen or scenario | `docs/WORKFLOWS.md` |
| How to log design decisions and persona feedback | `docs/WORKFLOWS.md` |
| Why something isn't working (bottom sheet, routing, types) | `docs/TROUBLESHOOTING.md` |
| What Tugas is, who it's for, business goals | `src/projects/tugas/DESIGN_BRIEF.md` |
| Tugas screen inventory, routing, file layout | `src/projects/tugas/APP_STRUCTURE.md` |
| Tugas color tokens, typography, spacing | `src/projects/tugas/DESIGN_TOKENS.md` |
| Why a Tugas design decision was made | `src/projects/tugas/DECISIONS.md` |
| How the lab shell works, where to add things | `src/projects/registry.ts` |
| Shared TypeScript types (Screen, Scenario, ProjectBrand, etc.) | `src/types.ts` |
| All screen documentation entries | `src/data/screenDocs.ts` |

---

## Active Projects

| Project | ID | Brand | Scenarios | Screens |
|---|---|---|---|---|
| Tugas | `tugas` | Indigo/Slate · Light | Happy Path, Weekly Review | 4 |

---

## Lab Shell Architecture

The lab shell (`src/App.tsx`) is a thin orchestrator. It:
- Reads all projects from `PROJECT_CONFIGS` in `registry.ts`
- Renders `LeftPanel` with the active project's brand, scenarios, and personas
- Dynamically renders the active project's component inside the mobile viewport frame

Per-project data lives in `src/projects/registry.ts` (`PROJECT_CONFIGS`) — brand, scenarios, personas, and the React component. The sidebar components (`LeftPanel`, `DocsPanel`, `PersonaPanel`) receive this data as props.

```
App.tsx
  └── LeftPanel (brand, scenarios, personas)
        ├── ProjectSwitcher (reads PROJECT_CONFIGS dynamically)
        ├── ScenarioSelector
        ├── DocsPanel (reads SCREEN_DOCS from data/screenDocs.ts)
        └── PersonaPanel (reads personaFiles from registry.ts)

  └── [project viewport]
        └── config.component (dynamically rendered from registry)
```

Adding a new project to the registry automatically:
- Adds it to the project switcher dropdown
- Makes the sidebar adapt to its brand (logo, colors, scenarios, personas)
- Renders its component in the viewport when selected

---

## Key File Inventory

```
src/
├── App.tsx                    # Lab shell — dynamic viewport + LeftPanel wiring
├── types.ts                   # Shared types: Screen, Scenario, Decision, ScreenDoc, LabPersona, ProjectBrand, ProjectAppProps
├── lib/
│   └── utils.ts              # Utilities: cn(), isDarkBrand()
├── data/
│   └── screenDocs.ts         # SCREEN_DOCS lookup table — one entry per screen, drives the docs panel
├── components/
│   ├── LeftPanel.tsx         # Full left sidebar — receives brand/scenarios/personas as props
│   ├── ProjectSwitcher.tsx    # Project dropdown with search — reads PROJECT_CONFIGS dynamically
│   ├── ScenarioSelector.tsx  # Scenario dropdown — brand-aware
│   ├── DocsPanel.tsx         # Screen docs view — brand-aware (uses accentColor for highlights)
│   ├── PersonaPanel.tsx      # Persona library — reads from personaFiles (JSON)
│   └── BottomNav.tsx         # Reusable bottom nav for project pages
└── projects/
    ├── registry.ts           # ProjectConfig for all projects — brand + scenarios + personas + component
    └── tugas/                # Example project (fully fleshed)
        ├── index.tsx         # TugasApp + routing
        ├── tugas.css         # CSS tokens scoped under .tugas
        ├── pages/            # All Tugas page components
        ├── data/             # Mock task data
        └── personas/         # _index.json + budi-santoso.json
```

---

## Important Conventions

### Dynamic project rendering

Each project registers a `component` field in its `ProjectConfig`. `App.tsx` renders it dynamically — no hardcoded imports or conditional rendering needed. Adding a new project never requires touching `App.tsx`.

### Screen type

`Screen` is `string` in `src/types.ts`. Each project defines its own screen strings internally (e.g., `'tugas-home'`, `'tugas-add'`). Prefix screen IDs with your project's short name to prevent collisions.

### CSS tokens

Every project scopes tokens under its root class (`.tugas`, `.my-app`). Always use these tokens in components — never raw hex values — so the sidebar can pick up color previews.

### Dark theme detection

Use `isDarkBrand(brand.bgSubtle)` from `src/lib/utils.ts` to detect dark themes. Do not hardcode project IDs for dark theme checks.

### Routing

No React Router. Screen changes are state updates:

```tsx
const go = (s: string) => {
  setScreen(s)
  onScreenChange?.(s)
}
```

### Sticky footers

Use `flex flex-col min-h-screen` + `sticky bottom-0`. **Never use `position: fixed`** — it escapes the mobile viewport mockup.

### Bottom sheets and modals

Use `position: absolute` within the project container, NOT `position: fixed`. Set the container to `position: relative; overflow: hidden`.

### Decision log

Every design change prompted by persona feedback goes in both:
- `DECISIONS.md` in the project folder (human-readable)
- `SCREEN_DOCS` in `src/data/screenDocs.ts` (runtime, drives the docs panel)

### Persona feedback

Update both the JSON file (`personas/<id>.json`) AND `SCREEN_DOCS.personaFeedbacks[]`.

---

## Common Mistakes

1. **Bottom sheets overflow** — use `position: absolute` within the project container
2. **Persona feedback in only one place** — always update both the JSON file AND `SCREEN_DOCS.personaFeedbacks[]`
3. **Missing SCREEN_DOCS entry** — docs panel shows "No documentation" until added
4. **Screen ID collisions** — prefix your project's screens (e.g., `tugas-home`, `myapp-list`)
5. **Hardcoded dark theme check** — use `isDarkBrand()`, not `brand.id === 'some-project'`

See `docs/TROUBLESHOOTING.md` for detailed solutions.
