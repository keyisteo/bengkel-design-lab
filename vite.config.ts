import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import type { Plugin } from 'vite'

function annotationMiddlewarePlugin(): Plugin {
  return {
    name: 'annotation-middleware',
    configureServer(server) {
      // Lazy-init DB so it only runs in dev
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Database = require('better-sqlite3')
      const dbPath = path.join(process.cwd(), 'annotations.db')
      const db = new Database(dbPath)

      db.exec(`
        CREATE TABLE IF NOT EXISTS annotation_sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          project_id TEXT NOT NULL,
          saved_at TEXT NOT NULL,
          annotations TEXT NOT NULL
        )
      `)

      const insertSession = db.prepare(
        'INSERT INTO annotation_sessions (project_id, saved_at, annotations) VALUES (?, ?, ?)'
      )
      const listSessions = db.prepare(
        'SELECT project_id, saved_at, annotations FROM annotation_sessions WHERE project_id = ? ORDER BY saved_at DESC'
      )

      server.middlewares.use((req, res, next) => {
        const url = req.url ?? ''

        // POST /api/annotations
        if (req.method === 'POST' && url === '/api/annotations') {
          let body = ''
          req.on('data', (chunk: Buffer) => { body += chunk.toString() })
          req.on('end', () => {
            try {
              const { projectId, annotations } = JSON.parse(body)
              if (!projectId || typeof projectId !== 'string' || projectId.includes('..')) {
                res.statusCode = 400
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ ok: false, error: 'invalid projectId' }))
                return
              }
              const savedAt = new Date().toISOString()
              insertSession.run(projectId, savedAt, JSON.stringify(annotations))
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ ok: true, savedAt }))
            } catch (err) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ ok: false, error: (err as Error).message }))
            }
          })
          return
        }

        // GET /api/annotations/:projectId
        const getMatch = url.match(/^\/api\/annotations\/([^/?]+)$/)
        if (req.method === 'GET' && getMatch) {
          const projectId = getMatch[1]
          try {
            const rows = listSessions.all(projectId) as Array<{
              project_id: string
              saved_at: string
              annotations: string
            }>
            const sessions = rows.map(row => ({
              projectId: row.project_id,
              savedAt: row.saved_at,
              annotations: JSON.parse(row.annotations),
            }))
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ sessions }))
          } catch (err) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: false, error: (err as Error).message }))
          }
          return
        }

        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), annotationMiddlewarePlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
