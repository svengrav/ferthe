import { ThemedConfig, themedVariants } from '@app/shared/theme'
import { TextStyle, ViewStyle } from 'react-native'

export const buttonVariants = themedVariants<ViewStyle>({
  base: {
    flexGrow: 0,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  variants: {
    variant: {
      primary: (theme) => ({
        backgroundColor: theme.colors.primary,
      }),
      secondary: (theme) => ({
        backgroundColor: theme.colors.black,
      }),
      outlined: (theme) => ({
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: theme.colors.divider,
      }),
    },
    size: {
      sm: (theme) => ({
        padding: theme.tokens.spacing.sm,
      }),
      md: (theme) => ({
        padding: theme.tokens.spacing.lg,
      }),
      lg: (theme) => ({
        padding: theme.tokens.spacing.lg,
      }),
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: 'md',
  },
} satisfies ThemedConfig<ViewStyle>)

export const buttonTextVariants = themedVariants<TextStyle>({
  base: {
    fontSize: 14,
  },
  variants: {
    variant: {
      primary: (theme) => ({
        color: theme.colors.onPrimary,
      }),
      secondary: (theme) => ({
        color: theme.colors.onSurface,
      }),
      outlined: (theme) => ({
        color: theme.colors.primary,
      }),
    },
    size: {
      sm: (theme) => ({
        fontSize: theme.tokens.fontSize.sm,
      }),
      md: (theme) => ({
        fontSize: theme.tokens.fontSize.md,
      }),
      lg: (theme) => ({
        fontSize: theme.tokens.fontSize.md,
      }),
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: 'md',
  },
} satisfies ThemedConfig<TextStyle>)

export const buttonIconVariants = themedVariants<TextStyle>({
  base: (theme) => ({
    marginRight: theme.tokens.spacing.sm,
  }),
  variants: {
    variant: {
      primary: (theme) => ({
        color: theme.colors.onPrimary,
      }),
      secondary: (theme) => ({
        color: theme.colors.onSurface,
      }),
      outlined: (theme) => ({
        color: theme.colors.primary,
      }),
    },
  },
  defaultVariants: {
    variant: 'primary',
  },
} satisfies ThemedConfig<TextStyle>)

export const itemVariants = themedVariants<ViewStyle>({
  base: (theme) => ({
    padding: theme.tokens.spacing.md,
  }),
  variants: {
    selected: {
      true: (theme) => ({
        backgroundColor: 'transparent',
      }),
      false: {},
    },
  },
  defaultVariants: {
    selected: 'false',
  },
} satisfies ThemedConfig<ViewStyle>)

export const itemTextVariants = themedVariants<TextStyle>({
  base: (theme) => ({
    color: theme.colors.onSurface,
    fontSize: theme.tokens.fontSize.md,
  }),
  variants: {
    selected: {
      true: (theme) => ({
        color: theme.colors.primary,
        fontWeight: '600',
      }),
      false: {},
    },
  },
  defaultVariants: {
    selected: 'false',
  },
} satisfies ThemedConfig<TextStyle>)

export const itemIconVariants = themedVariants<TextStyle>({
  base: (theme) => ({
    color: theme.colors.onSurface,
    marginRight: theme.tokens.spacing.md,
  }),
  variants: {
    selected: {
      true: (theme) => ({
        color: theme.colors.primary,
      }),
      false: {},
    },
  },
  defaultVariants: {
    selected: 'false',
  },
} satisfies ThemedConfig<TextStyle>)
