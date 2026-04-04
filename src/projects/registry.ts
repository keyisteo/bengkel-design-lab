import type { ComponentType } from 'react'
import type { Scenario, ProjectBrand, ProjectAppProps } from '../types'
import { TugasApp } from './tugas'
import tugasPersonaIndex from './tugas/personas/_index.json'
import budiSantoso from './tugas/personas/budi-santoso.json'

interface PersonaCommon {
  id: string
  name: string
  age: number
  role: string
  location: string
  archetype: string
  avatar: string
  quotes: string[]
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
  trustSignals?: {
    mustHave: string[]
    killsIt: string[]
  }
}

export interface ProjectConfig {
  id: string
  brand: ProjectBrand
  component: ComponentType<ProjectAppProps>
  scenarios: Scenario[]
  personaIndex: { _meta: { purpose: string }; personas: Array<{
    id: string
    name: string
    age: number
    role: string
    location: string
    archetype: string
    latestScore: { score: number | null; screen: string | null }
  }> }
  personaFiles: Record<string, PersonaCommon>
}

const TUGAS_PERSONA_FILES: Record<string, PersonaCommon> = {
  'budi-santoso': budiSantoso as unknown as PersonaCommon,
}

export const TUGAS_CONFIG: ProjectConfig = {
  id: 'tugas',
  component: TugasApp,
  brand: {
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
  },
  scenarios: [
    {
      id: 'tugas-happy-path',
      label: 'Happy Path',
      description: 'Home → Add Task → Home → Detail',
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
      steps: [
        { screen: 'tugas-home', label: 'Home' },
        { screen: 'tugas-stats', label: 'Stats' },
        { screen: 'tugas-detail', label: 'Detail' },
      ],
    },
  ],
  personaIndex: tugasPersonaIndex as ProjectConfig['personaIndex'],
  personaFiles: TUGAS_PERSONA_FILES,
}

export const PROJECT_CONFIGS: Record<string, ProjectConfig> = {
  tugas: TUGAS_CONFIG,
}
