import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import { isDarkBrand } from '../lib/utils'
import type { ProjectBrand } from '../types'

interface ProjectEntry {
  id: string
  name: string
  tagline: string
  accentColor: string
  textPrimary: string
}

interface ProjectSwitcherProps {
  projects: ProjectEntry[]
  active: string
  onChange: (id: string) => void
  brand: ProjectBrand
}

export function ProjectSwitcher({ projects, active, onChange, brand }: ProjectSwitcherProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const isDark = isDarkBrand(brand.bgSubtle)
  const borderColor = isDark ? '#3A3A3A' : '#e5e7eb'
  const surfaceColor = isDark ? '#1A1A1A' : '#ffffff'
  const surfaceAltColor = isDark ? '#252525' : '#f4f4f5'

  const activeProject = projects.find((p) => p.id === active)

  useEffect(() => {
    if (open) {
      setQuery('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const filtered = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.tagline.toLowerCase().includes(query.toLowerCase())
  )

  const handleSelect = (id: string) => {
    onChange(id)
    setOpen(false)
    setQuery('')
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors"
        style={{ background: surfaceAltColor }}
      >
        <div className="flex items-center gap-2 min-w-0">
          {activeProject && (
            <div
              className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold flex-shrink-0"
              style={{ background: activeProject.accentColor, color: '#fff' }}
            >
              {activeProject.name[0]}
            </div>
          )}
          <span className="font-medium truncate" style={{ color: activeProject?.textPrimary ?? '#18181b' }}>
            {activeProject?.name ?? 'Select project'}
          </span>
        </div>
        <ChevronDown
          size={14}
          className="flex-shrink-0 transition-transform"
          style={{ transform: open ? 'rotate(180deg)' : 'none', color: brand.textMuted }}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute top-full left-0 right-0 mt-1 rounded-xl shadow-lg z-50 overflow-hidden border"
            style={{ background: surfaceColor, borderColor }}
          >
            <div className="p-2 border-b" style={{ borderColor }}>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: brand.textMuted }} />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search projects..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg outline-none"
                  style={{ background: surfaceAltColor, borderColor, color: brand.textPrimary }}
                />
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <p className="px-3 py-2 text-xs" style={{ color: brand.textMuted }}>No projects found</p>
              ) : (
                filtered.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelect(p.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors"
                    style={{
                      background: p.id === active ? `${p.accentColor}18` : 'transparent',
                    }}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: p.accentColor, color: '#fff' }}
                    >
                      {p.name[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-xs font-semibold"
                          style={{ color: p.id === active ? p.accentColor : brand.textPrimary }}
                        >
                          {p.name}
                        </span>
                        {p.id === active && (
                          <span
                            className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                            style={{ background: `${p.accentColor}22`, color: p.accentColor }}
                          >
                            active
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] truncate" style={{ color: brand.textMuted }}>{p.tagline}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
