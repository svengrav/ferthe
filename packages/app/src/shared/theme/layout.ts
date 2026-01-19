import { DESIGN_TOKENS } from './theme'
import { LayoutTheme, ThemeBase } from './types'

export const createLayoutTheme = (theme: ThemeBase): LayoutTheme => ({
  header: {
    fontSize: DESIGN_TOKENS.textSize.lg,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    textAlign: 'center' as const,
    color: theme.colors.onBackground,
    paddingHorizontal: DESIGN_TOKENS.spacing.md,
    paddingVertical: DESIGN_TOKENS.spacing.sm,
    marginBottom: DESIGN_TOKENS.spacing.sm,
    paddingTop: 8,
  },

  title: {
    fontSize: DESIGN_TOKENS.textSize.xl,
    paddingVertical: DESIGN_TOKENS.spacing.md,
    fontFamily: theme.text.primary.semiBold,
    color: theme.colors.onBackground,
  },

  section: {
    fontSize: DESIGN_TOKENS.textSize.md,
    paddingVertical: DESIGN_TOKENS.spacing.sm,
    fontFamily: theme.text.primary.regular,
    color: theme.colors.onBackground,
  },

  textBase: {
    fontSize: DESIGN_TOKENS.textSize.sm,
    color: theme.colors.onSurface,
    fontFamily: theme.text.primary.regular,
  },

  hint: {
    fontSize: DESIGN_TOKENS.textSize.xs,
    color: theme.deriveColor(theme.colors.onSurface, 0.2),
    textAlign: 'center',
  },

  subtitle: {
    fontSize: DESIGN_TOKENS.textSize.md,
    fontFamily: theme.text.primary.regular,
    color: theme.colors.onSurface,
  },
})
