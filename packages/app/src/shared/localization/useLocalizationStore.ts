import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import de from './locales/locales.de'
import en, { LocalizationSet } from './locales/locales.en'

type Localization = 'de' | 'en'

export interface LocalizationStore {
  language: Localization
  locales: LocalizationSet
  setLocalization: (lang: Localization) => void
}

export const useLocalizationStore = create<LocalizationStore>()(persist(
  set => ({
    language: 'en',
    locales: en,
    setLocalization: (lang: Localization) => {
      set({ language: lang, locales: lang === 'en' ? en : de })
    },
  }),
  {
    name: 'localization-storage',
    storage: createJSONStorage(() => AsyncStorage),
  }
))
