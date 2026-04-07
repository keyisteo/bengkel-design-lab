import { useState, useRef, useCallback, useEffect } from 'react'
import './index.css'
import { LeftPanel } from './components/LeftPanel'
import { PROJECT_COMPONENTS } from './projects/registry'
import { useProjects, useProjectDetail, usePersonas, useScreenDocs, useReviews, useInternalPersonas } from './hooks/use-project-data'
import { AnnotationLayer } from './components/AnnotationLayer'
import type { HoverRect } from './components/AnnotationLayer'
import { AnnotationPanel } from './components/AnnotationPanel'
import type { Annotation, ScenarioId } from './types'

let nextId = 1

const SESSION_ADJECTIVES = ['sleepy', 'bouncy', 'curious', 'fluffy', 'grumpy', 'spiky', 'fuzzy', 'wobbly', 'sneaky', 'dizzy', 'lumpy', 'cranky', 'wiggly', 'droopy', 'zesty', 'cheeky', 'clumsy', 'dusty', 'frosty', 'jolly']
const SESSION_NOUNS = ['mango', 'volcano', 'penguin', 'cactus', 'spatula', 'tambourine', 'platypus', 'noodle', 'biscuit', 'goblin', 'pretzel', 'kumquat', 'walrus', 'bonsai', 'burrito', 'marmot', 'turnip', 'satchel', 'lantern', 'yodel']

function generateSessionName(): string {
  const adj = SESSION_ADJECTIVES[Math.floor(Math.random() * SESSION_ADJECTIVES.length)]
  const noun = SESSION_NOUNS[Math.floor(Math.random() * SESSION_NOUNS.length)]
  const num = Math.floor(Math.random() * 90) + 10
  return `${adj}-${noun}-${num}`
}

const WEB_PRESETS = [
  { label: '768',  w: 768,  h: 600 },
  { label: '1024', w: 1024, h: 768 },
  { label: '1280', w: 1280, h: 800 },
  { label: '1440', w: 1440, h: 900 },
  { label: '1920', w: 1920, h: 1080 },
] as const

// Elements to skip when building the label (too generic)
const SKIP_TAGS = new Set(['DIV', 'SPAN', 'SECTION', 'MAIN', 'ARTICLE'])

function getElementInfo(el: Element): { label: string; classes: string } {
  const tag = el.tagName.toLowerCase()
  const id = el.id ? `#${el.id}` : ''
  const cls = Array.from(el.classList)
    .find(c => c.length > 2 && !c.startsWith('overflow') && !c.startsWith('flex') && !c.startsWith('h-') && !c.startsWith('w-'))
  return {
    label: `${tag}${id}${cls ? `.${cls}` : ''}`,
    classes: el.className,
  }
}

function getBestTarget(el: HTMLElement, containerEl: HTMLElement): HTMLElement {
  let current: HTMLElement | null = el
  while (current && current !== containerEl) {
    const tag = current.tagName
    if (!SKIP_TAGS.has(tag)) return current
    if (current.getAttribute('data-annotation-pin') != null) return current
    current = current.parentElement
  }
  return el
}

export default function App() {
  // ── Data from SQLite API ────────────────────────────────
  const { projects: allProjects, loading: projectsLoading } = useProjects()

  // Only show projects that have a registered component
  const availableProjects = allProjects.filter(p => p.id in PROJECT_COMPONENTS)

  const [activeProject, setActiveProject] = useState<string>('')
  const projectDetail = useProjectDetail(activeProject || '__none__')
  const personaData = usePersonas(activeProject || '__none__')
  const screenDocsData = useScreenDocs(activeProject || '__none__')
  const reviewsData = useReviews(activeProject || '__none__')
  const internalPersonasData = useInternalPersonas()

  // Set initial project once loaded
  useEffect(() => {
    if (availableProjects.length > 0 && !activeProject) {
      setActiveProject(availableProjects[0].id)
    }
  }, [availableProjects, activeProject])

  // ── Local UI state ──────────────────────────────────────
  const [screen, setScreen] = useState('')
  const [activeScenarioId, setActiveScenarioId] = useState('')
  const [activeView, setActiveView] = useState<'mobile' | 'web'>('mobile')
  const [annotating, setAnnotating] = useState(false)
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [sessionName, setSessionName] = useState<string | null>(null)
  const [webPreset, setWebPreset] = useState('1440')
  const [hoverRect, setHoverRect] = useState<HoverRect | null>(null)
  const [pending, setPending] = useState<{ x: number; y: number; elementLabel: string; elementClasses: string } | null>(null)
  const [leftCollapsed, setLeftCollapsed] = useState(false)
  const [rightCollapsed, setRightCollapsed] = useState(false)

  const phoneRef = useRef<HTMLDivElement>(null)
  const centerRef = useRef<HTMLDivElement>(null)
  const [centerWidth, setCenterWidth] = useState(0)

  useEffect(() => {
    const el = centerRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => setCenterWidth(entries[0].contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // ── Derived data ────────────────────────────────────────
  const config = projectDetail.data
  const scenarios = config?.scenarios ?? []
  const brand = config?.brand
  const personaIndex = personaData.data?.index ?? { _meta: { purpose: '' }, personas: [] }
  const personaFiles = personaData.data?.files ?? {}
  const screenDocs = screenDocsData.docs
  const reviews = reviewsData.reviews
  const internalPersonaIndex = internalPersonasData.data?.index ?? { _meta: { purpose: '' }, personas: [] }
  const internalPersonaFiles = internalPersonasData.data?.files ?? {}

  // Initialize screen/scenario when project data loads
  useEffect(() => {
    if (scenarios.length > 0 && !activeScenarioId) {
      setActiveScenarioId(scenarios[0].id)
      setScreen(scenarios[0].steps[0]?.screen ?? '')
      setActiveView(scenarios[0].views?.[0] ?? 'mobile')
    }
  }, [scenarios, activeScenarioId])

  const activeScenario = scenarios.find(s => s.id === activeScenarioId) ?? scenarios[0]
  const scenarioViews = activeScenario?.views ?? ['mobile']
  const hasMultipleViews = scenarioViews.includes('mobile') && scenarioViews.includes('web')

  const ProjectApp = activeProject ? PROJECT_COMPONENTS[activeProject] : null
  const projectsList = availableProjects.map(p => ({
    id: p.id,
    name: p.name,
    tagline: p.brand.tagline ?? '',
    accentColor: p.brand.accentColor,
    textPrimary: p.brand.textPrimary,
  }))

  // ── Handlers ────────────────────────────────────────────
  const handleProjectChange = (p: string) => {
    setActiveProject(p)
    setActiveScenarioId('')
    setScreen('')
    setActiveView('mobile')
  }

  const handleScenarioChange = (id: ScenarioId) => {
    setActiveScenarioId(id)
    const newScenario = scenarios.find(s => s.id === id) ?? scenarios[0]
    setActiveView(newScenario?.views?.[0] ?? 'mobile')
  }

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!annotating || pending) return
    const container = phoneRef.current
    if (!container) return

    const target = getBestTarget(e.target as HTMLElement, container)
    if (target === container) { setHoverRect(null); return }

    const containerRect = container.getBoundingClientRect()
    const elRect = target.getBoundingClientRect()
    const { label } = getElementInfo(target)

    setHoverRect({
      left: elRect.left - containerRect.left,
      top: elRect.top - containerRect.top,
      width: elRect.width,
      height: elRect.height,
      label,
    })
  }, [annotating, pending])

  const handleMouseLeave = useCallback(() => {
    setHoverRect(null)
  }, [])

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!annotating) return
    if ((e.target as HTMLElement).closest('[data-annotation-pin]')) return
    if (pending) return

    e.preventDefault()
    e.stopPropagation()

    const container = phoneRef.current
    if (!container) return

    const target = getBestTarget(e.target as HTMLElement, container)
    const containerRect = container.getBoundingClientRect()
    const elRect = target.getBoundingClientRect()

    const x = elRect.left - containerRect.left + 8
    const y = elRect.top - containerRect.top + 8

    const { label, classes } = getElementInfo(target)
    setPending({ x, y, elementLabel: label, elementClasses: classes })
    setHoverRect(null)
  }, [annotating, pending])

  const handleSave = (comment: string) => {
    if (!pending) return
    if (sessionName === null) setSessionName(generateSessionName())
    setAnnotations(prev => [...prev, {
      id: nextId++,
      x: pending.x,
      y: pending.y,
      elementLabel: pending.elementLabel,
      elementClasses: pending.elementClasses,
      comment,
      screen,
      view: activeView,
    }])
    setPending(null)
  }

  const handleCancelPending = () => setPending(null)
  const handleDeleteAnnotation = (id: number) => setAnnotations(prev => prev.filter(a => a.id !== id))
  const handleClearAnnotations = () => { setAnnotations([]); setSessionName(null) }

  const handleSaveSession = async (name: string) => {
    await fetch('/api/annotations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: activeProject, name, annotations }),
    })
    setAnnotations([])
    setSessionName(null)
  }

  const handleLoadSession = (loaded: Annotation[]) => {
    setAnnotations(loaded.map(a => ({ ...a, id: nextId++ })))
    setSessionName(null)
  }

  // ── Loading state ───────────────────────────────────────
  if (projectsLoading || !brand || !ProjectApp) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50 text-zinc-400">
        Loading Design Lab...
      </div>
    )
  }

  // Web viewport presets
  const activePreset = WEB_PRESETS.find(p => p.label === webPreset) ?? WEB_PRESETS[3]
  const WEB_W = activePreset.w
  const WEB_H = activePreset.h
  const webScale = activeView === 'web' && centerWidth > 0
    ? Math.min(1, (centerWidth - 48) / WEB_W)
    : 1

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50">
      {/* Left panel — collapsible */}
      <div className={`flex-shrink-0 h-full flex transition-all duration-200 ${leftCollapsed ? 'w-8' : 'w-[340px]'}`}>
        {leftCollapsed ? (
          <div className="w-8 h-full flex items-center justify-center bg-zinc-50 border-r border-zinc-200">
            <button
              className="text-zinc-400 hover:text-zinc-700 p-1"
              onClick={() => setLeftCollapsed(false)}
              title="Expand panel"
            >
              ›
            </button>
          </div>
        ) : (
          <div className="flex-1 relative overflow-hidden">
            <LeftPanel
              screen={screen}
              onSelectScreen={setScreen}
              brand={brand}
              scenarios={scenarios}
              activeScenarioId={activeScenarioId}
              onScenarioChange={handleScenarioChange}
              personaIndex={personaIndex}
              personaFiles={personaFiles}
              internalPersonaIndex={internalPersonaIndex}
              internalPersonaFiles={internalPersonaFiles}
              reviews={reviews}
              onReviewAction={reviewsData.updateStatus}
              screenDocs={screenDocs}
              activeProject={activeProject}
              onProjectChange={handleProjectChange}
              projects={projectsList}
              activeView={activeView}
            />
            <button
              className="absolute top-1/2 -right-3 z-10 w-6 h-6 rounded-full bg-white border border-zinc-200 shadow text-zinc-400 hover:text-zinc-700 flex items-center justify-center text-xs"
              onClick={() => setLeftCollapsed(true)}
              title="Collapse panel"
            >
              ‹
            </button>
          </div>
        )}
      </div>

      {/* Mockup area */}
      <div ref={centerRef} className="flex-1 h-full flex flex-col items-center justify-start bg-zinc-100 pt-5 pb-6 px-6 min-w-0 overflow-y-auto">
        {/* Top bar */}
        <div className="mb-4 flex flex-wrap items-center justify-center gap-2 flex-shrink-0 w-full">
          <button
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all shadow-sm ${
              annotating
                ? 'bg-amber-400 text-white shadow-amber-200'
                : 'bg-white text-zinc-500 border border-zinc-200 hover:border-amber-300 hover:text-amber-500'
            }`}
            onClick={() => { setAnnotating(v => !v); setHoverRect(null); setPending(null) }}
          >
            ✏️ {annotating ? 'Annotating — hover to select' : 'Annotate'}
          </button>

          {hasMultipleViews && (
            <div className="flex items-center bg-zinc-200 rounded-full p-0.5">
              {(['mobile', 'web'] as const).map(v => (
                <button
                  key={v}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all capitalize ${
                    activeView === v
                      ? 'bg-white shadow text-zinc-800'
                      : 'text-zinc-500 hover:text-zinc-700'
                  }`}
                  onClick={() => setActiveView(v)}
                >
                  {v === 'mobile' ? 'Mobile' : 'Web'}
                </button>
              ))}
            </div>
          )}

          {activeView === 'web' && (
            <div className="flex items-center gap-1 bg-zinc-100 border border-zinc-200 rounded-lg px-1 py-0.5">
              {WEB_PRESETS.map(p => (
                <button
                  key={p.label}
                  className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                    webPreset === p.label
                      ? 'bg-white shadow text-zinc-800'
                      : 'text-zinc-400 hover:text-zinc-600'
                  }`}
                  onClick={() => setWebPreset(p.label)}
                >
                  {p.label}
                </button>
              ))}
              <span className="text-[10px] text-zinc-400 pl-1 pr-0.5">px</span>
            </div>
          )}

          {annotations.length > 0 && (
            <span className="text-xs text-zinc-400">
              {annotations.length} note{annotations.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Frame — mobile fixed size, web scales to fit */}
        {activeView === 'web' ? (
          <div
            className="flex-shrink-0"
            style={{ width: WEB_W * webScale, height: WEB_H * webScale }}
          >
            <div
              ref={phoneRef}
              className={`relative shadow-2xl border border-zinc-200 bg-zinc-50 overflow-hidden rounded-xl ${annotating ? 'cursor-crosshair' : ''}`}
              style={{
                width: WEB_W,
                height: WEB_H,
                transform: `scale(${webScale})`,
                transformOrigin: 'top left',
              }}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              onClickCapture={handleClick}
            >
              <div className="h-full overflow-y-auto">
                <ProjectApp screen={screen} onScreenChange={setScreen} view={activeView} />
              </div>
              <AnnotationLayer
                screen={screen}
                activeView={activeView}
                annotations={annotations}
                hoverRect={hoverRect}
                pending={pending}
                onSave={handleSave}
                onCancelPending={handleCancelPending}
                onDelete={handleDeleteAnnotation}
              />
            </div>
          </div>
        ) : (
          <div
            ref={phoneRef}
            className={`relative w-[375px] h-[812px] rounded-3xl shadow-2xl border border-zinc-200 bg-zinc-50 overflow-hidden ${annotating ? 'cursor-crosshair' : ''}`}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClickCapture={handleClick}
          >
            <div className="h-full overflow-y-auto">
              <ProjectApp screen={screen} onScreenChange={setScreen} view={activeView} />
            </div>
            <AnnotationLayer
              screen={screen}
              activeView={activeView}
              annotations={annotations}
              hoverRect={hoverRect}
              pending={pending}
              onSave={handleSave}
              onCancelPending={handleCancelPending}
              onDelete={handleDeleteAnnotation}
            />
          </div>
        )}
      </div>

      {/* Annotation side panel — collapsible */}
      {annotating && (
        <div className={`flex-shrink-0 h-full flex transition-all duration-200 ${rightCollapsed ? 'w-8' : 'w-[240px]'}`}>
          {rightCollapsed ? (
            <div className="w-8 h-full flex items-center justify-center bg-white border-l border-zinc-200">
              <button
                className="text-zinc-400 hover:text-zinc-700 p-1"
                onClick={() => setRightCollapsed(false)}
                title="Expand annotations"
              >
                ‹
              </button>
            </div>
          ) : (
            <div className="flex-1 relative overflow-hidden bg-white border-l border-zinc-200">
              <button
                className="absolute top-1/2 -left-3 z-10 w-6 h-6 rounded-full bg-white border border-zinc-200 shadow text-zinc-400 hover:text-zinc-700 flex items-center justify-center text-xs"
                onClick={() => setRightCollapsed(true)}
                title="Collapse annotations"
              >
                ›
              </button>
              <AnnotationPanel
                annotations={annotations}
                screen={screen}
                activeView={activeView}
                projectId={activeProject}
                sessionName={sessionName}
                onNameChange={setSessionName}
                onDelete={handleDeleteAnnotation}
                onClear={handleClearAnnotations}
                onSaveSession={handleSaveSession}
                onLoadSession={handleLoadSession}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
