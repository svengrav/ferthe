export type Option = { label: string; onPress?: () => void }

// Design System Primitives
export type ComponentSize = 'sm' | 'md' | 'lg'
export type ComponentVariant = 'primary' | 'secondary' | 'outlined'
export type Alignment = 'left' | 'center' | 'right'
export type Inset = 'none' | 'sm' | 'md' | 'lg'

// Utility Props
export interface DisableableProps {
  disabled?: boolean
}

export interface AlignableProps {
  align?: Alignment
}

export interface SizeableProps {
  size?: ComponentSize
}

export interface VariantableProps {
  variant?: ComponentVariant
}

export interface InsetableProps {
  inset?: Inset
}
