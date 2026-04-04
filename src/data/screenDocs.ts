import type { ScreenDoc } from '../types'

export const SCREEN_DOCS: Record<string, ScreenDoc> = {
  'tugas-home': {
    step: 1,
    name: 'Home',
    goal: 'Show all tasks at a glance with quick filtering and completion toggling',
    description:
      'The main screen of Tugas. Users land here and immediately see their task list with color-coded priority badges and urgency labels. Filter tabs (All/Active/Done) let them focus on what matters. Inline checkbox toggles allow completing tasks without navigating away.',
    designNotes: [
      'Filter pills use full-radius styling for a tactile, app-like feel',
      'Priority badges are color-coded (red/yellow/indigo) for instant visual triage',
      'Due date urgency labels ("Hari ini", "Besok", "Terlambat") eliminate mental math',
      'Task cards are full-width touch targets with active:scale feedback',
      'Empty states use emoji + helpful copy to guide next action',
      'Bottom nav uses emoji icons to stay warm and approachable',
    ],
    components: ['HomePage', 'FilterTabs', 'TaskCard', 'BottomNav'],
    tokens: [
      { name: '--tg-bg', value: '#F8FAFC' },
      { name: '--tg-primary', value: '#4F46E5' },
      { name: '--tg-surface', value: '#FFFFFF' },
      { name: '--tg-text', value: '#1E293B' },
    ],
    decisions: [
      {
        id: 'home-urgency-labels',
        date: '2026-04-04',
        decision: 'Due date urgency labels on task cards (Hari ini / Besok / Terlambat)',
        rationale: 'Raw dates require mental math. Urgency labels give instant triage context. Color-coded: yellow for upcoming, red for overdue.',
        status: 'active',
        feedbackIds: ['budi-tugas-home-8'],
      },
      {
        id: 'home-inline-toggle',
        date: '2026-04-04',
        decision: 'Inline completion toggle on task cards',
        rationale: 'Completing a task is the most frequent action. It should be one tap, not two screens. The circular checkbox on the left follows iOS/Android conventions.',
        status: 'active',
      },
    ],
    personaFeedbacks: [
      {
        personaId: 'budi-santoso',
        personaName: 'Budi Santoso',
        personaRole: '24 · Junior Developer · Bandung',
        date: '2026-04-04',
        score: 8,
        scoreReason: 'Bersih, langsung keliatan task mana yang penting. Filter-nya gampang.',
        likes: [
          'Badge prioritas warna-warni — langsung keliatan mana yang urgent',
          'Filter All/Active/Done simpel tapi cukup',
          'Task count di atas — tau progress tanpa hitung manual',
        ],
        missing: [
          'Belum bisa drag-and-drop untuk reorder',
          'Nggak ada due date warning kalau sudah dekat',
        ],
        wouldTheyProceed: 'Iya, ini yang gue cari. Simpel tapi informatif.',
        topChange: 'Tambahin indikator kalau due date hari ini atau besok.',
      },
    ],
  },
  'tugas-add': {
    step: 2,
    name: 'Add Task',
    goal: 'Let users create a new task with minimal friction',
    description:
      'A simple form with three fields: title (required), description (optional), and priority (visual selector). The due date picker defaults to today. The form is intentionally minimal — get the task captured fast, refine later.',
    designNotes: [
      'Priority uses three side-by-side buttons, not a dropdown — three options don\'t warrant a dropdown',
      'Color-coded priority buttons (🟢🟡🔴) make the choice visceral',
      'Title field has autofocus for immediate typing',
      'Submit button disables when title is empty (no error messages, just opacity)',
      'Description is a textarea — optional, for when you need context',
    ],
    components: ['AddTaskPage', 'PrioritySelector', 'DatePicker'],
    tokens: [
      { name: '--tg-primary', value: '#4F46E5' },
      { name: '--tg-surface', value: '#FFFFFF' },
      { name: '--tg-border', value: '#E2E8F0' },
    ],
    decisions: [
      {
        id: 'add-visual-priority',
        date: '2026-04-04',
        decision: 'Visual priority selector (buttons) instead of dropdown',
        rationale: 'Three options don\'t warrant a dropdown. Buttons are one tap vs two. Color + emoji makes the choice visceral. Budi: "Priority selector yang visual — nggak perlu dropdown."',
        status: 'active',
        feedbackIds: ['budi-tugas-add-7'],
      },
    ],
    personaFeedbacks: [
      {
        personaId: 'budi-santoso',
        personaName: 'Budi Santoso',
        personaRole: '24 · Junior Developer · Bandung',
        date: '2026-04-04',
        score: 7,
        scoreReason: 'Form-nya cukup simpel. Tapi pengen bisa submit lebih cepat.',
        likes: [
          'Priority selector yang visual — nggak perlu dropdown',
          'Tombol submit gede dan jelas',
        ],
        missing: [
          'Shortcut keyboard untuk submit (Enter)',
          'Quick-add mode — ketik judul aja, priority default medium',
        ],
        wouldTheyProceed: 'Iya, cuma kadang pengen yang lebih cepat.',
        topChange: 'Bikin quick-add — satu field, enter, done.',
      },
    ],
  },
  'tugas-detail': {
    step: 3,
    name: 'Task Detail',
    goal: 'Show full task information with completion and deletion actions',
    description:
      'The detail view for a single task. Shows priority, due date, description, and creation date in a clean layout. Two primary actions: toggle completion (prominent button) and delete (danger button with bottom sheet confirmation). The delete flow uses a custom bottom sheet per lab conventions — no browser dialogs.',
    designNotes: [
      'Meta row uses two side-by-side cards for priority and due date — scannable at a glance',
      'Overdue dates show in red with a ⚠️ emoji for urgency',
      'Completed tasks get a green "Selesai ✓" badge and strikethrough title',
      'Delete confirmation uses position: absolute bottom sheet, not browser confirm()',
      'Bottom sheet shows the task title in the confirmation message for clarity',
    ],
    components: ['TaskDetailPage', 'BottomSheet', 'PriorityBadge'],
    tokens: [
      { name: '--tg-danger', value: '#EF4444' },
      { name: '--tg-danger-light', value: '#FEF2F2' },
      { name: '--tg-success', value: '#10B981' },
    ],
    decisions: [
      {
        id: 'detail-bottom-sheet-delete',
        date: '2026-04-04',
        decision: 'Delete confirmation via custom bottom sheet, not browser dialog',
        rationale: 'Browser dialogs break the mobile mockup illusion. A bottom sheet feels native. Shows the task title for clarity. Uses position: absolute per lab conventions.',
        status: 'active',
        feedbackIds: ['budi-tugas-detail-8'],
      },
    ],
    personaFeedbacks: [
      {
        personaId: 'budi-santoso',
        personaName: 'Budi Santoso',
        personaRole: '24 · Junior Developer · Bandung',
        date: '2026-04-04',
        score: 8,
        scoreReason: 'Detail lengkap, bisa mark done langsung. Delete ada konfirmasi — bagus.',
        likes: [
          'Toggle complete yang besar dan satisfying',
          'Delete punya konfirmasi — nggak takut salah hapus',
          'Priority dan due date keliatan jelas',
        ],
        missing: ['Belum bisa edit inline — harus ke halaman lain'],
        wouldTheyProceed: 'Iya, ini halaman yang paling sering dibuka kayaknya.',
        topChange: 'Inline edit biar nggak perlu navigasi ke form terpisah.',
      },
    ],
  },
  'tugas-stats': {
    step: 4,
    name: 'Stats',
    goal: 'Give users a motivating overview of their task completion progress',
    description:
      'A simple dashboard showing completion rate, streak counter, overdue count, and priority breakdown. Designed for a weekly review workflow — check in on Friday, see how you did, clean up overdue tasks.',
    designNotes: [
      'Completion rate uses a large percentage number + progress bar — the primary motivator',
      'Streak counter (🔥) adds gamification without being annoying',
      'Overdue count turns red when > 0 to draw attention',
      'Priority breakdown uses horizontal bar charts with color coding',
      'Bottom nav highlights Stats tab as active',
    ],
    components: ['StatsPage', 'ProgressBar', 'PriorityBreakdown', 'BottomNav'],
    tokens: [
      { name: '--tg-primary', value: '#4F46E5' },
      { name: '--tg-success', value: '#10B981' },
      { name: '--tg-danger', value: '#EF4444' },
      { name: '--tg-warning', value: '#F59E0B' },
    ],
    decisions: [
      {
        id: 'stats-completion-rate',
        date: '2026-04-04',
        decision: 'Show completion rate as large percentage with progress bar',
        rationale: 'A single number is the most motivating metric. The progress bar adds visual weight. Budi uses this for weekly review — "Bagus buat weekly review."',
        status: 'active',
        feedbackIds: ['budi-tugas-stats-7'],
      },
    ],
    personaFeedbacks: [
      {
        personaId: 'budi-santoso',
        personaName: 'Budi Santoso',
        personaRole: '24 · Junior Developer · Bandung',
        date: '2026-04-04',
        score: 7,
        scoreReason: 'Bagus buat weekly review. Tapi pengen lihat trend mingguan.',
        likes: [
          'Completed vs pending — langsung tau progress',
          'Priority breakdown bikin sadar kalau kebanyakan high',
          'Streak counter — motivating',
        ],
        missing: ['Grafik trend mingguan', 'Completion rate percentage'],
        wouldTheyProceed: 'Iya, bakal cek ini tiap Jumat sore.',
        topChange: 'Tambahin completion rate dan mini chart trend 7 hari terakhir.',
      },
    ],
  },
}
