export interface Task {
  id: string
  title: string
  priority: 'low' | 'medium' | 'high'
  dueDate: string
  completed: boolean
  createdAt: string
  description?: string
}

export const TASKS: Task[] = [
  {
    id: 't1',
    title: 'Beli bahan masak malam ini',
    priority: 'high',
    dueDate: '2026-04-04',
    completed: false,
    createdAt: '2026-04-03',
    description: 'Ayam, bawang merah, cabai, santan. Masak rendang buat weekend.',
  },
  {
    id: 't2',
    title: 'Review PR tim backend',
    priority: 'medium',
    dueDate: '2026-04-05',
    completed: false,
    createdAt: '2026-04-03',
    description: 'PR #142 — endpoint baru untuk notifikasi. Cek validasi input.',
  },
  {
    id: 't3',
    title: 'Bayar tagihan listrik',
    priority: 'high',
    dueDate: '2026-04-04',
    completed: true,
    createdAt: '2026-04-01',
    description: 'Lewat app PLN Mobile. Jatuh tempo tanggal 5.',
  },
  {
    id: 't4',
    title: 'Baca artikel tentang React Server Components',
    priority: 'low',
    dueDate: '2026-04-10',
    completed: false,
    createdAt: '2026-04-02',
    description: 'Bookmark dari Twitter kemarin. Coba pahami streaming SSR.',
  },
  {
    id: 't5',
    title: 'Olahraga pagi — lari 5km',
    priority: 'medium',
    dueDate: '2026-04-05',
    completed: false,
    createdAt: '2026-04-03',
  },
  {
    id: 't6',
    title: 'Kirim laporan mingguan ke lead',
    priority: 'high',
    dueDate: '2026-04-04',
    completed: true,
    createdAt: '2026-04-01',
    description: 'Rangkum progress sprint ini. Sertakan blocker dan next steps.',
  },
]
