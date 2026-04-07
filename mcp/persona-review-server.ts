#!/usr/bin/env npx tsx
/**
 * MCP Server: Design Lab Persona Review
 *
 * Exposes tools for Claude Code to orchestrate AI persona reviews:
 * - list_project_personas: get all user + internal personas for a project
 * - get_persona_profile: get full persona data
 * - get_screen_doc: get screen documentation
 * - list_project_screens: list all screens for a project
 * - capture_screenshot: take a screenshot of the running mockup (via dev server)
 * - save_review: persist a review result to SQLite
 * - list_reviews: list existing reviews for a project/persona
 *
 * Run: npx tsx mcp/persona-review-server.ts
 * Or configure in .claude/settings.json as an MCP server.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import path from 'path'
import { createRequire } from 'module'

const ROOT = process.cwd()
const require = createRequire(path.join(ROOT, 'package.json'))
const Database = require('better-sqlite3')

const DB_PATH = path.join(ROOT, 'designlab.db')
const DEV_SERVER = process.env.DESIGNLAB_URL ?? 'http://localhost:5173'

// ── Database ────────────────────────────────────────────
function openDb() {
  const db = new Database(DB_PATH)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  return db
}

const db = openDb()

// ── MCP Server ──────────────────────────────────────────
const server = new McpServer({
  name: 'designlab-persona-review',
  version: '1.0.0',
})

// ── Tool: list_project_personas ─────────────────────────
server.tool(
  'list_project_personas',
  'List all user personas for a project AND all internal team personas. Returns persona ID, name, role, type.',
  { project_id: z.string().describe('Project ID (e.g., "tugas", "ketemoo")') },
  async ({ project_id }) => {
    // User personas for this project
    const userPersonas = db.prepare(`
      SELECT pi.persona_id as id, pi.name, pi.role, pi.archetype, 'user' as type
      FROM persona_index pi WHERE pi.project_id = ?
    `).all(project_id) as Array<{ id: string; name: string; role: string; archetype: string; type: string }>

    // Internal personas (shared across all projects)
    const internalPersonas = db.prepare(`
      SELECT pi.persona_id as id, pi.name, pi.role, pi.archetype, 'internal' as type
      FROM persona_index pi WHERE pi.project_id = '_internal'
    `).all() as Array<{ id: string; name: string; role: string; archetype: string; type: string }>

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          projectId: project_id,
          userPersonas,
          internalPersonas,
          total: userPersonas.length + internalPersonas.length,
        }, null, 2),
      }],
    }
  },
)

// ── Tool: get_persona_profile ───────────────────────────
server.tool(
  'get_persona_profile',
  'Get the full profile of a persona (user or internal). Includes demographics, quotes, behavior, review focus, expertise — everything needed to role-play as this persona.',
  {
    persona_id: z.string().describe('Persona ID (e.g., "budi-santoso", "ayu-pramesti")'),
  },
  async ({ persona_id }) => {
    // Try user personas first, then internal
    let row = db.prepare('SELECT data FROM personas WHERE id = ?').get(persona_id) as { data: string } | undefined

    if (!row) {
      return { content: [{ type: 'text' as const, text: `Persona "${persona_id}" not found` }] }
    }

    return {
      content: [{
        type: 'text' as const,
        text: row.data,  // Already JSON string
      }],
    }
  },
)

// ── Tool: list_project_screens ──────────────────────────
server.tool(
  'list_project_screens',
  'List all screens and scenarios for a project. Returns screen IDs, names, goals, and which scenarios they belong to.',
  { project_id: z.string().describe('Project ID') },
  async ({ project_id }) => {
    const screens = db.prepare('SELECT screen_id, doc FROM screen_docs WHERE project_id = ?')
      .all(project_id) as Array<{ screen_id: string; doc: string }>

    const scenarios = db.prepare('SELECT id, label, description, views, steps FROM scenarios WHERE project_id = ? ORDER BY sort_order')
      .all(project_id) as Array<{ id: string; label: string; description: string; views: string; steps: string }>

    const screenSummaries = screens.map(s => {
      const doc = JSON.parse(s.doc)
      return {
        screenId: s.screen_id,
        name: doc.name,
        step: doc.step,
        goal: doc.goal,
      }
    })

    const scenarioData = scenarios.map(s => ({
      ...s,
      views: JSON.parse(s.views),
      steps: JSON.parse(s.steps),
    }))

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({ projectId: project_id, screens: screenSummaries, scenarios: scenarioData }, null, 2),
      }],
    }
  },
)

// ── Tool: get_screen_doc ────────────────────────────────
server.tool(
  'get_screen_doc',
  'Get the full documentation for a specific screen, including design notes, decisions, components, tokens, and existing persona feedback.',
  { screen_id: z.string().describe('Screen ID (e.g., "tugas-home")') },
  async ({ screen_id }) => {
    const row = db.prepare('SELECT doc FROM screen_docs WHERE screen_id = ?').get(screen_id) as { doc: string } | undefined
    if (!row) {
      return { content: [{ type: 'text' as const, text: `Screen doc "${screen_id}" not found` }] }
    }

    return {
      content: [{
        type: 'text' as const,
        text: row.doc,
      }],
    }
  },
)

// ── Tool: get_screen_context ────────────────────────────
server.tool(
  'get_screen_context',
  'Get comprehensive context for reviewing a screen: the full screen doc (goal, design notes, decisions, components, tokens) plus any existing persona feedback. Use this as the basis for a persona review when no screenshot is available.',
  {
    project_id: z.string().describe('Project ID'),
    screen_id: z.string().describe('Screen ID to review'),
  },
  async ({ project_id, screen_id }) => {
    const screenRow = db.prepare('SELECT doc FROM screen_docs WHERE screen_id = ? AND project_id = ?')
      .get(screen_id, project_id) as { doc: string } | undefined

    if (!screenRow) {
      return { content: [{ type: 'text' as const, text: `Screen "${screen_id}" not found in project "${project_id}"` }] }
    }

    // Also get the project brand for context
    const projectRow = db.prepare('SELECT brand FROM projects WHERE id = ?')
      .get(project_id) as { brand: string } | undefined

    const doc = JSON.parse(screenRow.doc)
    const brand = projectRow ? JSON.parse(projectRow.brand) : null

    // Get any existing reviews for this screen
    const existingReviews = db.prepare(
      'SELECT persona_id, persona_type, result FROM reviews WHERE project_id = ? AND screen = ? ORDER BY created_at DESC'
    ).all(project_id, screen_id) as Array<{ persona_id: string; persona_type: string; result: string }>

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          screenId: screen_id,
          projectId: project_id,
          brand: brand ? { name: brand.name, tagline: brand.tagline, accentColor: brand.accentColor } : null,
          screenDoc: doc,
          existingReviews: existingReviews.map(r => ({
            personaId: r.persona_id,
            personaType: r.persona_type,
            result: JSON.parse(r.result),
          })),
        }, null, 2),
      }],
    }
  },
)

// ── Tool: save_review ───────────────────────────────────
server.tool(
  'save_review',
  'Save a persona review result to the database. Use this after generating feedback as a persona. The result should be structured JSON matching the expected format for user personas (feedbackHistory format) or internal personas (findings format).',
  {
    project_id: z.string().describe('Project ID'),
    persona_id: z.string().describe('Persona ID who authored this review'),
    persona_type: z.enum(['user', 'internal']).describe('Whether this is a user persona or internal team persona'),
    screen: z.string().describe('Screen ID that was reviewed'),
    view: z.enum(['mobile', 'web']).default('mobile'),
    result: z.string().describe('JSON string of the review result. For user personas: {score, scoreReason, firstImpression, likes[], missing[], wouldTheyProceed, topChange}. For internal personas: {overallScore, summary, findings[{category, severity, finding, suggestion}], topChanges[]}'),
  },
  async ({ project_id, persona_id, persona_type, screen, view, result }) => {
    try {
      const parsedResult = JSON.parse(result)
      parsedResult.simulated = true
      parsedResult.reviewedAt = new Date().toISOString()

      const info = db.prepare(
        'INSERT INTO reviews (project_id, persona_id, persona_type, screen, view, result, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).run(project_id, persona_id, persona_type, screen, view, JSON.stringify(parsedResult), 'pending')

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            ok: true,
            reviewId: info.lastInsertRowid,
            message: `Review saved for ${persona_id} on ${screen} (${view})`,
          }),
        }],
      }
    } catch (e) {
      return {
        content: [{
          type: 'text' as const,
          text: `Failed to save review: ${(e as Error).message}`,
        }],
      }
    }
  },
)

// ── Tool: list_reviews ──────────────────────────────────
server.tool(
  'list_reviews',
  'List all AI-generated reviews for a project, optionally filtered by persona.',
  {
    project_id: z.string().describe('Project ID'),
    persona_id: z.string().optional().describe('Filter by persona ID (optional)'),
  },
  async ({ project_id, persona_id }) => {
    let rows: Array<{ id: number; persona_id: string; persona_type: string; screen: string; view: string; result: string; status: string; created_at: string }>

    if (persona_id) {
      rows = db.prepare(
        'SELECT * FROM reviews WHERE project_id = ? AND persona_id = ? ORDER BY created_at DESC'
      ).all(project_id, persona_id) as typeof rows
    } else {
      rows = db.prepare(
        'SELECT * FROM reviews WHERE project_id = ? ORDER BY created_at DESC'
      ).all(project_id) as typeof rows
    }

    const reviews = rows.map(r => ({
      ...r,
      result: JSON.parse(r.result),
    }))

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({ projectId: project_id, reviews, count: reviews.length }, null, 2),
      }],
    }
  },
)

// ── Start ───────────────────────────────────────────────
const transport = new StdioServerTransport()
await server.connect(transport)
