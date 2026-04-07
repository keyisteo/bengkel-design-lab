# Bengkel Design Lab

A multi-project UI prototyping workbench for AI agents and designers.

---

## What is this?

Bengkel Design Lab renders fully interactive mockups inside a desktop browser frame, paired with living documentation and AI-powered design reviews. Each project is a self-contained React app with its own design system, routing, and mock data. An AI agent (or human designer) can iterate on screens, collect persona feedback, run AI design critiques, and track design decisions — all within the lab.

The name "bengkel" means "workshop" in Indonesian. This is where you tinker.

## Features

- **Multi-project switching** — add as many projects as you want, switch between them from a searchable dropdown
- **Multi-view mockups** — scenarios declare their supported devices: mobile only (375x812), web only, or both with a live view switcher
- **Web viewport presets** — switch between 768 / 1024 / 1280 / 1440 / 1920 px widths when viewing web layouts
- **Annotation system** — enter annotate mode to hover-highlight any element, drop numbered pins, and write comments. Copy the full summary with CSS class selectors so agents know exactly which element to change
- **Session naming & archive** — annotation sessions get auto-generated names (e.g., "curious-platypus-42"), saved to SQLite, and can be loaded back for review
- **AI persona review engine** — two persona types (user-based and internal product team) review screens via an MCP server that Claude Code can orchestrate
- **Persona feedback system** — proto-personas review your screens with scores, likes, friction points, and top-change requests, scoped to specific views
- **Scenario stepper** — define user flows and step through them with clickable dots
- **Design token scoping** — each project gets its own CSS custom properties, fully isolated
- **Screen documentation** — every screen has structured docs: goal, design notes, component list, token references
- **Decision logging** — track every design decision with rationale, status, and links to the persona feedback that prompted it
- **Collapsible panels** — collapse the left docs panel and right annotation panel for full-screen mockup space
- **SQLite data layer** — all project metadata stored in SQLite with a REST API, seeded from code

## Quick Start

```bash
git clone https://github.com/YOUR_USERNAME/bengkel-design-lab.git
cd bengkel-design-lab
npm install
npm run seed    # populate the SQLite database
npm run dev
```

Open `http://localhost:5173` — you'll see the Tugas (to-do list) example project.

## For AI Agents

> **Start here:** Tell your agent to read `AGENTS.md` — it's the entry point for all framework documentation.

One-command setup:

```bash
git clone https://github.com/YOUR_USERNAME/bengkel-design-lab.git && cd bengkel-design-lab && npm install && npm run seed && npm run dev
```

Your agent can then:
1. Read `AGENTS.md` to understand the framework
2. Read `docs/NEW-PROJECT.md` for the step-by-step guide to adding a project
3. Run `./scripts/create-project.sh` to scaffold a new project
4. Study the `src/projects/tugas/` example to see every pattern in action

### AI Persona Reviews (MCP)

The Design Lab includes an MCP server for AI-driven design critique. Claude Code can:
1. List personas and screen context via MCP tools
2. Simulate reviews as each persona (user-based or internal team)
3. Save reviews to the database — they appear in the PersonaPanel with accept/reject controls

Configuration is auto-discovered from `.mcp.json` at project root.

## Creating Your First Project

The fastest way to start:

```bash
# Scaffold a new project
./scripts/create-project.sh my-app "My App" "One-line description" M "#4F46E5"

# Then seed it into the database
npm run seed
```

Then follow `docs/NEW-PROJECT.md` for the full walkthrough. The Tugas project (`src/projects/tugas/`) is a fully fleshed reference.

## Project Structure

```
bengkel-design-lab/
├── AGENTS.md                          # Agent entry point — start here
├── .mcp.json                          # MCP server config (auto-discovered by Claude Code)
├── docs/
│   ├── CONTEXT.md                     # Architecture and concepts
│   ├── NEW-PROJECT.md                 # Step-by-step project creation guide
│   ├── WORKFLOWS.md                   # Day-to-day iteration workflows
│   ├── TROUBLESHOOTING.md             # Common problems and solutions
│   └── prd/                           # Product requirement documents
│       └── 000-backlog-index.md       # PRD backlog and priorities
├── server/
│   ├── db.ts                          # SQLite database module (WAL mode, foreign keys)
│   └── api-plugin.ts                 # Vite dev middleware — full REST API
├── mcp/
│   └── persona-review-server.ts      # MCP server for AI persona review orchestration
├── scripts/
│   ├── create-project.sh             # Project scaffolding script
│   └── seed-db.ts                    # Seed database from code + JSON files
├── src/
│   ├── App.tsx                        # Lab shell — dynamically renders any project
│   ├── types.ts                       # Shared types (Screen, Scenario, ProjectBrand, etc.)
│   ├── hooks/
│   │   └── use-project-data.ts       # React hooks for SQLite REST API
│   ├── components/
│   │   ├── LeftPanel.tsx             # Full left sidebar
│   │   ├── ProjectSwitcher.tsx       # Searchable project dropdown
│   │   ├── ScenarioSelector.tsx      # Scenario dropdown
│   │   ├── DocsPanel.tsx             # Screen docs view
│   │   ├── PersonaPanel.tsx          # Persona library + AI review cards
│   │   ├── AnnotationLayer.tsx       # Hover highlight + pin overlay on mockup
│   │   └── AnnotationPanel.tsx       # Annotation list, session naming, copy, simulate
│   └── projects/
│       ├── registry.ts               # Component-only registry (metadata in SQLite)
│       └── tugas/                     # Example project (to-do list)
│           ├── index.tsx             # Entry point + routing
│           ├── tugas.css             # Design tokens
│           ├── pages/                # Screen components
│           ├── data/                 # Mock data
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
- **better-sqlite3** — SQLite database (dev only, WAL mode)
- **@modelcontextprotocol/sdk** — MCP server for AI persona reviews

## License

MIT
