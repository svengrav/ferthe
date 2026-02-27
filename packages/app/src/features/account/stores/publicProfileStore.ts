import { getAppContextStore } from '@app/shared/stores/appContextStore'
import { AccountPublicProfile } from '@shared/contracts'
import { useEffect } from 'react'
import { create } from 'zustand'

interface PublicProfileStore {
  byId: Record<string, AccountPublicProfile>
  setProfiles: (profiles: AccountPublicProfile[]) => void
}

const publicProfileStore = create<PublicProfileStore>(set => ({
  byId: {},
  setProfiles: profiles => set(state => ({
    byId: { ...state.byId, ...Object.fromEntries(profiles.map(p => [p.accountId, p])) }
  })),
}))

/**
 * Hook to get a public profile by accountId.
 * Fetches from API if not yet in store.
 */
export const usePublicProfile = (accountId: string | undefined): AccountPublicProfile | undefined => {
  const profile = publicProfileStore(s => accountId ? s.byId[accountId] : undefined)
  const setProfiles = publicProfileStore(s => s.setProfiles)

  useEffect(() => {
    if (!accountId || profile) return
    getAppContextStore().accountApplication.getPublicProfile(accountId)
      .then(result => { if (result.success && result.data) setProfiles([result.data]) })
  }, [accountId, profile, setProfiles])

  return profile
}

/**
 * Hook to get multiple public profiles by accountIds.
 * Fetches missing profiles from API in a single batch request.
 */
export const usePublicProfiles = (accountIds: string[]): AccountPublicProfile[] => {
  const byId = publicProfileStore(s => s.byId)
  const setProfiles = publicProfileStore(s => s.setProfiles)

  const missingIds = accountIds.filter(id => !byId[id])

  useEffect(() => {
    if (!missingIds.length) return
    // context is ignored by the API client implementation
    getAppContextStore()?.accountApplication.listPublicProfiles(missingIds)
      .then(result => { if (result?.success && result?.data) setProfiles(result.data) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missingIds.join(',')])

  return accountIds.map(id => byId[id]).filter(Boolean) as AccountPublicProfile[]
}
