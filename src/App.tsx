import { useState, useRef, useCallback, useEffect } from 'react'
import './index.css'
import { LeftPanel } from './components/LeftPanel'
import { PROJECT_CONFIGS } from './projects/registry'
import { AnnotationLayer } from './components/AnnotationLayer'
import type { HoverRect } from './components/AnnotationLayer'
import { AnnotationPanel } from './components/AnnotationPanel'
import type { Annotation, ScenarioId } from './types'

const PROJECTS = Object.values(PROJECT_CONFIGS).map((c) => ({
  id: c.id,
  name: c.brand.name,
  tagline: c.brand.tagline,
  accentColor: c.brand.accentColor,
  textPrimary: c.brand.textPrimary,
}))

const defaultProject = Object.keys(PROJECT_CONFIGS)[0]
const defaultConfig = PROJECT_CONFIGS[defaultProject]

let nextId = 1

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
  // Walk up until we hit the container — find the most specific non-trivial element
  while (current && current !== containerEl) {
    const tag = current.tagName
    if (!SKIP_TAGS.has(tag)) return current
    if (current.getAttribute('data-annotation-pin') != null) return current
    current = current.parentElement
  }
  return el
}

export default function App() {
  const [screen, setScreen] = useState(defaultConfig.scenarios[0].steps[0].screen)
  const [activeProject, setActiveProject] = useState(defaultProject)
  const [activeScenarioId, setActiveScenarioId] = useState(defaultConfig.scenarios[0].id)
  const [activeView, setActiveView] = useState<'mobile' | 'web'>(
    defaultConfig.scenarios[0].views?.[0] ?? 'mobile'
  )
  const [annotating, setAnnotating] = useState(false)
  const [annotations, setAnnotations] = useState<Annotation[]>([])
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

  const config = PROJECT_CONFIGS[activeProject]
  const ProjectApp = config.component

  // Derive the active scenario to check its views
  const activeScenario = config.scenarios.find(s => s.id === activeScenarioId) ?? config.scenarios[0]
  const scenarioViews = activeScenario.views ?? ['mobile']
  const hasMultipleViews = scenarioViews.includes('mobile') && scenarioViews.includes('web')

  const handleProjectChange = (p: string) => {
    setActiveProject(p)
    const newConfig = PROJECT_CONFIGS[p]
    const firstScenario = newConfig.scenarios[0]
    setActiveScenarioId(firstScenario.id)
    setScreen(firstScenario.steps[0].screen)
    setActiveView(firstScenario.views?.[0] ?? 'mobile')
  }

  const handleScenarioChange = (id: ScenarioId) => {
    setActiveScenarioId(id)
    const newScenario = config.scenarios.find(s => s.id === id) ?? config.scenarios[0]
    setActiveView(newScenario.views?.[0] ?? 'mobile')
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

  // Use capture phase so we intercept clicks BEFORE child onClick handlers fire
  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!annotating) return
    if ((e.target as HTMLElement).closest('[data-annotation-pin]')) return
    if (pending) return

    // Stop event in capture phase — child buttons/links never see it
    e.preventDefault()
    e.stopPropagation()

    const container = phoneRef.current
    if (!container) return

    const target = getBestTarget(e.target as HTMLElement, container)
    const containerRect = container.getBoundingClientRect()
    const elRect = target.getBoundingClientRect()

    // Pin to top-left of the element + small offset
    const x = elRect.left - containerRect.left + 8
    const y = elRect.top - containerRect.top + 8

    const { label, classes } = getElementInfo(target)
    setPending({ x, y, elementLabel: label, elementClasses: classes })
    setHoverRect(null)
  }, [annotating, pending])

  const handleSave = (comment: string) => {
    if (!pending) return
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
  const handleClearAnnotations = () => setAnnotations([])

  const handleSaveSession = async () => {
    await fetch('/api/annotations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: activeProject, annotations }),
    })
  }

  // Web canvas: scale down to fit available center width
  const WEB_W = 1440
  const WEB_H = 900
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
              brand={config.brand}
              scenarios={config.scenarios}
              activeScenarioId={activeScenarioId}
              onScenarioChange={handleScenarioChange}
              personaIndex={config.personaIndex}
              personaFiles={config.personaFiles}
              activeProject={activeProject}
              onProjectChange={handleProjectChange}
              projects={PROJECTS}
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
      <div ref={centerRef} className="flex-1 h-full flex flex-col items-center justify-center bg-zinc-100 p-6 min-w-0">
        {/* Top bar */}
        <div className="mb-4 flex items-center gap-3">
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
                onDelete={handleDeleteAnnotation}
                onClear={handleClearAnnotations}
                onSaveSession={handleSaveSession}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
