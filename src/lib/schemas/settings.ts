export type Theme = 'system' | 'light' | 'dark'

export interface ModelListCache {
  models: string[]
  fetchedAt: number
}

/** Single-row app settings. The API key never leaves this device except to Google. */
export interface Settings {
  id: 'app'
  onboarded: boolean
  apiKey?: string
  model?: string
  modelList?: ModelListCache
  economyMode: boolean
  theme: Theme
  dismissedAnomalies: string[]
  demoLoaded: boolean
}

export const defaultSettings = (): Settings => ({
  id: 'app',
  onboarded: false,
  economyMode: false,
  theme: 'system',
  dismissedAnomalies: [],
  demoLoaded: false,
})
