import { create } from 'zustand'
import de from './locales/locales.de'
import en, { LocalizationSet } from './locales/locales.en'

type Localization = 'de' | 'en'

export interface LocalizationStore {
  language: Localization
  t: LocalizationSet
  setLocalization: (lang: Localization) => void
}

export const useLocalizationStore = create<LocalizationStore>(set => ({
  language: 'en',
  t: en,
  setLocalization: (lang: Localization) => {
    set({ language: lang, t: lang === 'en' ? en : de })
  },
}))
