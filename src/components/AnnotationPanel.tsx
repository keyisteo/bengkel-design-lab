import { useState, useEffect } from 'react'
import type { Annotation, AnnotationSession } from '../types'

interface AnnotationPanelProps {
  annotations: Annotation[]
  screen: string
  activeView: 'mobile' | 'web'
  projectId: string
  sessionName: string | null
  onNameChange: (name: string) => void
  onDelete: (id: number) => void
  onClear: () => void
  onSaveSession: (name: string) => Promise<void>
  onLoadSession: (annotations: Annotation[]) => void
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).replace(',', ' ·')
}

function buildSummary(
  annotations: Annotation[],
  screen: string,
  activeView: 'mobile' | 'web',
  projectId: string,
  sessionName: string,
): string {
  const now = new Date().toISOString()
  const screenAnnotations = annotations.filter(a => a.screen === screen && a.view === activeView)

  const lines: string[] = []
  lines.push(`## Design Feedback — ${projectId} / ${screen} / ${activeView}`)
  lines.push(`Session: ${sessionName}`)
  lines.push(`Annotated: ${now}`)
  lines.push('')

  if (screenAnnotations.length > 0) {
    screenAnnotations.forEach((a, i) => {
      lines.push(`${i + 1}. [${a.elementLabel} | classes: ${a.elementClasses}]`)
      lines.push(`   "${a.comment}"`)
      lines.push('')
    })
  }

  const otherAnnotations = annotations.filter(a => !(a.screen === screen && a.view === activeView))
  if (otherAnnotations.length > 0) {
    lines.push('### Other screens')
    const byScreenView = otherAnnotations.reduce<Record<string, Annotation[]>>((acc, a) => {
      const key = `${a.screen}::${a.view}`
      acc[key] = acc[key] || []
      acc[key].push(a)
      return acc
    }, {})
    Object.entries(byScreenView).forEach(([key, anns]) => {
      const [s, v] = key.split('::')
      lines.push(`**${s} (${v})**`)
      anns.forEach((a, i) => {
        lines.push(`${i + 1}. [${a.elementLabel} | classes: ${a.elementClasses}]`)
        lines.push(`   "${a.comment}"`)
      })
      lines.push('')
    })
  }

  return lines.join('\n')
}

export function AnnotationPanel({
  annotations,
  screen,
  activeView,
  projectId,
  sessionName,
  onNameChange,
  onDelete,
  onClear,
  onSaveSession,
  onLoadSession,
}: AnnotationPanelProps) {
  const [sessions, setSessions] = useState<AnnotationSession[]>([])
  const [pastExpanded, setPastExpanded] = useState(false)
  const [expandedSession, setExpandedSession] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const fetchSessions = async () => {
    try {
      const res = await fetch(`/api/annotations/${projectId}`)
      if (res.ok) {
        const data = await res.json()
        setSessions(data.sessions ?? [])
      }
    } catch {
      // silently ignore fetch failures (dev / offline)
    }
  }

  useEffect(() => {
    fetchSessions()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  const handleSaveSession = async () => {
    if (!sessionName) return
    setSaving(true)
    await onSaveSession(sessionName)
    await fetchSessions()
    setSaving(false)
  }

  const screenAnnotations = annotations.filter(a => a.screen === screen && a.view === activeView)
  const otherCount = annotations.length - screenAnnotations.length

  const handleCopy = async () => {
    const summary = buildSummary(annotations, screen, activeView, projectId, sessionName ?? 'unnamed')
    await navigator.clipboard.writeText(summary)
  }

  const handleCopySession = async (session: AnnotationSession) => {
    const s = session.annotations[0]?.screen ?? screen
    const v = session.annotations[0]?.view ?? activeView
    const summary = buildSummary(session.annotations, s, v, projectId, session.name || session.savedAt)
    await navigator.clipboard.writeText(summary)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200">
        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Annotations</span>
        {annotations.length > 0 && (
          <button
            className="text-xs text-red-400 hover:text-red-600 font-medium"
            onClick={onClear}
          >
            Clear all
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {annotations.length === 0 && (
          <p className="text-xs text-zinc-400 text-center pt-8">
            Hover over the mockup and click to add a comment.
          </p>
        )}

        {screenAnnotations.map((a, i) => (
          <div key={a.id} className="flex gap-2 group">
            <div className="w-5 h-5 flex-shrink-0 rounded-full bg-amber-400 flex items-center justify-center mt-0.5">
              <span className="text-[10px] font-bold text-white">{i + 1}</span>
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-mono text-zinc-400 mb-0.5">{a.elementLabel}</p>
              <p className="text-xs text-zinc-700 leading-snug">{a.comment}</p>
            </div>
            <button
              className="opacity-0 group-hover:opacity-100 text-zinc-300 hover:text-red-400 transition-opacity text-xs"
              onClick={() => onDelete(a.id)}
            >
              ✕
            </button>
          </div>
        ))}

        {otherCount > 0 && (
          <p className="text-[10px] text-zinc-400 pt-1">
            +{otherCount} annotation{otherCount !== 1 ? 's' : ''} on other screens/views
          </p>
        )}

        {/* Past sessions collapsible */}
        <div className="pt-3 border-t border-zinc-100 mt-3">
          <button
            className="flex items-center gap-1 w-full text-left text-xs font-semibold text-zinc-500 hover:text-zinc-700 transition-colors"
            onClick={() => { setPastExpanded(e => !e); if (!pastExpanded) fetchSessions() }}
          >
            <span className={`transition-transform duration-150 ${pastExpanded ? 'rotate-90' : ''}`}>›</span>
            Past sessions
            {sessions.length > 0 && (
              <span className="ml-auto bg-zinc-100 text-zinc-500 text-[10px] font-medium px-1.5 py-0.5 rounded-full">
                {sessions.length}
              </span>
            )}
          </button>

          {pastExpanded && (
            <div className="mt-2 space-y-2">
              {sessions.length === 0 ? (
                <p className="text-xs text-zinc-400 pl-3">No saved sessions yet</p>
              ) : (
                sessions.map(session => {
                  const key = session.savedAt
                  const isOpen = expandedSession === key
                  return (
                    <div key={key} className="border border-zinc-100 rounded-lg overflow-hidden">
                      <button
                        className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-zinc-50 transition-colors"
                        onClick={() => setExpandedSession(isOpen ? null : key)}
                      >
                        <span className={`text-zinc-400 transition-transform duration-150 ${isOpen ? 'rotate-90' : ''}`}>›</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-zinc-700 truncate">{session.name || '—'}</p>
                          <p className="text-[10px] text-zinc-400">{formatDate(session.savedAt)}</p>
                        </div>
                        <span className="bg-amber-50 text-amber-600 text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0">
                          {session.annotations.length}
                        </span>
                      </button>

                      {isOpen && (
                        <div className="px-3 pb-3 space-y-2 bg-zinc-50">
                          {session.annotations.map((a, i) => {
                            const isCurrentScreen = a.screen === screen
                            return (
                              <div
                                key={i}
                                className={`flex gap-2 pt-2 ${!isCurrentScreen ? 'opacity-40' : ''}`}
                                title={!isCurrentScreen ? `Screen "${a.screen}" — may have changed` : undefined}
                              >
                                <div className={`w-5 h-5 flex-shrink-0 rounded-full flex items-center justify-center mt-0.5 ${isCurrentScreen ? 'bg-amber-200' : 'bg-zinc-200'}`}>
                                  <span className={`text-[10px] font-bold ${isCurrentScreen ? 'text-amber-700' : 'text-zinc-400'}`}>{i + 1}</span>
                                </div>
                                <div className="flex-1">
                                  <p className="text-[10px] font-mono text-zinc-400 mb-0.5">
                                    {a.elementLabel}
                                    {!isCurrentScreen && <span className="ml-1 text-zinc-300">· {a.screen}</span>}
                                  </p>
                                  <p className="text-xs text-zinc-600 leading-snug">{a.comment}</p>
                                </div>
                              </div>
                            )
                          })}
                          <div className="flex gap-2 pt-1">
                            <button
                              className="flex-1 text-xs font-medium text-zinc-500 bg-white border border-zinc-200 hover:bg-zinc-100 py-1.5 rounded-lg transition-colors"
                              onClick={() => handleCopySession(session)}
                            >
                              Copy
                            </button>
                            <button
                              className="flex-1 text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 hover:bg-amber-100 py-1.5 rounded-lg transition-colors"
                              onClick={() => { onLoadSession(session.annotations); setExpandedSession(null) }}
                            >
                              Simulate
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer — session name + actions */}
      {annotations.length > 0 && (
        <div className="px-4 py-3 border-t border-zinc-200 space-y-2">
          <input
            className="w-full text-xs border border-zinc-200 rounded-lg px-2.5 py-1.5 font-mono text-zinc-700 focus:outline-none focus:border-amber-400 bg-zinc-50"
            value={sessionName ?? ''}
            onChange={e => onNameChange(e.target.value)}
            placeholder="session name…"
            spellCheck={false}
          />
          <button
            className="w-full bg-amber-400 hover:bg-amber-500 text-white text-xs font-semibold py-2 rounded-lg transition-colors"
            onClick={handleCopy}
          >
            Copy summary for Claude
          </button>
          <button
            className="w-full border border-zinc-300 text-zinc-600 hover:bg-zinc-50 text-xs font-medium py-2 rounded-lg transition-colors disabled:opacity-40"
            onClick={handleSaveSession}
            disabled={saving || !sessionName}
          >
            {saving ? 'Saving…' : 'Save session'}
          </button>
        </div>
      )}
    </div>
  )
}
