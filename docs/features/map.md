# Map

## Overview

The map is the primary navigation surface. It renders the user's position, trail context, spots, clues, and directional hints.

## Elements

- **Device marker**: Current location and heading.
- **Spots**: Rendered according to their visibility mode (private, hidden, preview, public).
- **Clues**: Shown for undiscovered spots within range (when trail preview mode is active).
- **Snaps**: Short directional lines from the device to the nearest spot when within snap radius.
- **Trail path**: Optional path connecting trail spots in sequence.

## Spot Visibility on Map

| Visibility | Behavior |
|---|---|
| Private | Visible only to creator |
| Hidden | Not shown until discovered |
| Preview | Clue shown; spot revealed on arrival |
| Public | Always visible; discovery recorded on first visit |

## Map Modes

- **Overview**: Shows the full trail area with an optional custom background image.
- **Navigation**: Active exploration view, optionally with a different background image.
- Users can switch between modes.

## Custom Map Background

- Each trail can define its own background image for both overview and navigation modes.
- Enables thematic maps (e.g. illustrated or fantasy-style maps).

## Future

- Show a preview of the trail boundary and direction to the nearest spot when the user is outside the trail area.
- Display the last ~10 scan positions on the map.
- Show community members' shared discoveries as markers.
- Range filter: only render spots and clues within a configurable distance.
- Lazy loading: limit the number of visible spots and load more on demand.
