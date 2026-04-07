# Bengkel Design Lab

A multi-project UI prototyping workbench for AI agents and designers.

<!-- TODO: Add screenshot of the two-column layout with Tugas project -->

---

## What is this?

Bengkel Design Lab renders fully interactive mobile mockups inside a desktop browser frame, paired with living documentation. Each project is a self-contained React app with its own design system, routing, and mock data. An AI agent (or human designer) can iterate on screens, collect persona feedback, and track design decisions — all within the lab.

The name "bengkel" means "workshop" in Indonesian. This is where you tinker.

## Features

- **Multi-project switching** — add as many projects as you want, switch between them from a searchable dropdown
- **Multi-view mockups** — scenarios declare their supported devices: mobile only (375×812), web only (1440×900), or both with a live view switcher. The web canvas scales responsively to your viewport.
- **Annotation system** — enter annotate mode to hover-highlight any element (inspect-element style), drop numbered pins, and write comments. Copy the full summary with CSS class selectors so agents know exactly which element to change.
- **Session archive** — save annotation sessions to SQLite (`annotations.db`); past sessions are listed in the panel by date and are copyable at any time.
- **Persona feedback system** — proto-personas review your screens with scores, likes, friction points, and top-change requests. Feedback can be scoped to a specific view (mobile or web).
- **Scenario stepper** — define user flows (happy path, edge cases) and step through them with clickable dots
- **Design token scoping** — each project gets its own CSS custom properties, fully isolated
- **Screen documentation** — every screen has structured docs: goal, design notes, component list, token references
- **Decision logging** — track every design decision with rationale, status, and links to the persona feedback that prompted it
- **Collapsible panels** — collapse the left docs panel and right annotation panel to give the mockup full screen space

## Quick Start

```bash
git clone https://github.com/YOUR_USERNAME/bengkel-design-lab.git
cd bengkel-design-lab
npm install
npm run dev
```

Open `http://localhost:5173` — you'll see the Tugas (to-do list) example project.

## For AI Agents

> **Start here:** Tell your agent to read `AGENTS.md` — it's the entry point for all framework documentation.

One-command setup:

```bash
git clone https://github.com/YOUR_USERNAME/bengkel-design-lab.git && cd bengkel-design-lab && npm install && npm run dev
```

Your agent can then:
1. Read `AGENTS.md` to understand the framework
2. Read `docs/NEW-PROJECT.md` for the step-by-step guide to adding a project
3. Run `./scripts/create-project.sh` to scaffold a new project
4. Study the `src/projects/tugas/` example to see every pattern in action

## Creating Your First Project

The fastest way to start:

```bash
# Scaffold a new project
./scripts/create-project.sh my-app "My App" "One-line description" M "#4F46E5"

# This creates:
# src/projects/my-app/
#   ├── index.tsx          (entry point with routing)
#   ├── my-app.css         (design tokens)
#   ├── pages/             (empty, ready for screens)
#   ├── personas/          (empty index)
#   └── data/              (empty, ready for mock data)
```

Then follow `docs/NEW-PROJECT.md` for the full walkthrough. The Tugas project (`src/projects/tugas/`) is a fully fleshed reference — study it to see how every piece connects.

## Project Structure

```
bengkel-design-lab/
├── AGENTS.md                          # Agent entry point — start here
├── docs/
│   ├── CONTEXT.md                     # Architecture and concepts
│   ├── NEW-PROJECT.md                 # Step-by-step project creation guide
│   ├── WORKFLOWS.md                   # Day-to-day iteration workflows
│   └── TROUBLESHOOTING.md             # Common problems and solutions
├── scripts/
│   └── create-project.sh             # Project scaffolding script
├── src/
│   ├── App.tsx                        # Lab shell — dynamically renders any project
│   ├── types.ts                       # Shared types (Screen, Scenario, ProjectBrand, etc.)
│   ├── data/
│   │   └── screenDocs.ts             # Screen documentation (drives the docs panel)
│   ├── components/
│   │   ├── LeftPanel.tsx             # Full left sidebar
│   │   ├── ProjectSwitcher.tsx       # Searchable project dropdown
│   │   ├── ScenarioSelector.tsx      # Scenario dropdown
│   │   ├── DocsPanel.tsx             # Screen docs view
│   │   ├── PersonaPanel.tsx          # Persona library (view-filtered)
│   │   ├── AnnotationLayer.tsx       # Hover highlight + pin overlay on mockup
│   │   └── AnnotationPanel.tsx       # Annotation list, copy, session archive
│   └── projects/
│       ├── registry.ts               # Project registry — add your project here
│       └── tugas/                     # Example project (to-do list)
│           ├── index.tsx             # Entry point + routing
│           ├── tugas.css             # Design tokens
│           ├── pages/                # Screen components
│           ���── data/                 # Mock data
│           ├── personas/             # Persona JSON files
│           ├── DESIGN_BRIEF.md       # What, who, why
│           ├── APP_STRUCTURE.md      # Screen inventory + routing
│           ├── DESIGN_TOKENS.md      # Color, typography, spacing
│           └── DECISIONS.md          # Design decision log
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Tech Stack

- **Vite** — build tool and dev middleware host
- **React 18** — UI framework
- **TypeScript** — type safety
- **Tailwind CSS v4** — utility styles
- **shadcn/ui** — component library (in `src/components/ui/`)
- **Radix UI** — headless components
- **Lucide** — icons
- **better-sqlite3** — annotation session persistence (dev only)

## License

MIT
