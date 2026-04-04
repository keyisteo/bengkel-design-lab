import type { Task } from '../data/tasks'

interface StatsPageProps {
  tasks: Task[]
  onBack: () => void
  onNavigate: (screen: string) => void
}

export function StatsPage({ tasks, onBack, onNavigate }: StatsPageProps) {
  const completed = tasks.filter((t) => t.completed).length
  const active = tasks.filter((t) => !t.completed).length
  const total = tasks.length

  const highCount = tasks.filter((t) => t.priority === 'high').length
  const mediumCount = tasks.filter((t) => t.priority === 'medium').length
  const lowCount = tasks.filter((t) => t.priority === 'low').length

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

  const today = new Date().toISOString().split('T')[0]
  const overdue = tasks.filter((t) => t.dueDate < today && !t.completed).length

  // Simple streak: count consecutive completed tasks from most recently created
  const sortedByCreated = [...tasks].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  let streak = 0
  for (const t of sortedByCreated) {
    if (t.completed) streak++
    else break
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
          Statistik
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--tg-text-secondary)' }}>
          Ringkasan progress tugasmu
        </p>
      </div>

      <div className="px-5 flex-1 overflow-y-auto pb-4">
        {/* Completion overview */}
        <div className="tg-card p-5 mb-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--tg-muted)' }}>
            Overview
          </p>
          <div className="flex items-end justify-between mb-4">
            <div>
              <p className="text-4xl font-bold" style={{ color: 'var(--tg-primary)' }}>
                {completionRate}%
              </p>
              <p className="text-sm" style={{ color: 'var(--tg-text-secondary)' }}>
                Completion rate
              </p>
            </div>
            {streak > 0 && (
              <div className="text-right">
                <p className="text-2xl font-bold" style={{ color: 'var(--tg-success)' }}>
                  🔥 {streak}
                </p>
                <p className="text-sm" style={{ color: 'var(--tg-text-secondary)' }}>
                  Streak
                </p>
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: 'var(--tg-border)' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${completionRate}%`,
                background: 'var(--tg-primary)',
              }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs" style={{ color: 'var(--tg-success)' }}>
              {completed} selesai
            </span>
            <span className="text-xs" style={{ color: 'var(--tg-text-secondary)' }}>
              {active} aktif
            </span>
          </div>
        </div>

        {/* Quick stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="tg-card p-4 text-center">
            <p className="text-3xl font-bold mb-1" style={{ color: 'var(--tg-text)' }}>{total}</p>
            <p className="text-xs" style={{ color: 'var(--tg-text-secondary)' }}>Total Tugas</p>
          </div>
          <div className="tg-card p-4 text-center">
            <p className="text-3xl font-bold mb-1" style={{ color: overdue > 0 ? 'var(--tg-danger)' : 'var(--tg-success)' }}>
              {overdue}
            </p>
            <p className="text-xs" style={{ color: 'var(--tg-text-secondary)' }}>Terlambat</p>
          </div>
        </div>

        {/* Priority breakdown */}
        <div className="tg-card p-5">
          <p className="text-[10px] font-semibold uppercase tracking-wide mb-4" style={{ color: 'var(--tg-muted)' }}>
            Berdasarkan Prioritas
          </p>
          <div className="flex flex-col gap-3">
            {[
              { label: 'Tinggi', count: highCount, color: 'var(--tg-danger)', bg: 'var(--tg-danger-light)', emoji: '🔴' },
              { label: 'Sedang', count: mediumCount, color: 'var(--tg-warning)', bg: 'var(--tg-warning-light)', emoji: '🟡' },
              { label: 'Rendah', count: lowCount, color: 'var(--tg-primary)', bg: 'var(--tg-primary-light)', emoji: '🟢' },
            ].map(({ label, count, color, bg, emoji }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="text-sm">{emoji}</span>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium" style={{ color: 'var(--tg-text)' }}>{label}</span>
                    <span className="text-sm font-semibold" style={{ color }}>{count}</span>
                  </div>
                  <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: bg }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: total > 0 ? `${(count / total) * 100}%` : '0%',
                        background: color,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom nav */}
      <div
        className="sticky bottom-0 flex border-t"
        style={{ background: 'var(--tg-surface)', borderColor: 'var(--tg-border)' }}
      >
        <button
          className="flex-1 flex flex-col items-center py-3 gap-1 text-xs font-medium"
          style={{ color: 'var(--tg-muted)' }}
          onClick={() => onNavigate('tugas-home')}
        >
          <span className="text-lg leading-none">📋</span>
          Tugas
        </button>
        <button
          className="flex-1 flex flex-col items-center py-3 gap-1 text-xs font-medium"
          style={{ color: 'var(--tg-primary)' }}
        >
          <span className="text-lg leading-none">📊</span>
          Statistik
        </button>
      </div>
    </div>
  )
}
