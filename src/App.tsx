import { useState } from 'react'
import './index.css'
import { LeftPanel } from './components/LeftPanel'
import { PROJECT_CONFIGS } from './projects/registry'

const PROJECTS = Object.values(PROJECT_CONFIGS).map((c) => ({
  id: c.id,
  name: c.brand.name,
  tagline: c.brand.tagline,
  accentColor: c.brand.accentColor,
  textPrimary: c.brand.textPrimary,
}))

const defaultProject = Object.keys(PROJECT_CONFIGS)[0]
const defaultConfig = PROJECT_CONFIGS[defaultProject]

export default function App() {
  const [screen, setScreen] = useState(defaultConfig.scenarios[0].steps[0].screen)
  const [activeProject, setActiveProject] = useState(defaultProject)
  const [activeScenarioId, setActiveScenarioId] = useState(defaultConfig.scenarios[0].id)

  const config = PROJECT_CONFIGS[activeProject]
  const ProjectApp = config.component

  const handleProjectChange = (p: string) => {
    setActiveProject(p)
    const newConfig = PROJECT_CONFIGS[p]
    setActiveScenarioId(newConfig.scenarios[0].id)
    setScreen(newConfig.scenarios[0].steps[0].screen)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50">
      <div className="w-[340px] flex-shrink-0 h-full">
        <LeftPanel
          screen={screen}
          onSelectScreen={setScreen}
          brand={config.brand}
          scenarios={config.scenarios}
          activeScenarioId={activeScenarioId}
          onScenarioChange={setActiveScenarioId}
          personaIndex={config.personaIndex}
          personaFiles={config.personaFiles}
          activeProject={activeProject}
          onProjectChange={handleProjectChange}
          projects={PROJECTS}
        />
      </div>

      <div className="flex-1 h-full flex flex-col items-center justify-center bg-zinc-100 p-6">
        <div className="w-[375px] h-[812px] rounded-3xl shadow-2xl border border-zinc-200 bg-zinc-50 overflow-y-auto">
          <div className="h-full">
            <ProjectApp screen={screen} onScreenChange={setScreen} />
          </div>
        </div>
      </div>
    </div>
  )
}
