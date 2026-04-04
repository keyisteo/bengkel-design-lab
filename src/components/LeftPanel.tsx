import { useState } from 'react'
import { isDarkBrand } from '../lib/utils'
import type { Screen, Scenario, ScenarioId, ProjectBrand, LabPersona } from '../types'
import { ScenarioSelector } from './ScenarioSelector'
import { ProjectSwitcher } from './ProjectSwitcher'
import { DocsPanel } from './DocsPanel'
import { PersonaPanel } from './PersonaPanel'

type PanelTab = 'docs' | 'personas'

interface LeftPanelProps {
  screen: Screen
  onSelectScreen: (s: Screen) => void
  brand: ProjectBrand
  scenarios: Scenario[]
  activeScenarioId: ScenarioId
  onScenarioChange: (id: ScenarioId) => void
  personaIndex: { _meta: { purpose: string }; personas: Array<{
    id: string
    name: string
    age: number
    role: string
    location: string
    archetype: string
    latestScore: { score: number | null; screen: string | null }
  }> }
  personaFiles: Record<string, LabPersona>
  activeProject: string
  onProjectChange: (id: string) => void
  projects: Array<{ id: string; name: string; tagline: string; accentColor: string; textPrimary: string }>
}

export function LeftPanel({
  screen,
  onSelectScreen,
  brand,
  scenarios,
  activeScenarioId,
  onScenarioChange,
  personaIndex,
  personaFiles,
  activeProject,
  onProjectChange,
  projects,
}: LeftPanelProps) {
  const [tab, setTab] = useState<PanelTab>('docs')
  const personaCount = personaIndex.personas.length

  const activeScenario = scenarios.find((sc) => sc.id === activeScenarioId)
  const scenarioSteps = activeScenario?.steps ?? []
  const currentStep = scenarioSteps.findIndex((s) => s.screen === screen)

  const handleScenarioChange = (id: ScenarioId) => {
    onScenarioChange(id)
    const scenario = scenarios.find((s) => s.id === id)
    if (scenario?.steps[0]) {
      onSelectScreen(scenario.steps[0].screen)
    }
    setTab('docs')
  }

  const isDark = isDarkBrand(brand.bgSubtle)
  const borderColor = isDark ? '#3A3A3A' : '#f4f4f5'

  return (
    <aside
      className="flex flex-col h-full overflow-hidden"
      style={{ background: brand.bgSubtle, borderRight: `1px solid ${borderColor}` }}
    >
      {/* Project switcher */}
      <div
        className="px-5 pt-5 pb-3 flex-shrink-0"
        style={{ borderBottom: `1px solid ${borderColor}` }}
      >
        <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: brand.textMuted }}>
          Project
        </p>
        <ProjectSwitcher
          projects={projects}
          active={activeProject}
          onChange={onProjectChange}
          brand={brand}
        />
      </div>

      {/* Brand + Scenario */}
      <div
        className="px-5 pt-4 pb-4 flex-shrink-0"
        style={{ borderBottom: `1px solid ${borderColor}` }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
            style={{ background: brand.accentColor }}
          >
            {brand.logoChar}
          </div>
          <div className="min-w-0">
            <p className="font-bold leading-none" style={{ color: brand.textPrimary }}>{brand.name}</p>
            <p className="text-xs mt-0.5" style={{ color: brand.textMuted }}>{brand.tagline}</p>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: brand.textMuted }}>
            Scenario
          </p>
          <ScenarioSelector
            scenarios={scenarios}
            active={activeScenarioId}
            onChange={handleScenarioChange}
            brand={brand}
          />
        </div>

        <div className="flex items-center gap-0">
          {scenarioSteps.map((step, i) => {
            const isActive = step.screen === screen
            const isPast = i < currentStep
            return (
              <button
                key={step.screen}
                onClick={() => { onSelectScreen(step.screen); setTab('docs') }}
                className="flex-1 flex flex-col items-center gap-1 group"
                title={`Go to ${step.label}`}
              >
                <div className="flex items-center w-full">
                  <div
                    className="flex-1 h-px"
                    style={{
                      background: i === 0 ? 'transparent' : isPast || isActive ? brand.accentColor : borderColor,
                    }}
                  />
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-all"
                    style={{
                      background: isActive ? brand.accentColor : isPast ? brand.accentColor : (isDark ? '#3A3A3A' : '#f4f4f5'),
                      color: isActive || isPast ? '#ffffff' : (isDark ? '#9C9890' : '#a1a1aa'),
                    }}
                  >
                    {i + 1}
                  </div>
                  <div
                    className="flex-1 h-px"
                    style={{
                      background: i === scenarioSteps.length - 1 ? 'transparent' : isPast ? brand.accentColor : borderColor,
                    }}
                  />
                </div>
                <span
                  className="text-[10px] font-medium leading-none transition-colors"
                  style={{
                    color: isActive ? brand.accentColor : isPast ? brand.textSecondary : brand.textMuted,
                  }}
                >
                  {step.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div
        className="flex flex-shrink-0"
        style={{ borderBottom: `1px solid ${borderColor}` }}
      >
        {([['docs', 'Screen Docs'], ['personas', `Personas`]] as [PanelTab, string][]).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-2.5 text-xs font-semibold transition-colors relative"
            style={{ color: tab === t ? brand.accentColor : brand.textMuted }}
          >
            {label}
            {t === 'personas' && personaCount > 0 && (
              <span
                className="ml-1 text-[10px] px-1 rounded font-mono"
                style={{ background: isDark ? '#3A3A3A' : '#f4f4f5', color: brand.textMuted }}
              >
                {personaCount}
              </span>
            )}
            {tab === t && (
              <span
                className="absolute bottom-0 inset-x-0 h-0.5 rounded-t"
                style={{ background: brand.accentColor }}
              />
            )}
          </button>
        ))}
      </div>

      {tab === 'personas' ? (
        <PersonaPanel
          personaIndex={personaIndex}
          personaFiles={personaFiles}
          brand={brand}
          onSelectScreen={(s) => { onSelectScreen(s); setTab('docs') }}
        />
      ) : (
        <DocsPanel screen={screen} brand={brand} />
      )}

      <div
        className="px-5 py-3 flex-shrink-0"
        style={{ borderTop: `1px solid ${borderColor}` }}
      >
        <p className="text-xs" style={{ color: brand.textMuted }}>
          Design Lab · {brand.name}
        </p>
      </div>
    </aside>
  )
}
