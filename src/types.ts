export type Screen = string

export type ScenarioId = string

export interface Scenario {
  id: string
  label: string
  description: string
  steps: { screen: Screen; label: string }[]
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
  }>
}

export interface ProjectAppProps {
  screen?: Screen
  onScreenChange?: (screen: Screen) => void
}
