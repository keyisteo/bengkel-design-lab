import { useState } from 'react'
import type { Task } from '../data/tasks'

type Priority = 'low' | 'medium' | 'high'

interface AddTaskPageProps {
  onAdd: (task: Omit<Task, 'id' | 'completed' | 'createdAt'>) => void
  onBack: () => void
}

export function AddTaskPage({ onAdd, onBack }: AddTaskPageProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [dueDate, setDueDate] = useState('')

  const canSubmit = title.trim().length > 0

  const handleSubmit = () => {
    if (!canSubmit) return
    onAdd({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      dueDate: dueDate || new Date().toISOString().split('T')[0],
    })
  }

  return (
    <div className="tugas flex flex-col min-h-screen">
      {/* Header */}
      <div className="px-5 pt-14 pb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm font-medium mb-4"
          style={{ color: 'var(--tg-primary)' }}
        >
          <span>←</span> Kembali
        </button>
        <h1 className="font-bold text-2xl" style={{ color: 'var(--tg-text)' }}>
          Tambah Tugas
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--tg-text-secondary)' }}>
          Isi detail tugas barumu
        </p>
      </div>

      {/* Form */}
      <div className="px-5 flex-1 flex flex-col gap-5">
        {/* Title */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide mb-2 block" style={{ color: 'var(--tg-text-secondary)' }}>
            Judul *
          </label>
          <input
            className="tg-input"
            placeholder="Apa yang perlu dikerjakan?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide mb-2 block" style={{ color: 'var(--tg-text-secondary)' }}>
            Deskripsi
          </label>
          <textarea
            className="tg-input"
            style={{ minHeight: 80, resize: 'none' }}
            placeholder="Detail tambahan (opsional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Priority */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide mb-2 block" style={{ color: 'var(--tg-text-secondary)' }}>
            Prioritas
          </label>
          <div className="flex gap-2">
            {([['low', 'Rendah', '🟢'], ['medium', 'Sedang', '🟡'], ['high', 'Tinggi', '🔴']] as [Priority, string, string][]).map(
              ([p, label, dot]) => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-1.5"
                  style={{
                    background: priority === p ? 'var(--tg-primary)' : 'var(--tg-surface)',
                    color: priority === p ? '#FFFFFF' : 'var(--tg-text-secondary)',
                    border: priority === p ? '2px solid var(--tg-primary)' : '1px solid var(--tg-border)',
                  }}
                >
                  <span className="text-xs">{dot}</span>
                  {label}
                </button>
              ),
            )}
          </div>
        </div>

        {/* Due date */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide mb-2 block" style={{ color: 'var(--tg-text-secondary)' }}>
            Tenggat
          </label>
          <input
            type="date"
            className="tg-input"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
      </div>

      {/* Submit */}
      <div className="px-5 py-6">
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="tg-btn-primary w-full transition-opacity"
          style={{ opacity: canSubmit ? 1 : 0.5 }}
        >
          Simpan Tugas
        </button>
      </div>
    </div>
  )
}
