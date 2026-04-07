# Bengkel Design Lab — Agent Guide

This is the **entry point** for any AI agent working in the Design Lab. It's a navigation document — if you need detailed information, it points you to the right file.

---

## Start Here

**New to the Design Lab?** Read `docs/CONTEXT.md` first. It explains the architecture, why decisions were made, and how the pieces fit together.

**Want to add a new project?** Read `docs/NEW-PROJECT.md` end-to-end. It has the complete step-by-step procedure. You can also use the scaffolding script: `./scripts/create-project.sh`

**Want to iterate on a screen with persona feedback?** Read `docs/WORKFLOWS.md`. It covers the full loop from feedback to shipped change.

**Encountering a bug or unexpected behavior?** Check `docs/TROUBLESHOOTING.md`.

**Want to see a working example?** Study `src/projects/tugas/` — it's a fully fleshed to-do list app demonstrating every framework feature.

**Want to run AI persona reviews?** The MCP server at `mcp/persona-review-server.ts` exposes tools for Claude Code to orchestrate persona swarming. See the MCP section below.

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
| How the lab shell works, where to add things | `src/App.tsx` + `src/projects/registry.ts` |
| Shared TypeScript types | `src/types.ts` |
| All screen documentation entries | SQLite via `GET /api/projects/:id/screens` |
| How annotations are stored and retrieved | `server/api-plugin.ts` (SQLite REST API) |
| How persona reviews work | `mcp/persona-review-server.ts` |
| Active PRDs and backlog | `docs/prd/000-backlog-index.md` |

---

## Active Projects

| Project | ID | Brand | Scenarios | Screens |
|---|---|---|---|---|
| Tugas | `tugas` | Indigo/Slate - Light | Happy Path (mobile), Weekly Review (mobile+web), Admin Audit (web) | 4 |

---

## Data Architecture

All project metadata is stored in **SQLite** (`designlab.db`, gitignored) and served via a Vite dev middleware REST API (`server/api-plugin.ts`). React hooks in `src/hooks/use-project-data.ts` fetch this data.

Only **React components** are registered in code (`src/projects/registry.ts`). Everything else — brand, scenarios, personas, screen docs, reviews — lives in the database.

### Database tables

| Table | Purpose |
|---|---|
| `projects` | Project metadata + brand JSON |
| `scenarios` | User flows with views + steps |
| `persona_index` | Persona summary (name, role, archetype, latest score) |
| `personas` | Full persona JSON blobs |
| `screen_docs` | Screen documentation (goal, notes, components, tokens, decisions) |
| `reviews` | AI persona review results (pending/accepted/rejected) |
| `annotation_sessions` | Saved annotation sessions with names |

### REST API endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/projects` | GET | List all projects |
| `/api/projects/:id` | GET | Project detail + scenarios |
| `/api/projects/:id/personas` | GET | Persona index + full files |
| `/api/projects/:id/screens` | GET | All screen docs |
| `/api/projects/:id/reviews` | GET/POST | List or create reviews |
| `/api/reviews/:id` | PATCH | Accept/reject a review |
| `/api/annotations` | POST | Save annotation session |
| `/api/annotations/:projectId` | GET | List past sessions |

### Seeding

Run `npm run seed` to populate the database from the existing TypeScript constants and JSON files. The seed script (`scripts/seed-db.ts`) handles projects, scenarios, personas, screen docs, and internal team personas.

---

## Lab Shell Architecture

The lab shell (`src/App.tsx`) is a thin orchestrator. It:
- Fetches all data from the SQLite REST API via React hooks
- Renders `LeftPanel` with the active project's brand, scenarios, personas, reviews, and active view
- Dynamically renders the active project's component inside a viewport frame — mobile (375x812) or web (scales to fit with preset selector)
- Manages the annotation system: hover highlight, pins, session naming, and persistence via SQLite

```
App.tsx
  └── LeftPanel (brand, scenarios, personas, reviews, activeView)
        ├── ProjectSwitcher
        ├── ScenarioSelector
        ├── DocsPanel (screen docs from API)
        └── PersonaPanel
              ├── Users tab — user persona cards with feedback + AI reviews
              └── Team tab — internal persona cards (UX, accessibility, PM) + AI reviews

  └── [project viewport — mobile or web frame]
        ├── Top bar: annotate toggle, mobile/web switcher, viewport presets (768-1920px)
        ├── config.component (receives screen + view props)
        └── AnnotationLayer (hover highlight + pins, scoped to screen+view)

  └── AnnotationPanel (sidebar, shown when annotating)
        ├── Pin list for current screen+view
        ├── Session name (auto-generated, editable)
        ├── Copy summary (with CSS class selectors for agents)
        ├── Save session (clears after save)
        └── Past sessions (collapsible, with simulate + copy)
```

Adding a new project to the registry automatically:
- Adds it to the project switcher dropdown
- Makes the sidebar adapt to its brand (logo, colors, scenarios, personas)
- Renders its component in the viewport when selected

---

## AI Persona Review System (PRD-002)

The Design Lab supports two types of personas for AI-driven design reviews:

### User personas
Real-world user archetypes (e.g., "Budi Santoso — Junior Developer"). Their reviews produce:
- Score (1-10), likes, missing features, top change request

### Internal team personas
Product team members (e.g., "Ayu Pramesti — Senior UX Designer"). Their reviews produce:
- Findings with severity levels (critical/high/medium/low), summary

### MCP Server

The MCP server (`mcp/persona-review-server.ts`) exposes 7 tools for Claude Code:

| Tool | Purpose |
|---|---|
| `list_project_personas` | Get all user + internal personas for a project |
| `get_persona_profile` | Full persona JSON blob |
| `list_project_screens` | Screens + scenarios for a project |
| `get_screen_doc` | Full screen documentation |
| `get_screen_context` | Comprehensive context (brand + doc + existing reviews) |
| `save_review` | Persist a review to SQLite |
| `list_reviews` | List reviews, optionally filtered by persona |

Configuration is in `.mcp.json` at project root. Claude Code auto-discovers it.

### Review display

Reviews appear in the PersonaPanel with an "AI" badge, expandable detail, and accept/reject buttons for pending reviews. User reviews show score/likes/missing; internal reviews show findings with severity color-coding.

---

## Key File Inventory

```
src/
├── App.tsx                    # Lab shell — view switcher, viewport presets, annotation wiring
├── types.ts                   # Shared types: Screen, Scenario, Annotation, AnnotationSession,
│                              #   Decision, ScreenDoc, LabPersona, ProjectBrand, ProjectAppProps
├── index.css                  # Tailwind v4 entry
├── lib/
│   └── utils.ts              # Utilities: cn(), isDarkBrand()
├── hooks/
│   └── use-project-data.ts   # React hooks for all API data (projects, personas, reviews, etc.)
├── components/
│   ├── LeftPanel.tsx         # Full left sidebar — passes reviews + internal personas down
│   ├── ProjectSwitcher.tsx    # Project dropdown with search
│   ├── ScenarioSelector.tsx  # Scenario dropdown — brand-aware
│   ├── DocsPanel.tsx         # Screen docs view (data from API)
│   ├── PersonaPanel.tsx      # Users/Team tabs, persona cards, AI review cards, accept/reject
│   ├── AnnotationLayer.tsx   # Hover highlight + numbered pins, scoped to screen+view
│   ├── AnnotationPanel.tsx   # Pin list, session naming, copy, save, simulate past sessions
│   └── BottomNav.tsx         # Reusable bottom nav for project pages
└── projects/
    ├── registry.ts           # Component-only registry (all metadata in SQLite)
    └── tugas/                # Example project (fully fleshed)
        ├── index.tsx         # TugasApp + routing
        ├── tugas.css         # CSS tokens scoped under .tugas
        ├── pages/            # All Tugas page components
        ├── data/             # Mock task data
        ├── personas/         # Persona JSON files
        └── annotations/      # .gitkeep; actual data in designlab.db

server/
├── db.ts                     # Shared SQLite database module (WAL mode, foreign keys)
└── api-plugin.ts             # Vite dev middleware — full REST API with prepared statements

mcp/
└── persona-review-server.ts  # MCP server for Claude Code persona review orchestration

scripts/
├── create-project.sh         # Project scaffolding script
└── seed-db.ts                # Seed database from TS constants + JSON files
```

---

## Multi-View System

Scenarios declare which devices they support via the optional `views` field:

```ts
// Mobile only (default if views is absent)
{ id: 'my-flow', views: ['mobile'], steps: [...] }

// Web only
{ id: 'admin-flow', views: ['web'], steps: [...] }

// Both — view switcher pill appears above mockup
{ id: 'review-flow', views: ['mobile', 'web'], steps: [...] }
```

- `activeView` (`'mobile' | 'web'`) is managed in `App.tsx` and resets when the scenario changes
- **Web viewport presets** — when web view is active, a preset selector offers 768 / 1024 / 1280 / 1440 / 1920 px widths
- `ProjectApp` receives `view` as a prop — use it to conditionally adapt layout if needed
- Persona `feedbackHistory` entries can include `view?: 'mobile' | 'web'` — entries without `view` show in both modes (legacy/universal)

## Annotation System

The annotation system lets designers and agents mark up the live mockup:

- **Entering annotate mode** — click the "Annotate" button above the mockup; cursor becomes a crosshair
- **Placing a pin** — hover to highlight an element (inspect-element style), click to drop a pin and type a comment
- **Click-through prevention** — the frame uses `onClickCapture` so annotate-mode clicks never trigger navigation or button actions
- **View scoping** — pins are stored with `screen + view`; switching view shows only that view's pins
- **Session naming** — a fun name is auto-generated on first pin drop (e.g., "curious-platypus-42"), editable in the panel
- **Copy format** for agents:
  ```
  [button.bg-indigo-600 | classes: bg-indigo-600 text-white rounded-lg px-4 py-2]
  "The comment text"
  ```
  Use the class list to `grep` the component file for the element
- **Persistence** — "Save session" writes to SQLite via `POST /api/annotations`. Past sessions are listed from `GET /api/annotations/:projectId`
- **Simulate** — load a past session's annotations back onto the mockup to review them
- **Clear after save** — annotations and session name reset when a session is saved

## Important Conventions

### Dynamic project rendering

Each project registers a React component in `registry.ts`. `App.tsx` renders it dynamically — no hardcoded imports or conditional rendering needed. Adding a new project never requires touching `App.tsx`, only adding to the registry and seeding the database.

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
- Screen docs in the database (runtime, drives the docs panel)

### Persona feedback

Update both the JSON file (`personas/<id>.json`) AND the screen docs in the database.

---

## Common Mistakes

1. **Bottom sheets overflow** — use `position: absolute` within the project container
2. **Persona feedback in only one place** — always update both the JSON file AND screen docs
3. **Missing screen docs entry** — docs panel shows "No documentation" until added to DB
4. **Screen ID collisions** — prefix your project's screens (e.g., `tugas-home`, `myapp-list`)
5. **Hardcoded dark theme check** — use `isDarkBrand()`, not `brand.id === 'some-project'`
6. **Scenario without `views`** — omitting `views` defaults to `['mobile']`; add `views: ['web']` or `['mobile', 'web']` explicitly for web or dual-view scenarios
7. **onClick inside annotate frame** — the frame uses `onClickCapture`; child elements using `e.stopPropagation()` in the capture phase will break annotation. Avoid capture-phase stopPropagation in project components.
8. **Forgetting to seed** — after cloning, run `npm run seed` before `npm run dev`
9. **Hooks before loading guard** — all `useState` calls must be above the early return in `App.tsx`

See `docs/TROUBLESHOOTING.md` for detailed solutions.
