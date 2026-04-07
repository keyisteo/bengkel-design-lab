/**
 * Seed script: reads existing TS constants, JSON files, and screenDocs
 * then populates the SQLite database.
 *
 * Run: npx tsx scripts/seed-db.ts
 */
import fs from 'fs'
import path from 'path'
import { createRequire } from 'module'

const ROOT = process.cwd()
const require = createRequire(path.join(ROOT, 'package.json'))
const Database = require('better-sqlite3')

const DB_PATH = path.join(ROOT, 'designlab.db')
const PROJECTS_DIR = path.join(ROOT, 'src/projects')

// ── Open DB and init schema ────────────────────────────
const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    brand JSON NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS scenarios (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    views JSON NOT NULL DEFAULT '["mobile"]',
    steps JSON NOT NULL DEFAULT '[]',
    sort_order INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS personas (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    data JSON NOT NULL
  );
  CREATE TABLE IF NOT EXISTS persona_index (
    persona_id TEXT PRIMARY KEY REFERENCES personas(id) ON DELETE CASCADE,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    age INTEGER,
    role TEXT,
    location TEXT,
    archetype TEXT,
    latest_score INTEGER,
    latest_screen TEXT
  );
  CREATE TABLE IF NOT EXISTS screen_docs (
    screen_id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    doc JSON NOT NULL
  );
  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    persona_id TEXT NOT NULL,
    persona_type TEXT NOT NULL DEFAULT 'user',
    screen TEXT NOT NULL,
    view TEXT NOT NULL DEFAULT 'mobile',
    result JSON NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS annotation_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id TEXT NOT NULL,
    saved_at TEXT NOT NULL,
    name TEXT NOT NULL DEFAULT '',
    annotations TEXT NOT NULL
  );
`)

// ── Prepared statements ────────────────────────────────
const upsertProject = db.prepare(`
  INSERT INTO projects (id, name, brand) VALUES (?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET name = excluded.name, brand = excluded.brand, updated_at = datetime('now')
`)
const upsertScenario = db.prepare(`
  INSERT INTO scenarios (id, project_id, label, description, views, steps, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET label = excluded.label, description = excluded.description,
    views = excluded.views, steps = excluded.steps, sort_order = excluded.sort_order
`)
const upsertPersona = db.prepare(`
  INSERT INTO personas (id, project_id, data) VALUES (?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET data = excluded.data
`)
const upsertPersonaIndex = db.prepare(`
  INSERT INTO persona_index (persona_id, project_id, name, age, role, location, archetype, latest_score, latest_screen)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(persona_id) DO UPDATE SET name = excluded.name, age = excluded.age,
    role = excluded.role, location = excluded.location, archetype = excluded.archetype,
    latest_score = excluded.latest_score, latest_screen = excluded.latest_screen
`)
const upsertScreenDoc = db.prepare(`
  INSERT INTO screen_docs (screen_id, project_id, doc) VALUES (?, ?, ?)
  ON CONFLICT(screen_id) DO UPDATE SET doc = excluded.doc
`)

// ── Migrate annotation sessions from old DB ────────────
const OLD_DB_PATH = path.join(ROOT, 'annotations.db')
if (fs.existsSync(OLD_DB_PATH)) {
  const oldDb = new Database(OLD_DB_PATH)
  const existing = db.prepare('SELECT COUNT(*) as cnt FROM annotation_sessions').get() as { cnt: number }
  if (existing.cnt === 0) {
    try {
      const rows = oldDb.prepare('SELECT project_id, saved_at, annotations FROM annotation_sessions ORDER BY saved_at').all() as Array<{
        project_id: string; saved_at: string; annotations: string
      }>
      const insert = db.prepare('INSERT INTO annotation_sessions (project_id, saved_at, annotations) VALUES (?, ?, ?)')
      const migrate = db.transaction(() => {
        for (const row of rows) {
          insert.run(row.project_id, row.saved_at, row.annotations)
        }
      })
      migrate()
      console.log(`  Migrated ${rows.length} annotation sessions from annotations.db`)
    } catch {
      console.log('  No annotation sessions to migrate (table may not exist)')
    }
  }
  oldDb.close()
}

// ── Seed from registry.ts (tugas — the only registered project) ──
console.log('\n=== Seeding from registry (tugas) ===')

// We can't import TS directly, so we read the data from JSON/TS sources
// Tugas brand (hardcoded from registry.ts)
const tugasBrand = {
  id: 'tugas',
  name: 'Tugas',
  tagline: 'Simple Task Manager',
  logoChar: 'T',
  accentColor: '#4F46E5',
  accentLight: '#EEF2FF',
  accentMuted: '#94A3B8',
  bgSubtle: '#F8FAFC',
  bgSubtleAlt: '#F1F5F9',
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
}

const tugasScenarios = [
  {
    id: 'tugas-happy-path',
    label: 'Happy Path',
    description: 'Home → Add Task → Detail',
    views: ['mobile'],
    steps: [
      { screen: 'tugas-home', label: 'Home' },
      { screen: 'tugas-add', label: 'Tambah' },
      { screen: 'tugas-detail', label: 'Detail' },
    ],
  },
  {
    id: 'tugas-weekly-review',
    label: 'Weekly Review',
    description: 'Home → Stats → Detail',
    views: ['mobile', 'web'],
    steps: [
      { screen: 'tugas-home', label: 'Home' },
      { screen: 'tugas-stats', label: 'Stats' },
      { screen: 'tugas-detail', label: 'Detail' },
    ],
  },
  {
    id: 'tugas-admin-audit',
    label: 'Admin Audit',
    description: 'Stats → Detail (web only)',
    views: ['web'],
    steps: [
      { screen: 'tugas-stats', label: 'Stats' },
      { screen: 'tugas-detail', label: 'Detail' },
    ],
  },
]

const seedTugas = db.transaction(() => {
  upsertProject.run('tugas', 'Tugas', JSON.stringify(tugasBrand))
  console.log('  Project: tugas')

  tugasScenarios.forEach((sc, i) => {
    upsertScenario.run(sc.id, 'tugas', sc.label, sc.description, JSON.stringify(sc.views), JSON.stringify(sc.steps), i)
  })
  console.log(`  Scenarios: ${tugasScenarios.length}`)

  // Personas from JSON files
  seedPersonasFromDir('tugas')

  // Screen docs from screenDocs.ts (hardcoded since we can't import TS)
  seedScreenDocsForTugas()
})
seedTugas()

// ── Seed unregistered projects (ketemoo, jejak-pijar) from their JSON files ──
const projectDirs = fs.readdirSync(PROJECTS_DIR).filter(d => {
  const stat = fs.statSync(path.join(PROJECTS_DIR, d))
  return stat.isDirectory() && d !== 'tugas'
})

for (const projId of projectDirs) {
  console.log(`\n=== Seeding ${projId} (from filesystem) ===`)
  // Create a placeholder project entry — brand will be derived from CSS later
  const placeholderBrand = {
    id: projId,
    name: projId.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' '),
    tagline: '',
    logoChar: projId[0].toUpperCase(),
    accentColor: '#6B7280',
    accentLight: '#F3F4F6',
    accentMuted: '#9CA3AF',
    bgSubtle: '#F9FAFB',
    bgSubtleAlt: '#F3F4F6',
    textPrimary: '#111827',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
  }

  const seed = db.transaction(() => {
    upsertProject.run(projId, placeholderBrand.name, JSON.stringify(placeholderBrand))
    console.log(`  Project: ${projId}`)
    seedPersonasFromDir(projId)
  })
  seed()
}

// ── Helper: seed personas from a project's personas/ dir ──
function seedPersonasFromDir(projectId: string) {
  const personasDir = path.join(PROJECTS_DIR, projectId, 'personas')
  if (!fs.existsSync(personasDir)) {
    console.log('  No personas/ directory')
    return
  }

  // Read index
  const indexPath = path.join(personasDir, '_index.json')
  let indexData: { personas: Array<Record<string, unknown>> } | null = null
  if (fs.existsSync(indexPath)) {
    indexData = JSON.parse(fs.readFileSync(indexPath, 'utf-8'))
  }

  // Read individual persona files
  const files = fs.readdirSync(personasDir).filter(f => f.endsWith('.json') && f !== '_index.json')
  let count = 0

  for (const file of files) {
    const personaId = file.replace('.json', '')
    const data = JSON.parse(fs.readFileSync(path.join(personasDir, file), 'utf-8'))

    upsertPersona.run(personaId, projectId, JSON.stringify(data))

    // Build index entry from the _index.json or the persona file itself
    const indexEntry = indexData?.personas.find((p: Record<string, unknown>) => p.id === personaId)
    const name = (indexEntry?.name ?? data.name ?? personaId) as string
    const age = (indexEntry?.age ?? data.age ?? data.demographics?.age ?? null) as number | null
    const role = (indexEntry?.role ?? data.role ?? data.demographics?.occupation ?? '') as string
    const location = (indexEntry?.location ?? data.location ?? data.demographics?.location ?? '') as string
    const archetype = (indexEntry?.archetype ?? data.archetype ?? '') as string
    const latestScore = indexEntry?.latestScore as { score?: number | null; screen?: string | null } | undefined
    const score = latestScore?.score ?? null
    const screen = latestScore?.screen ?? null

    upsertPersonaIndex.run(personaId, projectId, name, age, role, location, archetype, score, screen)
    count++
  }
  console.log(`  Personas: ${count}`)
}

// ── Screen docs for tugas (from the existing constant) ──
function seedScreenDocsForTugas() {
  // Inline the screen docs since we can't import TS at runtime
  const docs: Record<string, unknown> = {
    'tugas-home': {
      step: 1,
      name: 'Home',
      goal: 'Show all tasks at a glance with quick filtering and completion toggling',
      description: 'The main screen of Tugas. Users land here and immediately see their task list with color-coded priority badges and urgency labels. Filter tabs (All/Active/Done) let them focus on what matters. Inline checkbox toggles allow completing tasks without navigating away.',
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
      description: 'A simple form with three fields: title (required), description (optional), and priority (visual selector). The due date picker defaults to today. The form is intentionally minimal — get the task captured fast, refine later.',
      designNotes: [
        "Priority uses three side-by-side buttons, not a dropdown — three options don't warrant a dropdown",
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
          rationale: "Three options don't warrant a dropdown. Buttons are one tap vs two. Color + emoji makes the choice visceral.",
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
      description: 'The detail view for a single task. Shows priority, due date, description, and creation date in a clean layout. Two primary actions: toggle completion (prominent button) and delete (danger button with bottom sheet confirmation).',
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
      description: 'A simple dashboard showing completion rate, streak counter, overdue count, and priority breakdown. Designed for a weekly review workflow.',
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
          rationale: 'A single number is the most motivating metric. The progress bar adds visual weight.',
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

  let count = 0
  for (const [screenId, doc] of Object.entries(docs)) {
    upsertScreenDoc.run(screenId, 'tugas', JSON.stringify(doc))
    count++
  }
  console.log(`  Screen docs: ${count}`)
}

// ── Seed built-in internal personas (shared across all projects) ──
console.log('\n=== Seeding internal personas ===')

const internalPersonas = [
  {
    id: 'ayu-pramesti',
    type: 'internal',
    name: 'Ayu Pramesti',
    role: 'Senior UX Designer',
    avatar: 'AP',
    expertise: ['visual hierarchy', 'interaction patterns', 'information architecture', 'mobile usability'],
    reviewFocus: [
      'Is the visual hierarchy clear? Can users tell what to do first?',
      'Are interaction patterns consistent and predictable?',
      'Does the information architecture make sense for the use case?',
      'Are touch targets large enough (min 44px)?',
      'Is there unnecessary cognitive load?',
    ],
    quotes: [
      'If they have to think about where to tap, we failed.',
      'Hierarchy is kindness — guide the eye, don\'t make them hunt.',
      'Every screen should answer one question: what do I do next?',
    ],
    severityBias: 'balanced',
  },
  {
    id: 'rizal-hakim',
    type: 'internal',
    name: 'Rizal Hakim',
    role: 'Accessibility Auditor',
    avatar: 'RH',
    expertise: ['WCAG compliance', 'contrast ratios', 'touch targets', 'screen reader compatibility', 'keyboard navigation'],
    reviewFocus: [
      'Do all text/background color combinations meet WCAG AA contrast ratio (4.5:1 for normal text, 3:1 for large)?',
      'Are interactive elements at least 44x44px?',
      'Is there sufficient spacing between touch targets?',
      'Would a screen reader make sense of this layout?',
      'Are states (active, disabled, error) communicated beyond color alone?',
    ],
    quotes: [
      'Accessibility is not a feature — it\'s a baseline.',
      'If it doesn\'t pass contrast, it doesn\'t ship.',
      'Color alone is never enough. Add shape, text, or icon.',
    ],
    severityBias: 'strict',
  },
  {
    id: 'dian-kusuma',
    type: 'internal',
    name: 'Dian Kusuma',
    role: 'Product Manager',
    avatar: 'DK',
    expertise: ['user value clarity', 'conversion friction', 'scope creep', 'MVP focus', 'business metrics'],
    reviewFocus: [
      'Is the core value proposition immediately clear?',
      'How many steps to the primary action? Can we reduce?',
      'Is there anything here that isn\'t MVP — scope creep?',
      'Would a new user understand what this app does in 5 seconds?',
      'Are we measuring what matters? Where would we put analytics?',
    ],
    quotes: [
      'If it takes more than 3 taps, we\'re losing people.',
      'Ship the smallest thing that delivers value.',
      'Nice-to-have is a polite way of saying not-needed-yet.',
    ],
    severityBias: 'lenient',
  },
]

const seedInternal = db.transaction(() => {
  // Internal personas are stored as a special "_internal" project
  upsertProject.run('_internal', 'Internal Team', JSON.stringify({
    id: '_internal',
    name: 'Internal Team',
    tagline: 'Product team review personas',
    logoChar: 'I',
    accentColor: '#6366F1',
    accentLight: '#EEF2FF',
    accentMuted: '#A5B4FC',
    bgSubtle: '#F8FAFC',
    bgSubtleAlt: '#F1F5F9',
    textPrimary: '#1E293B',
    textSecondary: '#64748B',
    textMuted: '#94A3B8',
  }))

  for (const p of internalPersonas) {
    upsertPersona.run(p.id, '_internal', JSON.stringify(p))
    upsertPersonaIndex.run(p.id, '_internal', p.name, null, p.role, '', p.expertise[0], null, null)
  }
  console.log(`  Internal personas: ${internalPersonas.length}`)
})
seedInternal()

db.close()
console.log(`\nDone! Database written to ${DB_PATH}`)
