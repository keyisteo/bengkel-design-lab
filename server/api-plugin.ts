/**
 * Vite plugin that serves the Design Lab REST API.
 * Replaces the old annotation-only middleware.
 */
import type { Plugin } from 'vite'
import { openDatabase } from './db.js'
import type { DB } from './db.js'

function readBody(req: import('http').IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk: Buffer) => { body += chunk.toString() })
    req.on('end', () => resolve(body))
    req.on('error', reject)
  })
}

function json(res: import('http').ServerResponse, data: unknown, status = 200) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(data))
}

function err(res: import('http').ServerResponse, message: string, status = 400) {
  json(res, { ok: false, error: message }, status)
}

export function designLabApiPlugin(): Plugin {
  return {
    name: 'designlab-api',
    configureServer(server) {
      const db = openDatabase()

      // Prepared statements
      const stmts = prepareStatements(db)

      server.middlewares.use((req, res, next) => {
        const url = req.url ?? ''
        const method = req.method ?? 'GET'

        // Only handle /api/* routes
        if (!url.startsWith('/api/')) return next()

        handleApi(method, url, req, res, db, stmts).catch((e: Error) => {
          err(res, e.message, 500)
        })
      })
    },
  }
}

function prepareStatements(db: DB) {
  return {
    // Projects
    listProjects: db.prepare('SELECT id, name, brand, created_at, updated_at FROM projects ORDER BY name'),
    getProject: db.prepare('SELECT id, name, brand, created_at, updated_at FROM projects WHERE id = ?'),
    upsertProject: db.prepare(`
      INSERT INTO projects (id, name, brand, updated_at) VALUES (?, ?, ?, datetime('now'))
      ON CONFLICT(id) DO UPDATE SET name = excluded.name, brand = excluded.brand, updated_at = datetime('now')
    `),

    // Scenarios
    listScenarios: db.prepare('SELECT * FROM scenarios WHERE project_id = ? ORDER BY sort_order'),
    upsertScenario: db.prepare(`
      INSERT INTO scenarios (id, project_id, label, description, views, steps, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET label = excluded.label, description = excluded.description,
        views = excluded.views, steps = excluded.steps, sort_order = excluded.sort_order
    `),
    deleteScenario: db.prepare('DELETE FROM scenarios WHERE id = ?'),

    // Personas
    listPersonas: db.prepare('SELECT id, data FROM personas WHERE project_id = ?'),
    getPersona: db.prepare('SELECT id, data FROM personas WHERE id = ? AND project_id = ?'),
    upsertPersona: db.prepare(`
      INSERT INTO personas (id, project_id, data) VALUES (?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET data = excluded.data
    `),
    deletePersona: db.prepare('DELETE FROM personas WHERE id = ? AND project_id = ?'),

    // Persona index
    listPersonaIndex: db.prepare('SELECT * FROM persona_index WHERE project_id = ?'),
    upsertPersonaIndex: db.prepare(`
      INSERT INTO persona_index (persona_id, project_id, name, age, role, location, archetype, latest_score, latest_screen)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(persona_id) DO UPDATE SET name = excluded.name, age = excluded.age,
        role = excluded.role, location = excluded.location, archetype = excluded.archetype,
        latest_score = excluded.latest_score, latest_screen = excluded.latest_screen
    `),
    deletePersonaIndex: db.prepare('DELETE FROM persona_index WHERE persona_id = ?'),

    // Screen docs
    listScreenDocs: db.prepare('SELECT screen_id, doc FROM screen_docs WHERE project_id = ?'),
    getScreenDoc: db.prepare('SELECT screen_id, doc FROM screen_docs WHERE screen_id = ?'),
    upsertScreenDoc: db.prepare(`
      INSERT INTO screen_docs (screen_id, project_id, doc) VALUES (?, ?, ?)
      ON CONFLICT(screen_id) DO UPDATE SET doc = excluded.doc
    `),
    deleteScreenDoc: db.prepare('DELETE FROM screen_docs WHERE screen_id = ? AND project_id = ?'),

    // Reviews (AI simulation)
    insertReview: db.prepare(
      'INSERT INTO reviews (project_id, persona_id, persona_type, screen, view, result, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ),
    listReviews: db.prepare(
      'SELECT id, persona_id, persona_type, screen, view, result, status, created_at FROM reviews WHERE project_id = ? ORDER BY created_at DESC'
    ),
    listReviewsByPersona: db.prepare(
      'SELECT id, persona_id, persona_type, screen, view, result, status, created_at FROM reviews WHERE project_id = ? AND persona_id = ? ORDER BY created_at DESC'
    ),
    updateReviewStatus: db.prepare(
      'UPDATE reviews SET status = ? WHERE id = ?'
    ),

    // Annotation sessions (backward-compatible)
    insertSession: db.prepare(
      'INSERT INTO annotation_sessions (project_id, saved_at, name, annotations) VALUES (?, ?, ?, ?)'
    ),
    listSessions: db.prepare(
      'SELECT project_id, saved_at, name, annotations FROM annotation_sessions WHERE project_id = ? ORDER BY saved_at DESC'
    ),
  }
}

type Stmts = ReturnType<typeof prepareStatements>

async function handleApi(
  method: string,
  url: string,
  req: import('http').IncomingMessage,
  res: import('http').ServerResponse,
  _db: DB,
  s: Stmts,
) {
  // ── Projects ──────────────────────────────────────────
  if (url === '/api/projects' && method === 'GET') {
    const rows = s.listProjects.all() as Array<{ id: string; name: string; brand: string; created_at: string; updated_at: string }>
    return json(res, rows.map(r => ({ ...r, brand: JSON.parse(r.brand) })))
  }

  // GET /api/projects/:id
  let m = url.match(/^\/api\/projects\/([^/?]+)$/)
  if (m && method === 'GET') {
    const row = s.getProject.get(m[1]) as { id: string; name: string; brand: string } | undefined
    if (!row) return err(res, 'project not found', 404)
    const scenarios = (s.listScenarios.all(m[1]) as Array<{ id: string; label: string; description: string; views: string; steps: string }>)
      .map(sc => ({ ...sc, views: JSON.parse(sc.views), steps: JSON.parse(sc.steps) }))
    return json(res, { ...row, brand: JSON.parse(row.brand), scenarios })
  }

  // PUT /api/projects/:id
  if (m && method === 'PUT') {
    const body = JSON.parse(await readBody(req))
    s.upsertProject.run(m[1], body.name, JSON.stringify(body.brand))
    if (body.scenarios) {
      for (let i = 0; i < body.scenarios.length; i++) {
        const sc = body.scenarios[i]
        s.upsertScenario.run(sc.id, m[1], sc.label, sc.description ?? '', JSON.stringify(sc.views ?? ['mobile']), JSON.stringify(sc.steps ?? []), i)
      }
    }
    return json(res, { ok: true })
  }

  // ── Personas ──────────────────────────────────────────
  // GET /api/projects/:id/personas
  m = url.match(/^\/api\/projects\/([^/?]+)\/personas$/)
  if (m && method === 'GET') {
    const index = s.listPersonaIndex.all(m[1]) as Array<{
      persona_id: string; project_id: string; name: string; age: number;
      role: string; location: string; archetype: string; latest_score: number | null; latest_screen: string | null
    }>
    const personas = (s.listPersonas.all(m[1]) as Array<{ id: string; data: string }>)
      .map(p => ({ id: p.id, ...JSON.parse(p.data) }))
    return json(res, {
      index: {
        _meta: { purpose: `Persona index for project ${m[1]}` },
        personas: index.map(p => ({
          id: p.persona_id,
          name: p.name,
          age: p.age,
          role: p.role,
          location: p.location,
          archetype: p.archetype,
          latestScore: { score: p.latest_score, screen: p.latest_screen },
        })),
      },
      files: Object.fromEntries(personas.map(p => [p.id, p])),
    })
  }

  // PUT /api/projects/:id/personas/:personaId
  m = url.match(/^\/api\/projects\/([^/?]+)\/personas\/([^/?]+)$/)
  if (m && method === 'PUT') {
    const body = JSON.parse(await readBody(req))
    const projectId = m[1]
    const personaId = m[2]
    s.upsertPersona.run(personaId, projectId, JSON.stringify(body.data ?? body))
    if (body.index) {
      const idx = body.index
      s.upsertPersonaIndex.run(personaId, projectId, idx.name, idx.age, idx.role, idx.location, idx.archetype, idx.latestScore?.score ?? null, idx.latestScore?.screen ?? null)
    }
    return json(res, { ok: true })
  }

  if (m && method === 'DELETE') {
    s.deletePersona.run(m[2], m[1])
    s.deletePersonaIndex.run(m[2])
    return json(res, { ok: true })
  }

  // ── Screen Docs ───────────────────────────────────────
  // GET /api/projects/:id/screens
  m = url.match(/^\/api\/projects\/([^/?]+)\/screens$/)
  if (m && method === 'GET') {
    const rows = (s.listScreenDocs.all(m[1]) as Array<{ screen_id: string; doc: string }>)
    const docs: Record<string, unknown> = {}
    for (const r of rows) docs[r.screen_id] = JSON.parse(r.doc)
    return json(res, docs)
  }

  // GET /api/projects/:id/screens/:screenId
  m = url.match(/^\/api\/projects\/([^/?]+)\/screens\/([^/?]+)$/)
  if (m && method === 'GET') {
    const row = s.getScreenDoc.get(m[2]) as { screen_id: string; doc: string } | undefined
    if (!row) return err(res, 'screen doc not found', 404)
    return json(res, JSON.parse(row.doc))
  }

  // PUT /api/projects/:id/screens/:screenId
  if (m && method === 'PUT') {
    const body = JSON.parse(await readBody(req))
    s.upsertScreenDoc.run(m[2], m[1], JSON.stringify(body))
    return json(res, { ok: true })
  }

  // DELETE /api/projects/:id/screens/:screenId
  if (m && method === 'DELETE') {
    s.deleteScreenDoc.run(m[2], m[1])
    return json(res, { ok: true })
  }

  // ── Reviews (AI simulation) ────────────────────────────
  // GET /api/projects/:id/reviews
  m = url.match(/^\/api\/projects\/([^/?]+)\/reviews$/)
  if (m && method === 'GET') {
    const rows = s.listReviews.all(m[1]) as Array<{
      id: number; persona_id: string; persona_type: string; screen: string;
      view: string; result: string; status: string; created_at: string
    }>
    return json(res, rows.map(r => ({ ...r, result: JSON.parse(r.result) })))
  }

  // POST /api/projects/:id/reviews
  if (m && method === 'POST') {
    const body = JSON.parse(await readBody(req))
    const info = s.insertReview.run(
      m[1], body.personaId, body.personaType ?? 'user',
      body.screen, body.view ?? 'mobile', JSON.stringify(body.result), body.status ?? 'pending'
    )
    return json(res, { ok: true, id: info.lastInsertRowid })
  }

  // GET /api/projects/:id/reviews/persona/:personaId
  m = url.match(/^\/api\/projects\/([^/?]+)\/reviews\/persona\/([^/?]+)$/)
  if (m && method === 'GET') {
    const rows = s.listReviewsByPersona.all(m[1], m[2]) as Array<{
      id: number; persona_id: string; persona_type: string; screen: string;
      view: string; result: string; status: string; created_at: string
    }>
    return json(res, rows.map(r => ({ ...r, result: JSON.parse(r.result) })))
  }

  // PATCH /api/reviews/:reviewId
  m = url.match(/^\/api\/reviews\/(\d+)$/)
  if (m && method === 'PATCH') {
    const body = JSON.parse(await readBody(req))
    if (body.status) s.updateReviewStatus.run(body.status, parseInt(m[1]))
    return json(res, { ok: true })
  }

  // ── Annotations (backward-compatible) ─────────────────
  if (url === '/api/annotations' && method === 'POST') {
    const body = JSON.parse(await readBody(req))
    if (!body.projectId || typeof body.projectId !== 'string' || body.projectId.includes('..')) {
      return err(res, 'invalid projectId')
    }
    const savedAt = new Date().toISOString()
    s.insertSession.run(body.projectId, savedAt, body.name ?? '', JSON.stringify(body.annotations))
    return json(res, { ok: true, savedAt })
  }

  m = url.match(/^\/api\/annotations\/([^/?]+)$/)
  if (m && method === 'GET') {
    const rows = s.listSessions.all(m[1]) as Array<{ project_id: string; saved_at: string; name: string; annotations: string }>
    return json(res, {
      sessions: rows.map(r => ({
        projectId: r.project_id,
        savedAt: r.saved_at,
        name: r.name,
        annotations: JSON.parse(r.annotations),
      })),
    })
  }

  // ── 404 ───────────────────────────────────────────────
  err(res, `Unknown API route: ${method} ${url}`, 404)
}
