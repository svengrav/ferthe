# Architecture

## App

Screen
  -- Page
    - Component

- Screens are the main entry point for features. They are also represented in the nav bar. 
- Pages are a combination of components and represent a view for a feature or subfeature. They are not represented in the nav bar, but can be used within screens or other pages. They always work as overlays, meaning they are rendered on top of the current screen and can be closed to return to the previous screen.
- Components are the main entry point for UI elements. They can be used within screens, pages, or other components. They are reusable and can be composed together to create more complex UI elements.


### Features
The app is organized into features, which are self-contained modules that encapsulate a specific functionality or domain. Each feature has its own folder structure and can contain screens, pages, components, hooks, stores, and services.

**Every feature exposes a public API exclusively via its `index.ts` barrel.** All cross-feature access must go through this barrel — never by importing from internal paths like `../other-feature/stores/someStore` or `../other-feature/components/SomeComponent`.

The public API of a feature consists of two kinds of exports:

1. **Application** (`application.ts`) — async actions that mutate state or call the backend (e.g., `createSpot`, `updateSpot`). Accessed via `useLocalization().context.<featureApplication>`.
2. **Reactive hooks and getters** — exported directly from `index.ts` for reading state reactively (e.g., `useTrails`, `getDeviceLocation`). Use hooks when the consuming component needs to re-render on changes; use getters for one-time reads outside of render (e.g., in submit handlers).

```ts
// ✅ Correct — accessing another feature via its barrel
import { useTrails, getTrailSpotIds } from '@app/features/trail'
import { getDeviceLocation } from '@app/features/sensor'

// ❌ Wrong — direct import from internal feature path
import { trailStore } from '@app/features/trail/stores/trailStore'
import { getDeviceLocation } from '@app/features/sensor/stores/sensorStore'
```

- UI components from other features should not be imported directly. If a cross-feature UI element is needed, wrap it in a component within the consuming feature.
- If a hook or getter is missing from a feature's barrel, add it there — do not reach into the internals.

### Screen

### Pages

- Pages should export an function to open and close the page. This function should be used to open and close the page, instead of directly rendering the page component. This allows for better control over the page's lifecycle and animations.
- They directly use stores. They should not receive props from their parent components, but instead should use the stores to get the data they need. This allows for better separation of concerns and makes it easier to manage the state of the page. 
  - Use Id over complex objects. For example, instead of passing a whole discovery card object to the page, pass the discovery card's id and let the page fetch the data it needs from the store. This makes it easier to manage the state of the page and reduces the amount of data being passed around.

### Components 
- Components should receive props from their parent components. Try to avoid using stores, but instead should receive the data they need as props. This allows for better separation of concerns and makes it easier to manage the state of the component.
- They should be reusable and composable.
- They usually work with callback functions as props to communicate with their parent components.
- **Top-level components always expose a `style?: StyleProp<ViewStyle>` prop** so consumers can apply layout or spacing overrides without wrapping the component in an extra `View`.
- **If a component supports multiple visual appearances, use `variant?: ComponentVariant` together with `themedVariants` + `useVariants`** instead of ad-hoc inline styles or boolean flags. This keeps visual logic centralised and theme-aware.

```tsx
// ✅ Correct — define config with satisfies, derive type via VariantOf
const cardConfig = {
  variants: {
    variant: {
      primary: (t) => ({ backgroundColor: t.colors.primary }),
      elevated: (t) => ({ backgroundColor: t.colors.surface, elevation: 4 }),
      ghost: () => ({ backgroundColor: 'transparent' }),
    },
  },
  defaultVariants: { variant: 'primary' },
} satisfies ThemedConfig<ViewStyle>

const cardVariants = themedVariants<ViewStyle>(cardConfig)
type CardVariant = VariantOf<typeof cardConfig>  // 'primary' | 'elevated' | 'ghost'

interface MyCardProps {
  style?: StyleProp<ViewStyle>
  variant?: CardVariant
}

function MyCard({ style, variant = 'primary' }: MyCardProps) {
  const variantStyle = useVariants(cardVariants, { variant })
  return <View style={{ ...variantStyle, ...StyleSheet.flatten(style) }} />
}
```

## Core

### API Concept

- Feature based API 
- Trail has 1:n spots so there should be a specific Endpoint for trails/id/spots to avoid fetching all spots when fetching trails.
  - Which informations are needed here? This is the spot list based on trail view.
~~- For the same reason, there should be a specific Endpoint for trails/id/spotPreviews to avoid fetching all spot data when fetching trails.~~
- Discovery has a spotId and a trailId, so there should be a specific Endpoint for discoveries/id/ 
- Discovery includes Spot Data.

### Domain Data Ownership

**Each domain owns and transforms its own data representations:**
- **Spot Domain** manages both full (`Spot`) and reduced (`SpotPreview`) representations
- **Trail Domain** returns only spot IDs via `getTrailSpotIds()`, not spot data
- **Discovery Domain** orchestrates by fetching IDs from Trail and data from Spot, then enriching with user context

**Preview Pattern:**
- Previews (reduced data) belong to their source domain (e.g., `SpotPreview` in Spot domain)
- Consumers request previews via domain's application contract (e.g., `spotApplication.getSpotPreviewsByIds()`)
- Transformation (full → preview) happens within the owning domain, not in consumers
- This maintains encapsulation and prevents coupling to internal data structures
- Enrichment is automatic: SpotPreview includes RatingSummary (batch-loaded to avoid N+1 queries)

**Example:** When Discovery needs spot previews for a trail, it calls `trailApplication.getTrailSpotIds()` then `spotApplication.getSpotPreviewsByIds(ids)` to get spots with ratings.

### Access Control & Security

**Spot Data Access:**
- Spots contain sensitive information (exact locations, full images, descriptions)
- Direct spot access via `GET /spots/:id` is currently **blocked** for security
- Future implementation will require access rights verification:
  - **Creator**: User who created the spot (`spot.createdBy === accountId`)
  - **Admin/Moderator**: Future role-based permissions
  - **Discoverer**: User who has discovered the spot (via Discovery domain)

**Recommended Access Patterns:**
- Users should access spots through Discovery domain endpoints
- `GET /discovery/collections/spots` - returns only discovered spots with proper filtering
- `GET /discovery/collections/trails/:trailId` - returns spots in trail context with user status enrichment
- Discovery domain applies `filterSpotByUserStatus()` to enforce data visibility rules

## Rules
- **Never import from internal feature paths.** Only use a feature's `index.ts` barrel.
- **Use reactive hooks for state reads in components** (e.g., `useTrails()`); use getters for one-time reads outside render (e.g., in submit handlers).
- **Async actions go through the application layer** (`context.spotApplication.createSpot(...)`), not by calling services or stores directly.
- If a needed hook or getter is not yet exported from a feature's barrel, add it there rather than reaching into internals.

## Components API Style

- Check if a component is just "atomar ui" or is for a specific task like "share in community"
- If it has a specific task: 
  - Use an hook that handles the logic and state management for that task. 
  - Fetch API endpoint, store it, then the component just uses the hook to get the data and display it.


## Status and Boolean

- Enums are preferred over booleans for status flags, as they are more descriptive and allow for future expansion without breaking changes. For example, instead of `isDiscovered: boolean`, use `discoveryStatus: 'undiscovered' | 'discovered' | 'pending'`. 