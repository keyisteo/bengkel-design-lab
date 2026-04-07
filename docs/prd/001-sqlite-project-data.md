# PRD-001: SQLite-backed Project Data

## Summary
Migrate all project configuration, screen docs, persona data, and decision logs from hardcoded TypeScript constants and JSON files into the existing SQLite database (`annotations.db` → `designlab.db`). The lab shell reads from the DB at runtime, making it possible to add/edit projects, personas, and decisions without touching source code.

## Problem
- Adding a new project requires editing `registry.ts`, creating JSON files, updating `screenDocs.ts` — all code changes that need a dev server restart.
- Persona feedback and decisions are duplicated across JSON files and `SCREEN_DOCS` constants, leading to drift.
- Non-technical collaborators (PMs, designers) cannot contribute data without touching code.

## Goals
1. Single source of truth for all project metadata in SQLite.
2. Hot-reload data changes without restarting the dev server.
3. REST API endpoints for CRUD operations on projects, personas, decisions, and screen docs.
4. Backward-compatible: existing projects continue working during migration.

## Non-Goals
- Production deployment (this remains a dev tool).
- User authentication or access control.
- Replacing the React component registration (components still live in code).

## Proposed Solution

### Database Schema
```sql
-- Projects
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  brand JSON NOT NULL,
  scenarios JSON NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Personas
CREATE TABLE personas (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id),
  data JSON NOT NULL
);

-- Screen Docs
CREATE TABLE screen_docs (
  screen_id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id),
  doc JSON NOT NULL
);

-- Decisions
CREATE TABLE decisions (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id),
  screen_id TEXT,
  data JSON NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Rename annotation_sessions table stays as-is
```

### API Endpoints (Vite middleware)
- `GET /api/projects` — list all projects
- `GET /api/projects/:id` — single project with brand + scenarios
- `PUT /api/projects/:id` — update project metadata
- `GET /api/projects/:id/personas` — list personas
- `PUT /api/projects/:id/personas/:personaId` — upsert persona
- `GET /api/projects/:id/screens` — list screen docs
- `PUT /api/projects/:id/screens/:screenId` — upsert screen doc
- `GET /api/projects/:id/decisions` — list decisions
- `POST /api/projects/:id/decisions` — add decision

### Migration Strategy
1. Add schema + endpoints alongside existing constants.
2. Create a `seed.ts` script that reads current constants and populates the DB.
3. Update `registry.ts` to fetch from DB with fallback to constants.
4. Once stable, remove the constant-based approach.

## Success Criteria
- Zero data duplication between JSON/TS files and the DB.
- Adding a new persona or decision via API reflects in the UI within 1 second (no restart).
- Existing annotation sessions remain intact.

## Risks
- JSON-in-SQLite columns may complicate querying — mitigate by keeping JSON flat.
- Dev-only SQLite means no persistence across `git clone` — mitigate with seed script.

## Effort Estimate
**M (1–2 weeks)** — schema design, API endpoints, migration script, registry refactor.
