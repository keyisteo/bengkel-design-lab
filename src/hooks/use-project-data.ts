import { useState, useEffect, useCallback } from 'react'
import type { Scenario, ScreenDoc, ProjectBrand } from '../types'

// ── Types ───────────────────────────────────────────────

interface PersonaIndexEntry {
  id: string
  name: string
  age: number
  role: string
  location: string
  archetype: string
  latestScore: { score: number | null; screen: string | null }
}

interface PersonaIndex {
  _meta: { purpose: string }
  personas: PersonaIndexEntry[]
}

// Persona file data is loosely typed — stored as JSON blob
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PersonaFile = Record<string, any>

interface ProjectData {
  id: string
  name: string
  brand: ProjectBrand
  scenarios: Scenario[]
}

interface PersonaData {
  index: PersonaIndex
  files: Record<string, PersonaFile>
}

// ── API fetchers ────────────────────────────────────────

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`API ${url}: ${res.status}`)
  return res.json()
}

// ── Hooks ───────────────────────────────────────────────

export function useProjects() {
  const [projects, setProjects] = useState<ProjectData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchJson<Array<{ id: string; name: string; brand: string | ProjectBrand }>>('/api/projects')
      .then(rows => {
        setProjects(rows.map(r => ({
          id: r.id,
          name: r.name,
          brand: typeof r.brand === 'string' ? JSON.parse(r.brand) : r.brand,
          scenarios: [],
        })))
        setLoading(false)
      })
      .catch(err => { console.error('useProjects:', err); setLoading(false) })
  }, [])

  return { projects, loading }
}

export function useProjectDetail(projectId: string) {
  const [data, setData] = useState<ProjectData | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(() => {
    setLoading(true)
    fetchJson<{ id: string; name: string; brand: string | ProjectBrand; scenarios: Scenario[] }>(`/api/projects/${projectId}`)
      .then(d => {
        setData({
          id: d.id,
          name: d.name,
          brand: typeof d.brand === 'string' ? JSON.parse(d.brand) : d.brand,
          scenarios: d.scenarios,
        })
        setLoading(false)
      })
      .catch(err => { console.error('useProjectDetail:', err); setLoading(false) })
  }, [projectId])

  useEffect(() => { refresh() }, [refresh])

  return { data, loading, refresh }
}

export function usePersonas(projectId: string) {
  const [data, setData] = useState<PersonaData | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(() => {
    setLoading(true)
    fetchJson<PersonaData>(`/api/projects/${projectId}/personas`)
      .then(d => { setData(d); setLoading(false) })
      .catch(err => { console.error('usePersonas:', err); setLoading(false) })
  }, [projectId])

  useEffect(() => { refresh() }, [refresh])

  return { data, loading, refresh }
}

export function useScreenDocs(projectId: string) {
  const [docs, setDocs] = useState<Record<string, ScreenDoc>>({})
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(() => {
    setLoading(true)
    fetchJson<Record<string, ScreenDoc>>(`/api/projects/${projectId}/screens`)
      .then(d => { setDocs(d); setLoading(false) })
      .catch(err => { console.error('useScreenDocs:', err); setLoading(false) })
  }, [projectId])

  useEffect(() => { refresh() }, [refresh])

  return { docs, loading, refresh }
}

// ── Reviews ─────────────────────────────────────────────

export interface Review {
  id: number
  persona_id: string
  persona_type: 'user' | 'internal'
  screen: string
  view: 'mobile' | 'web'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result: Record<string, any>
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
}

export function useReviews(projectId: string) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(() => {
    if (!projectId || projectId === '__none__') { setReviews([]); setLoading(false); return }
    setLoading(true)
    fetchJson<Review[]>(`/api/projects/${projectId}/reviews`)
      .then(d => { setReviews(d); setLoading(false) })
      .catch(err => { console.error('useReviews:', err); setLoading(false) })
  }, [projectId])

  useEffect(() => { refresh() }, [refresh])

  const updateStatus = useCallback(async (reviewId: number, status: 'accepted' | 'rejected') => {
    await fetch(`/api/reviews/${reviewId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    refresh()
  }, [refresh])

  return { reviews, loading, refresh, updateStatus }
}

export function useInternalPersonas() {
  const [data, setData] = useState<PersonaData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchJson<PersonaData>('/api/projects/_internal/personas')
      .then(d => { setData(d); setLoading(false) })
      .catch(err => { console.error('useInternalPersonas:', err); setLoading(false) })
  }, [])

  return { data, loading }
}

export function useScreenDoc(projectId: string, screenId: string) {
  const [doc, setDoc] = useState<ScreenDoc | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!screenId || !projectId) { setDoc(null); setLoading(false); return }
    setLoading(true)
    fetchJson<ScreenDoc>(`/api/projects/${projectId}/screens/${screenId}`)
      .then(d => { setDoc(d); setLoading(false) })
      .catch(() => { setDoc(null); setLoading(false) })
  }, [projectId, screenId])

  return { doc, loading }
}
