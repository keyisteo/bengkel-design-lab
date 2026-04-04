import { useState } from 'react'
import type { Task } from '../data/tasks'

type Filter = 'all' | 'active' | 'done'

interface HomePageProps {
  tasks: Task[]
  onToggleTask: (id: string) => void
  onSelectTask: (task: Task) => void
  onNavigate: (screen: string) => void
}

export function HomePage({ tasks, onToggleTask, onSelectTask, onNavigate }: HomePageProps) {
  const [filter, setFilter] = useState<Filter>('all')

  const filtered = tasks.filter((t) => {
    if (filter === 'active') return !t.completed
    if (filter === 'done') return t.completed
    return true
  })

  const activeCount = tasks.filter((t) => !t.completed).length
  const doneCount = tasks.filter((t) => t.completed).length

  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]

  const getDueLabel = (dueDate: string) => {
    if (dueDate === today) return 'Hari ini'
    if (dueDate === tomorrow) return 'Besok'
    if (dueDate < today) return 'Terlambat'
    return null
  }

  return (
    <div className="tugas flex flex-col min-h-screen">
      {/* Header */}
      <div className="px-5 pt-14 pb-2">
        <div className="flex items-center justify-between mb-1">
          <h1 className="font-bold text-2xl" style={{ color: 'var(--tg-text)' }}>
            Tugas
          </h1>
          <button
            onClick={() => onNavigate('tugas-stats')}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'var(--tg-primary-light)' }}
          >
            <span className="text-sm">📊</span>
          </button>
        </div>
        <p className="text-sm" style={{ color: 'var(--tg-text-secondary)' }}>
          {activeCount} aktif · {doneCount} selesai
        </p>
      </div>

      {/* Filter tabs */}
      <div className="px-5 pt-3 pb-2 flex gap-2">
        {([['all', 'Semua'], ['active', 'Aktif'], ['done', 'Selesai']] as [Filter, string][]).map(
          ([f, label]) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-4 py-1.5 rounded-full text-xs font-semibold transition-colors"
              style={{
                background: filter === f ? 'var(--tg-primary)' : 'var(--tg-surface)',
                color: filter === f ? '#FFFFFF' : 'var(--tg-text-secondary)',
                border: filter === f ? 'none' : '1px solid var(--tg-border)',
              }}
            >
              {label}
              {f === 'all' && ` (${tasks.length})`}
              {f === 'active' && ` (${activeCount})`}
              {f === 'done' && ` (${doneCount})`}
            </button>
          ),
        )}
      </div>

      {/* Task list */}
      <div className="px-5 pt-2 pb-4 flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-4xl mb-3">{filter === 'done' ? '🎉' : '📝'}</span>
            <p className="font-semibold" style={{ color: 'var(--tg-text)' }}>
              {filter === 'done' ? 'Belum ada yang selesai' : 'Tidak ada tugas'}
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--tg-muted)' }}>
              {filter === 'done'
                ? 'Selesaikan tugas pertamamu!'
                : 'Tambah tugas baru untuk mulai.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((task) => {
              const dueLabel = getDueLabel(task.dueDate)
              const isOverdue = task.dueDate < today && !task.completed
              return (
                <button
                  key={task.id}
                  className="tg-card p-4 flex items-start gap-3 text-left w-full transition-all active:scale-[0.99]"
                  onClick={() => onSelectTask(task)}
                >
                  {/* Checkbox */}
                  <div
                    className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors"
                    style={{
                      borderColor: task.completed ? 'var(--tg-success)' : 'var(--tg-border)',
                      background: task.completed ? 'var(--tg-success)' : 'transparent',
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggleTask(task.id)
                    }}
                  >
                    {task.completed && (
                      <span className="text-white text-[10px] font-bold">✓</span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-medium text-sm leading-tight"
                      style={{
                        color: task.completed ? 'var(--tg-muted)' : 'var(--tg-text)',
                        textDecoration: task.completed ? 'line-through' : 'none',
                      }}
                    >
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className={`tg-badge-${task.priority}`}>
                        {task.priority === 'high' ? 'Tinggi' : task.priority === 'medium' ? 'Sedang' : 'Rendah'}
                      </span>
                      {dueLabel && (
                        <span
                          className="text-[11px] font-semibold px-2 py-0.5 rounded"
                          style={{
                            background: isOverdue ? 'var(--tg-danger-light)' : 'var(--tg-warning-light)',
                            color: isOverdue ? 'var(--tg-danger)' : 'var(--tg-warning)',
                          }}
                        >
                          {dueLabel}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* FAB */}
      <div className="px-5 pb-4">
        <button
          onClick={() => onNavigate('tugas-add')}
          className="tg-btn-primary w-full flex items-center justify-center gap-2"
        >
          <span className="text-lg leading-none">+</span>
          Tambah Tugas
        </button>
      </div>

      {/* Bottom nav */}
      <div
        className="sticky bottom-0 flex border-t"
        style={{ background: 'var(--tg-surface)', borderColor: 'var(--tg-border)' }}
      >
        <button
          className="flex-1 flex flex-col items-center py-3 gap-1 text-xs font-medium"
          style={{ color: 'var(--tg-primary)' }}
        >
          <span className="text-lg leading-none">📋</span>
          Tugas
        </button>
        <button
          className="flex-1 flex flex-col items-center py-3 gap-1 text-xs font-medium"
          style={{ color: 'var(--tg-muted)' }}
          onClick={() => onNavigate('tugas-stats')}
        >
          <span className="text-lg leading-none">📊</span>
          Statistik
        </button>
      </div>
    </div>
  )
}
