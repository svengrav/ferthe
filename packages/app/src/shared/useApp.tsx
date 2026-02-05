// hooks/useAppContext.ts oder shared/hooks/useAppCore.ts
import { AppContext, getAppContext } from '@app/appContext'
import { useLocalizationStore } from '@app/shared/localization'
import { Theme, useThemeStore } from '@app/shared/theme'
import { useCallback, useMemo } from 'react'
import { LocalizationSet } from './localization/locales/locales.en'

interface AppCore<T> {
  context: AppContext
  theme: Theme

  /**
   * Provides access to the localization set.
   */
  locales: LocalizationSet
  createStyles: <S>(fn: (theme: Theme) => S) => S
  styles?: T | undefined
}

/**
 * Provides access to the app context, theme, localization, and styles.
 * Main access point for app-wide resources.
 * @param styleFn A function that takes the theme and returns styles.
 * @returns The app context, theme, localization, and styles.
 */
export function useApp<T>(styleFn?: (theme: Theme) => T): AppCore<T> {
  const theme = useThemeStore()
  const localization = useLocalizationStore()

  const baseReturn = {
    context: getAppContext(),
    theme,
    locales: localization.t,
    createStyles: useCallback(<S,>(fn: (theme: Theme) => S) => fn(theme), [theme]),
    styles: undefined
  }

  if (styleFn) {
    const styles = useMemo(() => styleFn(theme), [theme, styleFn])
    return { ...baseReturn, styles }
  }

  return baseReturn
}

