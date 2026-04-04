import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { Scenario, ScenarioId } from '../types'

interface ScenarioSelectorProps {
  scenarios: Scenario[]
  active: ScenarioId
  onChange: (id: ScenarioId) => void
  brand: { accentColor: string; textSecondary: string; bgSubtle: string; textPrimary: string }
}

export function ScenarioSelector({ scenarios, active, onChange, brand }: ScenarioSelectorProps) {
  const [open, setOpen] = useState(false)
  const activeScenario = scenarios.find((s) => s.id === active)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors"
        style={{ background: brand.bgSubtle }}
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: brand.accentColor }} />
          <span className="font-medium" style={{ color: brand.textPrimary }}>{activeScenario?.label}</span>
        </div>
        <ChevronDown size={14} className="transition-transform" style={{ color: brand.textSecondary }} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute top-full left-0 right-0 mt-1 rounded-lg shadow-lg z-50 overflow-hidden border"
            style={{ background: 'white', borderColor: '#e5e7eb' }}
          >
            {scenarios.map((sc) => (
              <button
                key={sc.id}
                onClick={() => { onChange(sc.id as ScenarioId); setOpen(false) }}
                className="w-full text-left px-3 py-2 text-xs transition-colors"
                style={{
                  background: sc.id === active ? brand.accentColor : 'transparent',
                  color: sc.id === active ? '#ffffff' : '#18181b',
                }}
              >
                <div className="font-medium">{sc.label}</div>
                <div
                  className="text-[10px] mt-0.5"
                  style={{ color: sc.id === active ? 'rgba(255,255,255,0.7)' : '#71717a' }}
                >
                  {sc.description}
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
