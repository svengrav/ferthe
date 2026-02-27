# Trail

## Definition

- A Trail is a collection of spots forming a route or thematic experience.
- Trails define discovery rules, map presentation, and progression.

## Properties

- Name, description
- Geographic boundary (defines the map area)
- Scanner radius (how far a scan reaches)
- Snap radius (distance at which directional hints appear)
- Custom map background image (overview and/or navigation)
- Discovery stats: spots found, discovery count, rank among all trail discoverers

## Images

- **Avatar Image**: Represents the trail in lists and profiles.
- **Overview Map Background**: Shown when viewing the trail overview.
- **Navigation Map Background**: Shown during active navigation (optional, can match overview).

## Discovery Modes

- **Free**: Spots can be discovered in any order.
- **Sequence**: Spots must be discovered in a fixed order (linear progression).

## Map Visibility Modes

- **Hidden**: No clues shown; spots are completely hidden.
- **Preview**: Clues shown for undiscovered spots that have `visibility: preview`.
- **Discovered**: Only already-discovered spots are shown.
- **Public**: All spots visible regardless of discovery status (e.g. tourist trail).

## Trail Selection

- The app remembers the last active trail.
- Users can switch between available trails.
- Each trail maintains its own independent discovery progress.

## Future

- Trail Completed Animation when the last spot of a trail is discovered.
- Trail Completed Badge visible in profile and on the map.
