export type Screen = string

export type ScenarioId = string

export interface Scenario {
  id: string
  label: string
  description: string
  steps: { screen: Screen; label: string }[]
  views?: ('mobile' | 'web')[]   // defaults to ['mobile'] if absent
}

export interface Annotation {
  id: number
  x: number              // px from left of mockup container
  y: number              // px from top of mockup container
  elementLabel: string   // tag + first meaningful class (e.g. "button.bg-indigo-600")
  elementClasses: string // full space-separated class list for copy output
  comment: string
  screen: string
  view: 'mobile' | 'web'
}

export interface AnnotationSession {
  projectId: string
  savedAt: string          // ISO 8601 timestamp
  annotations: Annotation[]
}

export interface Decision {
  id: string
  date: string
  decision: string
  rationale: string
  status: 'active' | 'scrapped'
  scrappedBy?: string
  scrappedReason?: string
  feedbackIds?: string[]
}

export interface PersonaFeedback {
  personaId: string
  personaName: string
  personaRole: string
  date: string
  score: number
  scoreReason: string
  likes: string[]
  missing: string[]
  wouldTheyProceed: string
  topChange: string
}

export interface ScreenDoc {
  step: number
  name: string
  goal: string
  description: string
  designNotes: string[]
  components: string[]
  tokens: { name: string; value: string }[]
  decisions: Decision[]
  personaFeedbacks: PersonaFeedback[]
}

export interface ProjectBrand {
  id: string
  name: string
  tagline: string
  logoChar: string
  accentColor: string
  accentLight: string
  accentMuted: string
  bgSubtle: string
  textPrimary: string
  textSecondary: string
  textMuted: string
  bgSubtleAlt: string
}

export interface LabPersona {
  id: string
  name: string
  age: number
  location: string
  archetype: string
  role: string
  avatar: string
  quotes: string[]
  trustSignals?: { mustHave: string[]; killsIt: string[] }
  bookingBehaviour: {
    decisionTiming: string
    dropOffTrigger: string
    bookingStyle: string
    priceRange: string
  }
  feedbackHistory: Array<{
    screen: string
    date: string
    score: number
    scoreReason: string
    firstImpression: string
    likes: string[]
    missing: string[]
    wouldTheyProceed: string
    topChange: string
    view?: 'mobile' | 'web'   // absent = applies to both / legacy entry
  }>
}

export interface ProjectAppProps {
  screen?: Screen
  onScreenChange?: (screen: Screen) => void
  view?: 'mobile' | 'web'
}
