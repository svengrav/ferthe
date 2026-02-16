export type Status = 'loading' | 'ready' | 'uninitialized' | 'error'

export interface StoreState {
  updatedAt?: Date
  error?: string
}

export interface StoreActions {
  setStatus: (status: Status) => void
}
