export type Option = { label: string; onPress?: () => void }

// Design System Primitives
export type ComponentSize = 'sm' | 'md' | 'lg'
export type ComponentVariant = 'primary' | 'secondary' | 'outlined'
export type Alignment = 'left' | 'center' | 'right'

// Utility Props
export interface DisableableProps {
  disabled?: boolean
}

export interface AlignableProps {
  align?: Alignment
}
