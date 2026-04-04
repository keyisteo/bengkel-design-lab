# Bengkel Design Lab — Open Source Release Design

**Date:** 2026-04-04
**Status:** Approved

---

## Overview

Prepare the Design Lab for public GitHub release as **Bengkel Design Lab** — a multi-project UI prototyping workbench for AI agents and designers. The repo ships with one fully fleshed example project (Tugas — a to-do list app) and no personal projects (Ketemoo, Jejak Pijar are gitignored).

---

## Section 1: Dynamic Project Rendering

### Problem

`App.tsx` hardcodes project imports and conditional rendering. Adding a project requires editing `App.tsx`. The `Screen` type lives in `ketemoo/index.tsx` and forces all projects to add their screen IDs to a single union in another project's file.

### Solution

1. **Add `component` field to `ProjectConfig`** in `registry.ts` — each project registers its React component.
2. **`App.tsx` renders dynamically** from the registry:
   ```tsx
   const config = PROJECT_CONFIGS[activeProject]
   const ProjectApp = config.component
   return <ProjectApp screen={screen} onScreenChange={setScreen} />
   ```
3. **`Screen` becomes `string`** in `types.ts` — no central union. Each project defines its own screen string literals internally.
4. **Remove `ProjectId` union type** — no longer needed.

### Files changed

- `src/types.ts` — `Screen` becomes `string`, remove `ProjectId`, remove ketemoo import
- `src/projects/registry.ts` — add `component: React.ComponentType<ProjectAppProps>` to `ProjectConfig`
- `src/App.tsx` — dynamic rendering, remove hardcoded imports

---

## Section 2: Example Project — Tugas

A fully fleshed to-do list app demonstrating every framework feature.

### Identity

- **Name:** Tugas
- **ID:** `tugas`
- **Tagline:** Simple Task Manager
- **Logo char:** `T`
- **CSS prefix:** `--tg-`
- **Palette:** Indigo/slate — primary `#4F46E5`, surface `#F8FAFC`, text `#1E293B`

### Screens

| Screen ID | Name | Purpose |
|---|---|---|
| `tugas-home` | Home | Task list with All/Active/Done filters, counts, empty state |
| `tugas-add` | Add Task | Form: title, priority (Low/Med/High), due date |
| `tugas-detail` | Task Detail | Full view, mark complete, edit, delete |
| `tugas-stats` | Stats | Completed vs pending, streak, priority breakdown |

### Scenarios

1. **Happy Path** (`tugas-happy-path`): Home → Add Task → Home → Task Detail
2. **Weekly Review** (`tugas-weekly-review`): Home → Stats → Task Detail

### Persona

**Budi Santoso** — 24yo junior developer, Bandung. Uses sticky notes, wants something simple.
- Full `bookingBehaviour` (adapted as `taskBehaviour` conceptually but keeps the schema)
- `feedbackHistory` entries for all 4 screens
- `trustSignals` with `mustHave` and `killsIt`
- Included in `_index.json` with `latestScore`

### Mock Data

- 5-6 sample tasks with varying priorities, dates, and completion states
- Enough to make filters and stats meaningful

### Design Docs

Full set in `src/projects/tugas/`:
- `DESIGN_BRIEF.md` — what, who, why
- `APP_STRUCTURE.md` — screen inventory, routing, file layout
- `DESIGN_TOKENS.md` — color palette, typography, spacing
- `DECISIONS.md` — 3-4 design decisions with rationale

### Screen Docs

Every screen gets a `SCREEN_DOCS` entry with:
- Goal, description, design notes
- Component list, token references
- At least 1 decision per screen
- Persona feedback from Budi

---

## Section 3: Documentation & README

### README.md

1. Hero — "Bengkel Design Lab" + one-liner
2. Screenshot placeholder
3. What is this? — 3-4 sentences
4. Features — bullet list (multi-project, personas, scenarios, tokens, docs, decisions)
5. Quick Start — clone, install, dev
6. For AI Agents — callout to AGENTS.md, one-command setup
7. Creating Your First Project — pointer to docs/NEW-PROJECT.md + Tugas reference
8. Project Structure — tree diagram
9. Tech Stack — Vite, React 18, TypeScript, Tailwind v4, shadcn/ui
10. License — MIT

### AGENTS.md

Rewritten for open-source context:
- No references to Ketemoo or Jejak Pijar
- Active Projects table shows only Tugas
- File inventory updated
- Quick Reference table updated

### docs/ updates

- `CONTEXT.md` — genericized, examples reference Tugas
- `NEW-PROJECT.md` — examples reference Tugas
- `WORKFLOWS.md` — genericized examples
- `TROUBLESHOOTING.md` — minimal changes (already generic)

### scripts/create-project.sh

Scaffolding script:
```bash
./scripts/create-project.sh my-app "My App" "App tagline" M "#4F46E5"
```

Creates:
- `src/projects/<name>/` folder structure (index.tsx, css, pages/, personas/, data/)
- Boilerplate entry component with routing
- CSS tokens file with provided accent color
- Empty persona index `_index.json`
- Registers in `registry.ts` (appends config + import)
- Empty `SCREEN_DOCS` placeholder

---

## Section 4: Gitignore & Cleanup

### .gitignore additions

```
src/projects/ketemoo/
src/projects/jejak-pijar/
```

### Files cleaned for public version

| File | Change |
|---|---|
| `src/data/screenDocs.ts` | Remove Ketemoo + Jejak Pijar entries, keep only Tugas |
| `src/projects/registry.ts` | Remove personal project configs/imports, keep only Tugas |
| `src/types.ts` | `Screen = string`, remove ketemoo import, remove `ProjectId` |
| `index.html` | Title → "Bengkel Design Lab" |
| `package.json` | Name → `bengkel-design-lab` |

### Untouched

- `src/components/` — all shared components
- `src/components/ui/` — shadcn library
- `src/hooks/`, `src/lib/` — utilities
- `src/index.css` — global styles

### Local divergence strategy

The committed `registry.ts` only has Tugas. Locally, the user keeps their modified `registry.ts` uncommitted — git shows it as modified but it stays local. Personal project folders are gitignored so they're invisible to git entirely.

---

## Out of Scope

- CI/CD pipeline
- Automated tests
- npm publishing
- GitHub Actions
- Contributing guide (can be added later)
