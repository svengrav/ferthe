import { StumbleSuggestion } from '@shared/contracts/stumble.ts'
import { createStore, Store } from '@core/store/storeFactory.ts'
import { StoreInterface } from '@core/store/storeInterface.ts'
import { STORE_IDS } from '@core/config/index.ts'

export type StumbleStore = Store<StumbleSuggestion>

export function createStumbleStore(connector: StoreInterface): StumbleStore {
  return createStore<StumbleSuggestion>(connector, STORE_IDS.STUMBLE_POIS)
}
