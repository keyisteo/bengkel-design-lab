import { useState } from 'react'
import type { Annotation } from '../types'

export interface HoverRect {
  left: number
  top: number
  width: number
  height: number
  label: string
}

interface AnnotationLayerProps {
  screen: string
  activeView: 'mobile' | 'web'
  annotations: Annotation[]
  hoverRect: HoverRect | null
  pending: { x: number; y: number; elementLabel: string; elementClasses: string } | null
  onSave: (comment: string) => void
  onCancelPending: () => void
  onDelete: (id: number) => void
}

export function AnnotationLayer({
  screen,
  activeView,
  annotations,
  hoverRect,
  pending,
  onSave,
  onCancelPending,
  onDelete,
}: AnnotationLayerProps) {
  const [draft, setDraft] = useState('')
  const [selected, setSelected] = useState<number | null>(null)

  const handleSave = () => {
    if (!draft.trim()) { onCancelPending(); return }
    onSave(draft.trim())
    setDraft('')
  }

  const handleCancel = () => {
    setDraft('')
    onCancelPending()
  }

  const screenAnnotations = annotations.filter(a => a.screen === screen && a.view === activeView)

  return (
    // pointer-events: none so mouse events fall through to the real elements below
    // Individual pins re-enable pointer-events
    <div className="absolute inset-0 rounded-3xl pointer-events-none" style={{ zIndex: 10 }}>

      {/* Hover highlight */}
      {hoverRect && (
        <div
          className="absolute border-2 border-blue-500 rounded transition-all duration-75"
          style={{
            left: hoverRect.left,
            top: hoverRect.top,
            width: hoverRect.width,
            height: hoverRect.height,
          }}
        >
          <span className="absolute -top-5 left-0 bg-blue-500 text-white text-[10px] font-mono px-1.5 py-0.5 rounded whitespace-nowrap">
            {hoverRect.label}
          </span>
        </div>
      )}

      {/* Saved pins */}
      {screenAnnotations.map((a, i) => (
        <div
          key={a.id}
          className="absolute pointer-events-auto"
          style={{ left: a.x, top: a.y, transform: 'translate(-50%, -50%)' }}
        >
          <button
            className="w-6 h-6 rounded-full bg-amber-400 border-2 border-white shadow-md text-[10px] font-bold text-white flex items-center justify-center hover:bg-amber-500 transition-colors"
            onClick={(e) => { e.stopPropagation(); setSelected(selected === a.id ? null : a.id) }}
          >
            {i + 1}
          </button>

          {selected === a.id && (
            <div
              className="absolute z-20 w-56 bg-white rounded-xl shadow-xl border border-zinc-200 p-3 text-xs"
              style={{ left: '110%', top: '50%', transform: 'translateY(-50%)' }}
              onClick={e => e.stopPropagation()}
            >
              <p className="text-[10px] font-mono text-zinc-400 mb-1">{a.elementLabel}</p>
              <p className="text-zinc-700 leading-snug">{a.comment}</p>
              <button
                className="mt-2 text-red-400 hover:text-red-600 font-medium"
                onClick={() => { onDelete(a.id); setSelected(null) }}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      ))}

      {/* Pending comment input */}
      {pending && (
        <div
          className="absolute pointer-events-auto z-30"
          style={{ left: pending.x, top: pending.y, transform: 'translate(-50%, -50%)' }}
          onClick={e => e.stopPropagation()}
        >
          <div className="w-6 h-6 rounded-full bg-amber-400 border-2 border-white shadow-md flex items-center justify-center">
            <span className="text-[10px] font-bold text-white">+</span>
          </div>
          <div
            className="absolute w-56 bg-white rounded-xl shadow-xl border border-zinc-200 p-3"
            style={{ left: '110%', top: '50%', transform: 'translateY(-50%)' }}
          >
            <textarea
              autoFocus
              className="w-full text-xs border border-zinc-200 rounded-lg p-2 resize-none outline-none focus:border-amber-400"
              rows={3}
              placeholder="Add a comment…"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSave() }
                if (e.key === 'Escape') handleCancel()
              }}
            />
            <div className="flex gap-2 mt-2">
              <button
                className="flex-1 bg-amber-400 hover:bg-amber-500 text-white text-xs font-medium py-1 rounded-lg transition-colors"
                onClick={handleSave}
              >
                Save
              </button>
              <button
                className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 text-xs font-medium py-1 rounded-lg transition-colors"
                onClick={handleCancel}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
