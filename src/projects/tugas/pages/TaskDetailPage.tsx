import { useState } from 'react'
import type { Task } from '../data/tasks'

interface TaskDetailPageProps {
  task: Task
  onBack: () => void
  onToggle: () => void
  onDelete: () => void
}

export function TaskDetailPage({ task, onBack, onToggle, onDelete }: TaskDetailPageProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const priorityLabel = task.priority === 'high' ? 'Tinggi' : task.priority === 'medium' ? 'Sedang' : 'Rendah'
  const priorityEmoji = task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢'

  const today = new Date().toISOString().split('T')[0]
  const isOverdue = task.dueDate < today && !task.completed

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  }

  return (
    <div className="tugas flex flex-col min-h-screen" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Header */}
      <div className="px-5 pt-14 pb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm font-medium mb-4"
          style={{ color: 'var(--tg-primary)' }}
        >
          <span>←</span> Kembali
        </button>

        <div className="flex items-start justify-between gap-3">
          <h1
            className="font-bold text-xl leading-tight flex-1"
            style={{
              color: task.completed ? 'var(--tg-muted)' : 'var(--tg-text)',
              textDecoration: task.completed ? 'line-through' : 'none',
            }}
          >
            {task.title}
          </h1>
          {task.completed && (
            <span
              className="flex-shrink-0 text-xs font-semibold px-2 py-1 rounded-lg"
              style={{ background: 'var(--tg-success-light)', color: 'var(--tg-success)' }}
            >
              Selesai ✓
            </span>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="px-5 flex-1">
        {/* Meta row */}
        <div className="flex gap-3 mb-5">
          <div className="tg-card px-4 py-3 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--tg-muted)' }}>
              Prioritas
            </p>
            <div className="flex items-center gap-1.5">
              <span className="text-sm">{priorityEmoji}</span>
              <span className={`tg-badge-${task.priority}`}>{priorityLabel}</span>
            </div>
          </div>
          <div className="tg-card px-4 py-3 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--tg-muted)' }}>
              Tenggat
            </p>
            <p
              className="text-sm font-semibold"
              style={{ color: isOverdue ? 'var(--tg-danger)' : 'var(--tg-text)' }}
            >
              {formatDate(task.dueDate)}
              {isOverdue && ' ⚠️'}
            </p>
          </div>
        </div>

        {/* Description */}
        {task.description && (
          <div className="mb-5">
            <p className="text-[10px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--tg-muted)' }}>
              Deskripsi
            </p>
            <div className="tg-card p-4">
              <p className="text-sm leading-relaxed" style={{ color: 'var(--tg-text-secondary)' }}>
                {task.description}
              </p>
            </div>
          </div>
        )}

        {/* Created at */}
        <div className="mb-5">
          <p className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--tg-muted)' }}>
            Dibuat
          </p>
          <p className="text-sm" style={{ color: 'var(--tg-text-secondary)' }}>
            {formatDate(task.createdAt)}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="px-5 py-6 flex flex-col gap-3">
        <button onClick={onToggle} className="tg-btn-primary w-full">
          {task.completed ? 'Tandai Belum Selesai' : 'Tandai Selesai ✓'}
        </button>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="w-full h-12 rounded-xl text-sm font-semibold transition-colors"
          style={{ color: 'var(--tg-danger)', background: 'var(--tg-danger-light)' }}
        >
          Hapus Tugas
        </button>
      </div>

      {/* Delete confirmation overlay */}
      {showDeleteConfirm && (
        <>
          <div
            className="absolute inset-0 bg-black/40 z-10"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div
            className="absolute bottom-0 left-0 right-0 z-20 rounded-t-2xl p-5 pb-8"
            style={{ background: 'var(--tg-surface)' }}
          >
            <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: 'var(--tg-border)' }} />
            <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--tg-text)' }}>
              Hapus tugas ini?
            </h3>
            <p className="text-sm mb-5" style={{ color: 'var(--tg-text-secondary)' }}>
              "{task.title}" akan dihapus permanen dan tidak bisa dikembalikan.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="tg-btn-secondary flex-1"
              >
                Batal
              </button>
              <button
                onClick={onDelete}
                className="flex-1 h-12 rounded-xl text-sm font-semibold"
                style={{ background: 'var(--tg-danger)', color: '#FFFFFF' }}
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
