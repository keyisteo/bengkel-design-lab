import fs from 'fs'
import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import type { Plugin } from 'vite'

function annotationMiddlewarePlugin(): Plugin {
  return {
    name: 'annotation-middleware',
    configureServer(server) {
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
              const now = new Date()
              const pad = (n: number) => String(n).padStart(2, '0')
              const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}-${pad(now.getMinutes())}`
              const dir = path.join(process.cwd(), 'src', 'projects', projectId, 'annotations')
              fs.mkdirSync(dir, { recursive: true })
              const filePath = path.join(dir, `${timestamp}.json`)
              const content = { projectId, savedAt: now.toISOString(), annotations }
              fs.writeFileSync(filePath, JSON.stringify(content, null, 2))
              const relativePath = path.relative(process.cwd(), filePath)
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ ok: true, path: relativePath }))
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
          const dir = path.join(process.cwd(), 'src', 'projects', projectId, 'annotations')
          try {
            if (!fs.existsSync(dir)) {
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ sessions: [] }))
              return
            }
            const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'))
            const sessions = files
              .map(file => {
                try {
                  const raw = fs.readFileSync(path.join(dir, file), 'utf-8')
                  return JSON.parse(raw)
                } catch {
                  return null
                }
              })
              .filter(Boolean)
              .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
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
