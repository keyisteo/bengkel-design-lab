import { useState } from 'react'
import { isDarkBrand } from '../lib/utils'
import type { Screen, ProjectBrand } from '../types'
import { SCREEN_DOCS } from '../data/screenDocs'

function CollapsibleSection({
  title,
  count,
  defaultOpen = true,
  children,
  theme,
}: {
  title: string
  count?: number
  defaultOpen?: boolean
  children: React.ReactNode
  theme: { muted: string; border: string; surface: string }
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 mb-3 hover:opacity-80 -mx-2 px-2 py-1 rounded-lg transition-colors"
        style={{ background: theme.surface }}
      >
        <span className="text-[10px] transition-transform" style={{ color: theme.muted }}>{isOpen ? '▼' : '▶'}</span>
        <p className="text-xs font-semibold uppercase tracking-widest flex-1 text-left" style={{ color: theme.muted }}>
          {title}
        </p>
        {count !== undefined && (
          <span className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ background: theme.surface, color: theme.muted }}>
            {count}
          </span>
        )}
      </button>
      {isOpen && children}
    </div>
  )
}

interface DocsPanelProps {
  screen: Screen
  brand: ProjectBrand
}

export function DocsPanel({ screen, brand }: DocsPanelProps) {
  const isDark = isDarkBrand(brand.bgSubtle)

  const theme = {
    textPrimary: brand.textPrimary,
    textSecondary: brand.textSecondary,
    textMuted: brand.textMuted,
    muted: brand.textMuted,
    border: isDark ? '#3A3A3A' : '#e5e7eb',
    surface: isDark ? '#1A1A1A' : '#f4f4f5',
    surfaceAlt: isDark ? '#252525' : '#ffffff',
    badgeBg: isDark ? '#3A3A3A' : '#f4f4f5',
  }

  const doc = SCREEN_DOCS[screen]
  if (!doc) {
    return (
      <div className="flex-1 overflow-y-auto px-5 py-5">
        <p className="text-sm" style={{ color: theme.textMuted }}>No documentation for this screen yet.</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: theme.textMuted }}>
          Current Screen
        </p>
        <h2 className="font-bold text-lg leading-tight mb-1" style={{ color: theme.textPrimary }}>
          {doc.name}
        </h2>
        <p className="text-xs font-medium leading-snug" style={{ color: brand.accentColor }}>
          Goal: {doc.goal}
        </p>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: theme.textMuted }}>
          What it does
        </p>
        <p className="text-sm leading-relaxed" style={{ color: theme.textSecondary }}>{doc.description}</p>
      </div>

      <CollapsibleSection title="Design Notes" theme={theme}>
        <ul className="space-y-2">
          {doc.designNotes.map((note, i) => (
            <li key={i} className="flex gap-2 text-sm leading-snug" style={{ color: theme.textSecondary }}>
              <span className="mt-0.5 flex-shrink-0" style={{ color: brand.accentColor }}>·</span>
              {note}
            </li>
          ))}
        </ul>
      </CollapsibleSection>

      {doc.decisions.length > 0 && (
        <CollapsibleSection title="Decision Log" count={doc.decisions.length} defaultOpen={false} theme={theme}>
          <div className="space-y-3">
            {doc.decisions.map((d) => (
              <div
                key={d.id}
                className="rounded-lg border p-3"
                style={{ borderColor: theme.border, background: theme.surfaceAlt }}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <p
                    className="text-xs font-semibold leading-snug"
                    style={d.status === 'scrapped' ? { color: theme.textMuted, textDecorationLine: 'line-through' } : { color: theme.textPrimary }}
                  >
                    {d.decision}
                  </p>
                  <span
                    className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded flex-shrink-0"
                    style={d.status === 'active' ? { background: brand.accentColor, color: '#fff' } : { background: theme.badgeBg, color: theme.textMuted }}
                  >
                    {d.status === 'scrapped' ? 'Scrapped' : 'Active'}
                  </span>
                </div>
                <p className="text-[10px] font-mono mb-1.5" style={{ color: theme.textMuted }}>{d.date}</p>
                <p className="text-xs leading-relaxed" style={{ color: d.status === 'scrapped' ? theme.textMuted : theme.textSecondary }}>
                  {d.rationale}
                </p>
                {d.feedbackIds && d.feedbackIds.length > 0 && (
                  <div className="mt-2 pt-2 border-t" style={{ borderColor: theme.border }}>
                    <p className="text-[10px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: theme.textMuted }}>
                      Prompted by
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {d.feedbackIds.map((id) => (
                        <span key={id} className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ background: theme.surfaceAlt, color: theme.textMuted, borderColor: theme.border, border: '1px solid' }}>
                          {id}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {d.scrappedReason && (
                  <div className="mt-2 pt-2 border-t" style={{ borderColor: theme.border }}>
                    <p className="text-[10px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: theme.textMuted }}>
                      Why scrapped
                    </p>
                    <p className="text-xs leading-relaxed" style={{ color: theme.textMuted }}>{d.scrappedReason}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {doc.personaFeedbacks.length > 0 && (
        <CollapsibleSection title="Persona Feedback" count={doc.personaFeedbacks.length} defaultOpen={false} theme={theme}>
          <div className="space-y-4">
            {doc.personaFeedbacks.map((fb) => (
              <div key={fb.personaId} className="rounded-xl border overflow-hidden" style={{ borderColor: theme.border }}>
                <div className="flex items-center justify-between px-3 py-2.5 border-b" style={{ background: theme.surface, borderColor: theme.border }}>
                  <div>
                    <p className="text-xs font-bold" style={{ color: theme.textPrimary }}>{fb.personaName}</p>
                    <p className="text-[10px]" style={{ color: theme.textMuted }}>{fb.personaRole}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{
                        background: fb.score >= 8 ? '#7A9E7E22' : fb.score >= 6 ? '#E8A04A22' : '#D64C4C22',
                        color: fb.score >= 8 ? '#4a7a4e' : fb.score >= 6 ? '#9a6b1a' : '#b83232',
                      }}
                    >
                      {fb.score}/10
                    </span>
                    <span className="text-[10px] font-mono" style={{ color: theme.textMuted }}>{fb.date}</span>
                  </div>
                </div>
                <div className="px-3 py-3 space-y-3" style={{ background: theme.surfaceAlt }}>
                  <p className="text-xs italic leading-relaxed" style={{ color: theme.textMuted }}>"{fb.scoreReason}"</p>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide mb-1.5" style={{ color: theme.textMuted }}>Likes</p>
                    <ul className="space-y-1">
                      {fb.likes.map((l, i) => (
                        <li key={i} className="flex gap-1.5 text-xs leading-snug" style={{ color: theme.textSecondary }}>
                          <span className="text-[#7A9E7E] flex-shrink-0 mt-0.5">✓</span>{l}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide mb-1.5" style={{ color: theme.textMuted }}>Missing / Friction</p>
                    <ul className="space-y-1">
                      {fb.missing.map((m, i) => (
                        <li key={i} className="flex gap-1.5 text-xs leading-snug" style={{ color: theme.textSecondary }}>
                          <span className="flex-shrink-0 mt-0.5" style={{ color: brand.accentColor }}>·</span>{m}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-lg p-2.5" style={{ background: theme.surface }}>
                    <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: theme.textMuted }}>Next action</p>
                    <p className="text-xs leading-snug" style={{ color: theme.textSecondary }}>{fb.wouldTheyProceed}</p>
                  </div>
                  <div className="rounded-lg p-2.5 border" style={{ background: brand.bgSubtle, borderColor: brand.accentLight }}>
                    <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: brand.accentColor }}>#1 thing to change</p>
                    <p className="text-xs leading-snug" style={{ color: brand.textPrimary }}>{fb.topChange}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      <CollapsibleSection title="Components" count={doc.components.length} theme={theme}>
        <div className="flex flex-wrap gap-1.5">
          {doc.components.map((c) => (
            <span
              key={c}
              className="text-xs px-2.5 py-1 rounded-md font-mono"
              style={{ background: theme.surface, color: theme.textSecondary, borderColor: theme.border, border: '1px solid' }}
            >
              {c}
            </span>
          ))}
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Design Tokens" count={doc.tokens.length} theme={theme}>
        <div className="space-y-2">
          {doc.tokens.map((t) => (
            <div key={t.name} className="flex items-center gap-2.5">
              <div
                className="w-5 h-5 rounded flex-shrink-0 border"
                style={{ background: t.value, borderColor: theme.border }}
              />
              <span className="text-xs font-mono flex-1" style={{ color: theme.textMuted }}>{t.name}</span>
              <span className="text-xs font-mono" style={{ color: theme.textMuted }}>{t.value}</span>
            </div>
          ))}
        </div>
      </CollapsibleSection>
    </div>
  )
}
