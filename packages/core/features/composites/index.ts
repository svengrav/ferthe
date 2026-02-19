/**
 * Composites – Architecture & Guidelines
 *
 * A Composite bundles calls across multiple Applications into a single
 * operation. It lives in the Application layer, not in Routes or Services.
 *
 * Structure:
 *   1. Contract   → shared/contracts/composites.ts (types + interface)
 *   2. Factory    → createXxxComposite(options): XxxCompositeContract
 *   3. Options    → only Application-Contracts as dependencies
 *   4. Wiring     → core.ts – created after all Applications
 *   5. Route      → routes.ts – under /composite/…
 *   6. API Client → apiContext.ts – implements the same Contract
 *
 * Rules:
 *   - No direct Store/DB access – only through Application-Contracts
 *   - Project data (Summary types) instead of passing full objects
 *   - Avoid duplication – reference by IDs, send objects only once
 *   - Create only if: cross-feature dependency OR saves ≥2 roundtrips
 *   - No business logic – orchestration + projection only
 */
export { createDiscoveryStateComposite, type DiscoveryStateCompositeOptions } from './discoveryStateComposite.ts'
export { createSpotAccessComposite, type SpotAccessCompositeOptions } from './spotAccessComposite.ts'

