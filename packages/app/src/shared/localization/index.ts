import { useLocalizationStore } from './useLocalizationStore'

export const useLocalization = () => {
  const { locales, setLocalization, language } = useLocalizationStore()
  return { locales, setLocalization, language }
}