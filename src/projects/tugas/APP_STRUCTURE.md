# Tugas — App Structure

## Directory Layout

```
src/projects/tugas/
├── index.tsx              # TugasApp — entry point + routing
├── tugas.css              # Design tokens scoped under .tugas
├── pages/
│   ├── HomePage.tsx       # Task list with filters
│   ├── AddTaskPage.tsx    # New task form
│   ├── TaskDetailPage.tsx # Task detail + actions
│   └── StatsPage.tsx      # Stats dashboard
├── data/
│   └── tasks.ts           # Mock data + Task type
├── personas/
│   ├── _index.json        # Persona index
│   └── budi-santoso.json  # Full persona file
├── DESIGN_BRIEF.md
├── APP_STRUCTURE.md
├── DESIGN_TOKENS.md
└── DECISIONS.md
```

## Screens

| Screen ID | Name | Goal |
|---|---|---|
| `tugas-home` | Home | See all tasks, filter by status, quick-toggle completion |
| `tugas-add` | Add Task | Create a new task with title, priority, and due date |
| `tugas-detail` | Task Detail | View full details, mark complete, delete with confirmation |
| `tugas-stats` | Stats | Review progress — completion rate, streaks, priority breakdown |

## Routing Graph

```
tugas-home ──→ tugas-add ──→ tugas-home (after save)
    │
    ├──→ tugas-detail ──→ tugas-home (after delete or back)
    │
    └──→ tugas-stats ──→ tugas-home (via bottom nav)
```

## Scenarios

### 1. Happy Path (`tugas-happy-path`)
**Flow:** Home → Add Task → Home → Task Detail
**Purpose:** Create a task, then view and manage it.

### 2. Weekly Review (`tugas-weekly-review`)
**Flow:** Home → Stats → Task Detail
**Purpose:** Review weekly progress and clean up overdue tasks.

## Key Components

- **HomePage** — Task list with All/Active/Done filters, inline completion toggle, FAB for adding tasks, bottom nav
- **AddTaskPage** — Form with title (required), description (optional), visual priority selector (Low/Medium/High), date picker
- **TaskDetailPage** — Full task view with priority badge, due date, description. Actions: toggle complete, delete with bottom sheet confirmation
- **StatsPage** — Completion rate with progress bar, streak counter, overdue count, priority breakdown with bar charts
