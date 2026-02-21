import type { ImageStyle, TextStyle, ViewStyle } from 'react-native'
import { useTheme } from './themeStore'
import { Theme } from './types'

export type Style = ViewStyle | TextStyle | ImageStyle

export type StringToBoolean<T> = T extends 'true' | 'false' ? boolean : T

type StyleOrThemeFn<T extends Style = Style> = T | ((theme: Theme) => T)

type ThemedVariantShape = Record<string, Record<string, StyleOrThemeFn>>

type ThemedCompoundVariant<V extends ThemedVariantShape> = {
  [Variant in keyof V]?: StringToBoolean<keyof V[Variant]> | undefined
} & {
  style: StyleOrThemeFn
}

export type ThemedConfig<K extends Style, V extends ThemedVariantShape = ThemedVariantShape> = {
  base?: StyleOrThemeFn<K>
  variants?: V
  defaultVariants?: { [Variant in keyof V]?: StringToBoolean<keyof V[Variant]> }
  compoundVariants?: Array<ThemedCompoundVariant<V>>
}

type ThemedProps<V> = V extends ThemedVariantShape
  ? { [Variant in keyof V]?: StringToBoolean<keyof V[Variant]> } & { style?: Style }
  : never

/**
 * Resolves a style value that may be a function of theme.
 */
const resolveStyle = <T extends Style>(value: StyleOrThemeFn<T>, theme: Theme): T => {
  return typeof value === 'function' ? value(theme) : value
}

/**
 * Theme-aware variant utility.
 * Like `sv` but variant values can be functions receiving the theme.
 *
 * @example
 * const buttonVariants = themedVariants({
 *   base: (theme) => ({ borderRadius: theme.tokens.borderRadius.md }),
 *   variants: {
 *     size: {
 *       sm: (theme) => ({ padding: theme.tokens.spacing.sm }),
 *       md: (theme) => ({ padding: theme.tokens.spacing.md }),
 *     },
 *     variant: {
 *       primary: (theme) => ({ backgroundColor: theme.colors.primary }),
 *     },
 *   },
 *   defaultVariants: { size: 'md', variant: 'primary' },
 * })
 */
export const themedVariants = <K extends Style, V extends ThemedVariantShape = ThemedVariantShape>({
  base,
  defaultVariants,
  variants,
  compoundVariants = [],
}: ThemedConfig<K, V>) =>
  (theme: Theme, _options?: ThemedProps<V>): K => {
    const styles: K = Object.assign({})
    const options = _options || ({} as ThemedProps<V>)

    // Apply base styles
    if (base) {
      Object.assign(styles, resolveStyle(base, theme))
    }

    // Apply default variants
    if (defaultVariants) {
      Object.keys(defaultVariants).forEach((key) => {
        if (!options.hasOwnProperty(key) || options[key] === undefined) {
          Object.assign(options, { [key]: defaultVariants[key] })
        }
      })
    }

    // Apply selected variants 
    Object.entries(options || {}).forEach(([category, variantSelected]) => {
      if (variants?.hasOwnProperty(category)) {
        const categoryVariants = variants[category]
        if (categoryVariants?.hasOwnProperty(String(variantSelected))) {
          Object.assign(styles, resolveStyle(categoryVariants[String(variantSelected)], theme))
        }
      }
    })

    // Apply compound variants
    compoundVariants.forEach((compound) => {
      const { style, ...compoundVariantOptions } = compound
      if (
        Object.entries(compoundVariantOptions).every(
          ([key, value]) => options[key] === value
        )
      ) {
        Object.assign(styles, resolveStyle(style, theme))
      }
    })

    // Apply inline style override
    if (options.hasOwnProperty('style')) {
      Object.assign(styles, options.style)
    }

    return styles
  }

/**
 * Hook for using themed variants in components.
 * Automatically provides theme context.
 *
 * @example
 * const style = useVariants(buttonVariants, { size: 'sm', variant: 'primary' })
 */
export function useVariants<K extends Style, V extends ThemedVariantShape>(
  variantFn: (theme: Theme, options?: ThemedProps<V>) => K,
  options?: ThemedProps<V>
): K {
  const { theme } = useTheme()
  return variantFn(theme, options)
}
