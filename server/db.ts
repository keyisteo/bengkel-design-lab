/**
 * Shared SQLite database module for the Design Lab.
 * Used by Vite middleware (dev server) and seed scripts.
 */
import path from 'path'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const Database = require('better-sqlite3')

export type DB = InstanceType<typeof Database>

export function openDatabase(): DB {
  const dbPath = path.join(process.cwd(), 'designlab.db')
  const db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  initSchema(db)
  return db
}

function initSchema(db: DB) {
  db.exec(`
    -- Projects: brand + metadata
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      brand JSON NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Scenarios per project
    CREATE TABLE IF NOT EXISTS scenarios (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      label TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      views JSON NOT NULL DEFAULT '["mobile"]',
      steps JSON NOT NULL DEFAULT '[]',
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    -- Personas
    CREATE TABLE IF NOT EXISTS personas (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      data JSON NOT NULL
    );

    -- Persona index entries (summary for the sidebar)
    CREATE TABLE IF NOT EXISTS persona_index (
      persona_id TEXT PRIMARY KEY REFERENCES personas(id) ON DELETE CASCADE,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      age INTEGER,
      role TEXT,
      location TEXT,
      archetype TEXT,
      latest_score INTEGER,
      latest_screen TEXT
    );

    -- Screen docs
    CREATE TABLE IF NOT EXISTS screen_docs (
      screen_id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      doc JSON NOT NULL
    );

    -- AI simulation reviews
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      persona_id TEXT NOT NULL,
      persona_type TEXT NOT NULL DEFAULT 'user',  -- 'user' | 'internal'
      screen TEXT NOT NULL,
      view TEXT NOT NULL DEFAULT 'mobile',
      result JSON NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'accepted' | 'rejected'
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Annotation sessions (migrated from old annotations.db)
    CREATE TABLE IF NOT EXISTS annotation_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id TEXT NOT NULL,
      saved_at TEXT NOT NULL,
      name TEXT NOT NULL DEFAULT '',
      annotations TEXT NOT NULL
    );
  `)
}
