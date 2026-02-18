# Architecture

## App

Screen
  -- Page
    - Component

- Screens are the main entry point for features. They are also represented in the nav bar. 
- Pages are the main entry point for components. They are not represented in the nav bar, but can be used within screens or other pages. They always work as overlays, meaning they are rendered on top of the current screen and can be closed to return to the previous screen.
- Components are the main entry point for UI elements. They can be used within screens, pages, or other components. They are reusable and can be composed together to create more complex UI elements.


### Features
The app is organized into features, which are self-contained modules that encapsulate a specific functionality or domain. Each feature has its own folder structure and can contain screens, pages, components, and stores related to that feature.
- Sometimes it is neccessary to use components or pages from other features. In this case, it is recommended to create a new component or page within the current feature that wraps the component or page from the other feature. This allows for better separation of concerns and makes it easier to manage the dependencies between features.
- Features should expose a public API that other features can use to interact with it. This can include functions to open and close pages, as well as any other functions that are necessary for other features to interact with it.
- Try to avoid to directly use components or pages from other features, as this can create tight coupling between features and make it harder to manage the dependencies between them. Instead, use the public API of the feature to interact with it.

### Screen

### Pages

- Pages should export an function to open and close the page. This function should be used to open and close the page, instead of directly rendering the page component. This allows for better control over the page's lifecycle and animations.
- They directly use stores. They should not receive props from their parent components, but instead should use the stores to get the data they need. This allows for better separation of concerns and makes it easier to manage the state of the page. 
  - Use Id over complex objects. For example, instead of passing a whole discovery card object to the page, pass the discovery card's id and let the page fetch the data it needs from the store. This makes it easier to manage the state of the page and reduces the amount of data being passed around.

### Components 
- Components should receive props from their parent components. Try to avoid using stores, but instead should receive the data they need as props. This allows for better separation of concerns and makes it easier to manage the state of the component.
- They should be reusable and composable.
- They usually work with callback functions as props to communicate with their parent components.

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
- Avoid using stores of an other feature. Always ask the specific feature appliaction for the data you need. 