# Spot

## Definition

- A Spot is a location with discovery potential.
- A spot can belong to one or more trails.

## Properties

- Name, description, photos
- Location (lat/lng)
- Discovery radius (meters) — zone in which the spot can be discovered
- Clue radius (meters) — zone in which a clue becomes visible
- Rarity: common, rare, epic, legendary
- Visibility: private, hidden, preview, public

## Types

- Point of interest (default)
- Segment (e.g. a climb or descent)
- Area (e.g. a viewpoint)

## Visibility Modes

- **Private**: Only visible to the creator. Used for personal bookmarks.
- **Hidden** (default): Not visible on the map until discovered.
- **Preview**: A clue is shown on the map. The spot is revealed upon reaching the clue zone.
- **Public**: Visible on the map for everyone without prior discovery.
  A discovery is still recorded on first visit.

Visibility is set per spot, independently of the trail.

## Discovery Mechanics

- Hidden spots are detected via scanner based on scan radius and current location.
- Once discovered, a spot can optionally be shared with the community.
- Discovered spots become visible on the map for other users.

## Images

- Each spot can have a cover image.
- In preview mode, the image is shown in blurred/low-res form.
- Full resolution is revealed upon discovery.

## Create Spots

- Users can create spots by providing name, description, location, and other properties.
- Created spots are currently submitted directly without a review step.

## Report Spots

- Users can report a spot if it appears unsafe or illegitimate.
- Reported spots are hidden until reviewed by the team.

## Future

- Push notification when someone discovers a spot you created.
- Clue offset: the clue appears near but not at the exact spot location.
- One-time secret attached to a spot (e.g. a discount code).
- Time-based spots: only discoverable within specific time windows (events, seasons).
- Destroying a spot via community votes if it is deemed unsafe or fake.
