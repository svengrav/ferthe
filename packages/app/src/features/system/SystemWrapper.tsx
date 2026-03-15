import type { ReactNode } from 'react'
import { useSystemStore } from './systemStore'
import { SystemUpdatePage } from './SystemUpdatePage'

interface Props {
  children: ReactNode
}

export function SystemWrapper({ children }: Props) {
  const blockingUpdate = useSystemStore(state => state.blockingUpdate)
  const onClose = useSystemStore(state => state.blockingUpdateOnClose)

  if (blockingUpdate) {
    return <SystemUpdatePage update={blockingUpdate} onClose={onClose ?? undefined} />
  }

  return children
}
