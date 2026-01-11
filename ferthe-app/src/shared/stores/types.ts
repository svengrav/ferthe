export type Status = 'loading' | 'ready' | 'uninitialized' | 'error'

export interface StoreData {
  updatedAt?: Date
  status: Status
  error?: string
}

export interface StoreActions {
  setStatus: (status: Status) => void
}
