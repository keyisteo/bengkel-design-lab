import { useState } from 'react'
import { isDarkBrand } from '../lib/utils'
import type { Screen, LabPersona, ProjectBrand } from '../types'

interface PersonaPanelProps {
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
  brand: ProjectBrand
  onSelectScreen: (s: Screen) => void
  activeView: 'mobile' | 'web'
}

export function PersonaPanel({ personaIndex, personaFiles, brand, onSelectScreen, activeView }: PersonaPanelProps) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [expandedFeedback, setExpandedFeedback] = useState<string | null>(null)

  const isDark = isDarkBrand(brand.bgSubtle)

  const theme = {
    textPrimary: brand.textPrimary,
    textSecondary: brand.textSecondary,
    textMuted: brand.textMuted,
    border: isDark ? '#3A3A3A' : '#e5e7eb',
    surface: isDark ? '#1A1A1A' : '#f4f4f5',
    surfaceAlt: isDark ? '#252525' : '#ffffff',
    badgeBg: isDark ? '#3A3A3A' : '#f4f4f5',
  }

  const SCREEN_LABEL: Record<string, string> = {
    'tugas-home': '1 · Home',
    'tugas-add': '2 · Add Task',
    'tugas-detail': '3 · Detail',
    'tugas-stats': '4 · Stats',
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
      <div className="mb-1">
        <p className="text-xs leading-relaxed" style={{ color: theme.textMuted }}>
          {personaIndex._meta.purpose}
        </p>
      </div>

      {personaIndex.personas.map((entry) => {
        const full = personaFiles[entry.id]
        const isOpen = expanded === entry.id
        if (!full) return null
        return (
          <div key={entry.id} className="rounded-xl border overflow-hidden" style={{ borderColor: theme.border, background: theme.surfaceAlt }}>
            <button
              className="w-full flex items-center gap-3 px-3 py-3 text-left transition-colors"
              style={{ background: isOpen ? theme.surface : 'transparent' }}
              onClick={() => setExpanded(isOpen ? null : entry.id)}
            >
              <img
                src={full.avatar}
                alt={full.name}
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                style={{ boxShadow: `0 0 0 2px ${brand.accentLight}` }}
              />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm" style={{ color: theme.textPrimary }}>{entry.name}</p>
                <p className="text-[10px] truncate" style={{ color: theme.textMuted }}>{entry.age} · {entry.role} · {entry.location.split(',')[0]}</p>
                <p className="text-[10px] mt-0.5 truncate" style={{ color: brand.accentColor }}>{entry.archetype}</p>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span
                  className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                  style={{
                    background: (entry.latestScore.score ?? 0) >= 8 ? '#7A9E7E22' : '#E8A04A22',
                    color: (entry.latestScore.score ?? 0) >= 8 ? '#4a7a4e' : '#9a6b1a',
                  }}
                >
                  {entry.latestScore.score !== null ? `${entry.latestScore.score}/10` : '—'}
                </span>
                <span className="text-[10px]" style={{ color: theme.textMuted }}>{isOpen ? '▲' : '▼'}</span>
              </div>
            </button>

            {isOpen && (
              <div className="border-t" style={{ borderColor: theme.border, background: theme.surface }}>
                <div className="px-3 py-3 space-y-3">
                  <div className="rounded-lg p-2.5 border" style={{ background: theme.surfaceAlt, borderColor: theme.border }}>
                    <p className="text-[10px] font-bold uppercase tracking-wide mb-1.5" style={{ color: theme.textMuted }}>In their own words</p>
                    <div className="space-y-1">
                      {full.quotes.slice(0, 2).map((q, i) => (
                        <p key={i} className="text-xs italic" style={{ color: theme.textSecondary }}>"{q}"</p>
                      ))}
                    </div>
                  </div>

                  {full.trustSignals && (
                    <>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wide mb-1.5" style={{ color: theme.textMuted }}>Must have</p>
                        <div className="flex flex-wrap gap-1">
                          {full.trustSignals.mustHave.map((t) => (
                            <span key={t} className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ background: '#7A9E7E22', color: '#4a7a4e' }}>{t}</span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wide mb-1.5" style={{ color: theme.textMuted }}>Kills it instantly</p>
                        <div className="flex flex-wrap gap-1">
                          {full.trustSignals.killsIt.map((t) => (
                            <span key={t} className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ background: '#D64C4C22', color: '#b83232' }}>{t}</span>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  <div className="rounded-lg p-2.5 border" style={{ background: theme.surfaceAlt, borderColor: theme.border }}>
                    <p className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: theme.textMuted }}>Booking behaviour</p>
                    <div className="space-y-1.5">
                      {[
                        ['Decides', full.bookingBehaviour.decisionTiming],
                        ['Drop-off', full.bookingBehaviour.dropOffTrigger],
                        ['Style', full.bookingBehaviour.bookingStyle],
                        ['Price range', full.bookingBehaviour.priceRange],
                      ].map(([label, val]) => (
                        <div key={label} className="flex gap-2">
                          <span className="text-[10px] font-bold w-16 flex-shrink-0" style={{ color: theme.textMuted }}>{label}</span>
                          <span className="text-[10px] leading-snug" style={{ color: theme.textSecondary }}>{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    {(() => {
                      const visibleFeedback = full.feedbackHistory.filter(
                        fb => fb.view === undefined || fb.view === activeView
                      )
                      return (
                    <>
                    <p className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: theme.textMuted }}>
                      Feedback history ({visibleFeedback.length} session{visibleFeedback.length !== 1 ? 's' : ''})
                    </p>
                    <div className="space-y-2">
                      {visibleFeedback.map((fb, i) => {
                        const fbKey = `${entry.id}-${i}`
                        const fbOpen = expandedFeedback === fbKey
                        return (
                          <div key={fbKey} className="rounded-lg border overflow-hidden" style={{ borderColor: theme.border }}>
                            <button
                              className="w-full flex items-center justify-between px-2.5 py-2 text-left"
                              style={{ background: theme.surfaceAlt }}
                              onClick={() => setExpandedFeedback(fbOpen ? null : fbKey)}
                            >
                              <div>
                                <span className="text-xs font-semibold" style={{ color: theme.textPrimary }}>{SCREEN_LABEL[fb.screen] ?? fb.screen}</span>
                                <span className="text-[10px] ml-2 font-mono" style={{ color: theme.textMuted }}>{fb.date}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                                  style={{
                                    background: fb.score >= 8 ? '#7A9E7E22' : '#E8A04A22',
                                    color: fb.score >= 8 ? '#4a7a4e' : '#9a6b1a',
                                  }}
                                >
                                  {fb.score}/10
                                </span>
                                <button
                                  className="text-[10px] font-medium hover:underline px-1"
                                  style={{ color: brand.accentColor }}
                                  onClick={(e) => { e.stopPropagation(); onSelectScreen(fb.screen as Screen) }}
                                  title="Jump to this screen"
                                >
                                  View →
                                </button>
                                <span className="text-[10px]" style={{ color: theme.textMuted }}>{fbOpen ? '▲' : '▼'}</span>
                              </div>
                            </button>

                            {fbOpen && (
                              <div className="px-2.5 pb-2.5 space-y-2" style={{ background: theme.surfaceAlt }}>
                                <p className="text-xs italic leading-relaxed border-t py-2" style={{ color: theme.textSecondary, borderColor: theme.border }}>"{fb.scoreReason}"</p>
                                <div>
                                  <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: theme.textMuted }}>First impression</p>
                                  <p className="text-xs italic" style={{ color: theme.textSecondary }}>"{fb.firstImpression}"</p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: theme.textMuted }}>Liked</p>
                                  <ul className="space-y-0.5">
                                    {fb.likes.map((l, j) => (
                                      <li key={j} className="flex gap-1 text-[10px] leading-snug" style={{ color: theme.textSecondary }}>
                                        <span className="text-[#7A9E7E] flex-shrink-0">✓</span>{l}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                <div>
                                  <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: theme.textMuted }}>Friction</p>
                                  <ul className="space-y-0.5">
                                    {fb.missing.map((m, j) => (
                                      <li key={j} className="flex gap-1 text-[10px] leading-snug" style={{ color: theme.textSecondary }}>
                                        <span className="flex-shrink-0" style={{ color: brand.accentColor }}>·</span>{m}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                <div className="rounded p-2 border" style={{ background: brand.bgSubtle, borderColor: brand.accentLight }}>
                                  <p className="text-[10px] font-bold uppercase tracking-wide mb-0.5" style={{ color: brand.accentColor }}>#1 change</p>
                                  <p className="text-[10px] leading-snug" style={{ color: brand.textPrimary }}>{fb.topChange}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                    </>
                      )
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
