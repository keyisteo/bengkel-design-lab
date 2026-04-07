import type { ComponentType } from 'react'
import type { ProjectAppProps } from '../types'
import { TugasApp } from './tugas'

/**
 * Component registry — maps project IDs to their React components.
 * All metadata (brand, scenarios, personas, screen docs) now comes from the SQLite API.
 * Only the component itself needs to be registered here (components can't be stored in a DB).
 */
export const PROJECT_COMPONENTS: Record<string, ComponentType<ProjectAppProps>> = {
  tugas: TugasApp,
}
