import { useState } from 'react'
import { isDarkBrand } from '../lib/utils'
import type { Screen, ProjectBrand } from '../types'
import type { Review } from '../hooks/use-project-data'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PersonaFile = Record<string, any>

type PersonaIndexType = { _meta: { purpose: string }; personas: Array<{
  id: string
  name: string
  age: number
  role: string
  location: string
  archetype: string
  latestScore: { score: number | null; screen: string | null }
}> }

interface PersonaPanelProps {
  personaIndex: PersonaIndexType
  personaFiles: Record<string, PersonaFile>
  internalPersonaIndex: PersonaIndexType
  internalPersonaFiles: Record<string, PersonaFile>
  reviews: Review[]
  onReviewAction: (reviewId: number, status: 'accepted' | 'rejected') => void
  brand: ProjectBrand
  onSelectScreen: (s: Screen) => void
  activeView: 'mobile' | 'web'
  screenDocs: Record<string, { name: string; step: number }>
}

export function PersonaPanel({
  personaIndex, personaFiles,
  internalPersonaIndex, internalPersonaFiles,
  reviews, onReviewAction,
  brand, onSelectScreen, activeView, screenDocs,
}: PersonaPanelProps) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [expandedFeedback, setExpandedFeedback] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<'users' | 'team'>('users')

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

  const SCREEN_LABEL: Record<string, string> = {}
  for (const [id, doc] of Object.entries(screenDocs)) {
    SCREEN_LABEL[id] = `${doc.step} · ${doc.name}`
  }

  const hasInternalPersonas = internalPersonaIndex.personas.length > 0

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Section tabs: Users / Team */}
      {hasInternalPersonas && (
        <div className="flex px-4 pt-3 gap-1">
          {(['users', 'team'] as const).map(sec => (
            <button
              key={sec}
              onClick={() => { setActiveSection(sec); setExpanded(null) }}
              className="flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-colors"
              style={{
                background: activeSection === sec ? brand.accentColor : 'transparent',
                color: activeSection === sec ? '#fff' : brand.textMuted,
              }}
            >
              {sec === 'users' ? `Users (${personaIndex.personas.length})` : `Team (${internalPersonaIndex.personas.length})`}
            </button>
          ))}
        </div>
      )}

      <div className="px-4 py-3 space-y-3">
        {activeSection === 'users' ? (
          <>
            <p className="text-xs leading-relaxed" style={{ color: theme.textMuted }}>
              {personaIndex._meta.purpose || 'User personas for this project'}
            </p>
            {personaIndex.personas.map(entry => (
              <UserPersonaCard
                key={entry.id}
                entry={entry}
                full={personaFiles[entry.id]}
                reviews={reviews.filter(r => r.persona_id === entry.id)}
                onReviewAction={onReviewAction}
                isOpen={expanded === entry.id}
                onToggle={() => setExpanded(expanded === entry.id ? null : entry.id)}
                expandedFeedback={expandedFeedback}
                onToggleFeedback={(key) => setExpandedFeedback(expandedFeedback === key ? null : key)}
                theme={theme}
                brand={brand}
                activeView={activeView}
                screenLabel={SCREEN_LABEL}
                onSelectScreen={onSelectScreen}
              />
            ))}
          </>
        ) : (
          <>
            <p className="text-xs leading-relaxed" style={{ color: theme.textMuted }}>
              Internal product team personas — review from a professional lens.
            </p>
            {internalPersonaIndex.personas.map(entry => (
              <InternalPersonaCard
                key={entry.id}
                entry={entry}
                full={internalPersonaFiles[entry.id]}
                reviews={reviews.filter(r => r.persona_id === entry.id)}
                onReviewAction={onReviewAction}
                isOpen={expanded === entry.id}
                onToggle={() => setExpanded(expanded === entry.id ? null : entry.id)}
                theme={theme}
                brand={brand}
                screenLabel={SCREEN_LABEL}
                onSelectScreen={onSelectScreen}
              />
            ))}
          </>
        )}
      </div>
    </div>
  )
}

// ── User Persona Card ─────────────────────────────────────

function UserPersonaCard({
  entry, full, reviews, onReviewAction,
  isOpen, onToggle,
  expandedFeedback, onToggleFeedback,
  theme, brand, activeView, screenLabel, onSelectScreen,
}: {
  entry: PersonaPanelProps['personaIndex']['personas'][0]
  full: PersonaFile | undefined
  reviews: Review[]
  onReviewAction: (id: number, s: 'accepted' | 'rejected') => void
  isOpen: boolean
  onToggle: () => void
  expandedFeedback: string | null
  onToggleFeedback: (key: string) => void
  theme: Record<string, string>
  brand: ProjectBrand
  activeView: 'mobile' | 'web'
  screenLabel: Record<string, string>
  onSelectScreen: (s: Screen) => void
}) {
  if (!full) return null

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: theme.border, background: theme.surfaceAlt }}>
      <button
        className="w-full flex items-center gap-3 px-3 py-3 text-left transition-colors"
        style={{ background: isOpen ? theme.surface : 'transparent' }}
        onClick={onToggle}
      >
        <img
          src={full.avatar}
          alt={full.name}
          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
          style={{ boxShadow: `0 0 0 2px ${brand.accentLight}` }}
        />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm" style={{ color: theme.textPrimary }}>{entry.name}</p>
          <p className="text-[10px] truncate" style={{ color: theme.textMuted }}>{entry.age} · {entry.role} · {entry.location?.split(',')[0]}</p>
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
            {/* Quotes */}
            <div className="rounded-lg p-2.5 border" style={{ background: theme.surfaceAlt, borderColor: theme.border }}>
              <p className="text-[10px] font-bold uppercase tracking-wide mb-1.5" style={{ color: theme.textMuted }}>In their own words</p>
              <div className="space-y-1">
                {full.quotes?.slice(0, 2).map((q: string, i: number) => (
                  <p key={i} className="text-xs italic" style={{ color: theme.textSecondary }}>"{q}"</p>
                ))}
              </div>
            </div>

            {/* Trust signals */}
            {full.trustSignals && (
              <>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide mb-1.5" style={{ color: theme.textMuted }}>Must have</p>
                  <div className="flex flex-wrap gap-1">
                    {full.trustSignals.mustHave?.map((t: string) => (
                      <span key={t} className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ background: '#7A9E7E22', color: '#4a7a4e' }}>{t}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide mb-1.5" style={{ color: theme.textMuted }}>Kills it instantly</p>
                  <div className="flex flex-wrap gap-1">
                    {full.trustSignals.killsIt?.map((t: string) => (
                      <span key={t} className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ background: '#D64C4C22', color: '#b83232' }}>{t}</span>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Booking behaviour */}
            {full.bookingBehaviour && (
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
            )}

            {/* Feedback history */}
            {full.feedbackHistory && (() => {
              const visibleFeedback = full.feedbackHistory.filter(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (fb: any) => fb.view === undefined || fb.view === activeView
              )
              return (
                <>
                  <p className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: theme.textMuted }}>
                    Feedback history ({visibleFeedback.length} session{visibleFeedback.length !== 1 ? 's' : ''})
                  </p>
                  <div className="space-y-2">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {visibleFeedback.map((fb: any, i: number) => {
                      const fbKey = `${entry.id}-${i}`
                      const fbOpen = expandedFeedback === fbKey
                      return (
                        <FeedbackEntry
                          key={fbKey}
                          fb={fb}
                          fbKey={fbKey}
                          fbOpen={fbOpen}
                          onToggle={onToggleFeedback}
                          theme={theme}
                          brand={brand}
                          screenLabel={screenLabel}
                          onSelectScreen={onSelectScreen}
                        />
                      )
                    })}
                  </div>
                </>
              )
            })()}

            {/* AI Reviews */}
            {reviews.length > 0 && (
              <>
                <p className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: theme.textMuted }}>
                  AI Reviews ({reviews.length})
                </p>
                <div className="space-y-2">
                  {reviews.map(review => (
                    <ReviewCard
                      key={review.id}
                      review={review}
                      onAction={onReviewAction}
                      theme={theme}
                      brand={brand}
                      screenLabel={screenLabel}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Internal Persona Card ─────────────────────────────────

function InternalPersonaCard({
  entry, full, reviews, onReviewAction,
  isOpen, onToggle,
  theme, brand, screenLabel, onSelectScreen,
}: {
  entry: PersonaPanelProps['personaIndex']['personas'][0]
  full: PersonaFile | undefined
  reviews: Review[]
  onReviewAction: (id: number, s: 'accepted' | 'rejected') => void
  isOpen: boolean
  onToggle: () => void
  theme: Record<string, string>
  brand: ProjectBrand
  screenLabel: Record<string, string>
  onSelectScreen: (s: Screen) => void
}) {
  if (!full) return null

  const initials = full.avatar || full.name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2) || '??'

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: theme.border, background: theme.surfaceAlt }}>
      <button
        className="w-full flex items-center gap-3 px-3 py-3 text-left transition-colors"
        style={{ background: isOpen ? theme.surface : 'transparent' }}
        onClick={onToggle}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
          style={{ background: '#6366F122', color: '#6366F1' }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-bold text-sm" style={{ color: theme.textPrimary }}>{entry.name}</p>
            <span className="text-[8px] font-bold uppercase px-1 py-0.5 rounded" style={{ background: '#6366F122', color: '#6366F1' }}>
              Team
            </span>
          </div>
          <p className="text-[10px] truncate" style={{ color: theme.textMuted }}>{full.role}</p>
        </div>
        <span className="text-[10px]" style={{ color: theme.textMuted }}>{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="border-t" style={{ borderColor: theme.border, background: theme.surface }}>
          <div className="px-3 py-3 space-y-3">
            {/* Quotes */}
            <div className="rounded-lg p-2.5 border" style={{ background: theme.surfaceAlt, borderColor: theme.border }}>
              <p className="text-[10px] font-bold uppercase tracking-wide mb-1.5" style={{ color: theme.textMuted }}>Voice</p>
              <div className="space-y-1">
                {full.quotes?.slice(0, 2).map((q: string, i: number) => (
                  <p key={i} className="text-xs italic" style={{ color: theme.textSecondary }}>"{q}"</p>
                ))}
              </div>
            </div>

            {/* Expertise */}
            {full.expertise && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide mb-1.5" style={{ color: theme.textMuted }}>Expertise</p>
                <div className="flex flex-wrap gap-1">
                  {full.expertise.map((e: string) => (
                    <span key={e} className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ background: '#6366F122', color: '#6366F1' }}>{e}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Review focus */}
            {full.reviewFocus && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide mb-1.5" style={{ color: theme.textMuted }}>Reviews for</p>
                <ul className="space-y-1">
                  {full.reviewFocus.slice(0, 3).map((f: string, i: number) => (
                    <li key={i} className="flex gap-1.5 text-[10px] leading-snug" style={{ color: theme.textSecondary }}>
                      <span className="flex-shrink-0" style={{ color: '#6366F1' }}>·</span>{f}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Severity bias */}
            {full.severityBias && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold" style={{ color: theme.textMuted }}>Severity:</span>
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded capitalize"
                  style={{
                    background: full.severityBias === 'strict' ? '#D64C4C22' : full.severityBias === 'lenient' ? '#7A9E7E22' : '#E8A04A22',
                    color: full.severityBias === 'strict' ? '#b83232' : full.severityBias === 'lenient' ? '#4a7a4e' : '#9a6b1a',
                  }}
                >
                  {full.severityBias}
                </span>
              </div>
            )}

            {/* AI Reviews for this persona */}
            {reviews.length > 0 && (
              <>
                <p className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: theme.textMuted }}>
                  AI Reviews ({reviews.length})
                </p>
                <div className="space-y-2">
                  {reviews.map(review => (
                    <ReviewCard
                      key={review.id}
                      review={review}
                      onAction={onReviewAction}
                      theme={theme}
                      brand={brand}
                      screenLabel={screenLabel}
                      isInternal
                    />
                  ))}
                </div>
              </>
            )}

            {reviews.length === 0 && (
              <p className="text-[10px] italic" style={{ color: theme.textMuted }}>
                No reviews yet. Use Claude Code with the MCP server to simulate a review.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Review Card ───────────────────────────────────────────

function ReviewCard({
  review, onAction, theme, brand, screenLabel, isInternal,
}: {
  review: Review
  onAction: (id: number, s: 'accepted' | 'rejected') => void
  theme: Record<string, string>
  brand: ProjectBrand
  screenLabel: Record<string, string>
  isInternal?: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const r = review.result

  const statusColors = {
    pending: { bg: '#E8A04A22', color: '#9a6b1a' },
    accepted: { bg: '#7A9E7E22', color: '#4a7a4e' },
    rejected: { bg: '#D64C4C22', color: '#b83232' },
  }
  const sc = statusColors[review.status]

  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{ borderColor: theme.border, borderStyle: 'dashed' }}
    >
      <button
        className="w-full flex items-center justify-between px-2.5 py-2 text-left"
        style={{ background: theme.surfaceAlt }}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-1.5">
          <span className="text-[8px] font-bold uppercase px-1 py-0.5 rounded" style={{ background: '#6366F122', color: '#6366F1' }}>
            AI
          </span>
          <span className="text-xs font-semibold" style={{ color: theme.textPrimary }}>
            {screenLabel[review.screen] ?? review.screen}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {r.score !== undefined && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: r.score >= 8 ? '#7A9E7E22' : '#E8A04A22', color: r.score >= 8 ? '#4a7a4e' : '#9a6b1a' }}>
              {r.score}/10
            </span>
          )}
          {r.overallScore !== undefined && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: r.overallScore >= 8 ? '#7A9E7E22' : '#E8A04A22', color: r.overallScore >= 8 ? '#4a7a4e' : '#9a6b1a' }}>
              {r.overallScore}/10
            </span>
          )}
          <span className="text-[8px] font-bold uppercase px-1 py-0.5 rounded" style={{ background: sc.bg, color: sc.color }}>
            {review.status}
          </span>
          <span className="text-[10px]" style={{ color: theme.textMuted }}>{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {expanded && (
        <div className="px-2.5 pb-2.5 space-y-2" style={{ background: theme.surfaceAlt }}>
          <div className="border-t pt-2" style={{ borderColor: theme.border }}>
            {/* User persona review format */}
            {!isInternal && (
              <>
                {r.scoreReason && (
                  <p className="text-xs italic leading-relaxed mb-2" style={{ color: theme.textSecondary }}>"{r.scoreReason}"</p>
                )}
                {r.firstImpression && (
                  <div className="mb-2">
                    <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: theme.textMuted }}>First impression</p>
                    <p className="text-xs italic" style={{ color: theme.textSecondary }}>"{r.firstImpression}"</p>
                  </div>
                )}
                {r.likes?.length > 0 && (
                  <div className="mb-2">
                    <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: theme.textMuted }}>Liked</p>
                    <ul className="space-y-0.5">
                      {r.likes.map((l: string, j: number) => (
                        <li key={j} className="flex gap-1 text-[10px] leading-snug" style={{ color: theme.textSecondary }}>
                          <span className="text-[#7A9E7E] flex-shrink-0">✓</span>{l}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {r.missing?.length > 0 && (
                  <div className="mb-2">
                    <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: theme.textMuted }}>Friction</p>
                    <ul className="space-y-0.5">
                      {r.missing.map((m: string, j: number) => (
                        <li key={j} className="flex gap-1 text-[10px] leading-snug" style={{ color: theme.textSecondary }}>
                          <span className="flex-shrink-0" style={{ color: brand.accentColor }}>·</span>{m}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {r.topChange && (
                  <div className="rounded p-2 border mb-2" style={{ background: brand.bgSubtle, borderColor: brand.accentLight }}>
                    <p className="text-[10px] font-bold uppercase tracking-wide mb-0.5" style={{ color: brand.accentColor }}>#1 change</p>
                    <p className="text-[10px] leading-snug" style={{ color: brand.textPrimary }}>{r.topChange}</p>
                  </div>
                )}
              </>
            )}

            {/* Internal persona review format */}
            {isInternal && (
              <>
                {r.summary && (
                  <p className="text-xs leading-relaxed mb-2" style={{ color: theme.textSecondary }}>{r.summary}</p>
                )}
                {r.findings?.length > 0 && (
                  <div className="mb-2 space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: theme.textMuted }}>Findings</p>
                    {r.findings.map((f: { category: string; severity: string; finding: string; suggestion: string }, j: number) => (
                      <div key={j} className="rounded p-2 border" style={{ borderColor: theme.border, background: theme.surfaceAlt }}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[8px] font-bold uppercase px-1 py-0.5 rounded"
                            style={{
                              background: f.severity === 'critical' ? '#D64C4C22' : f.severity === 'warning' ? '#E8A04A22' : '#6366F122',
                              color: f.severity === 'critical' ? '#b83232' : f.severity === 'warning' ? '#9a6b1a' : '#6366F1',
                            }}>
                            {f.severity}
                          </span>
                          <span className="text-[10px] font-semibold" style={{ color: theme.textPrimary }}>{f.category}</span>
                        </div>
                        <p className="text-[10px] leading-snug mb-1" style={{ color: theme.textSecondary }}>{f.finding}</p>
                        <p className="text-[10px] leading-snug italic" style={{ color: theme.textMuted }}>{f.suggestion}</p>
                      </div>
                    ))}
                  </div>
                )}
                {r.topChanges?.length > 0 && (
                  <div className="rounded p-2 border mb-2" style={{ background: brand.bgSubtle, borderColor: brand.accentLight }}>
                    <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: brand.accentColor }}>Top changes</p>
                    <ul className="space-y-0.5">
                      {r.topChanges.map((c: string, j: number) => (
                        <li key={j} className="text-[10px] leading-snug" style={{ color: brand.textPrimary }}>· {c}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}

            {/* Accept/Reject buttons */}
            {review.status === 'pending' && (
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => onAction(review.id, 'accepted')}
                  className="flex-1 text-[10px] font-bold py-1.5 rounded-md transition-colors"
                  style={{ background: '#7A9E7E22', color: '#4a7a4e' }}
                >
                  Accept
                </button>
                <button
                  onClick={() => onAction(review.id, 'rejected')}
                  className="flex-1 text-[10px] font-bold py-1.5 rounded-md transition-colors"
                  style={{ background: '#D64C4C22', color: '#b83232' }}
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Feedback Entry (existing manual feedback) ─────────────

function FeedbackEntry({
  fb, fbKey, fbOpen, onToggle, theme, brand, screenLabel, onSelectScreen,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fb: any
  fbKey: string
  fbOpen: boolean
  onToggle: (key: string) => void
  theme: Record<string, string>
  brand: ProjectBrand
  screenLabel: Record<string, string>
  onSelectScreen: (s: Screen) => void
}) {
  return (
    <div className="rounded-lg border overflow-hidden" style={{ borderColor: theme.border }}>
      <button
        className="w-full flex items-center justify-between px-2.5 py-2 text-left"
        style={{ background: theme.surfaceAlt }}
        onClick={() => onToggle(fbKey)}
      >
        <div>
          <span className="text-xs font-semibold" style={{ color: theme.textPrimary }}>{screenLabel[fb.screen] ?? fb.screen}</span>
          <span className="text-[10px] ml-2 font-mono" style={{ color: theme.textMuted }}>{fb.date}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ background: fb.score >= 8 ? '#7A9E7E22' : '#E8A04A22', color: fb.score >= 8 ? '#4a7a4e' : '#9a6b1a' }}
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
          {fb.firstImpression && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: theme.textMuted }}>First impression</p>
              <p className="text-xs italic" style={{ color: theme.textSecondary }}>"{fb.firstImpression}"</p>
            </div>
          )}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: theme.textMuted }}>Liked</p>
            <ul className="space-y-0.5">
              {fb.likes.map((l: string, j: number) => (
                <li key={j} className="flex gap-1 text-[10px] leading-snug" style={{ color: theme.textSecondary }}>
                  <span className="text-[#7A9E7E] flex-shrink-0">✓</span>{l}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: theme.textMuted }}>Friction</p>
            <ul className="space-y-0.5">
              {fb.missing.map((m: string, j: number) => (
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
}
