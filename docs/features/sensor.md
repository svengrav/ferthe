# Sensor and Clue

## Sensor (Scanner)

- The scanner detects nearby undiscovered spots within the trail's scan radius.
- When a scan is triggered, clues are generated for all spots within range.
- Scanning is triggered manually by the user.
- A cooldown period prevents abuse.

## Clue

- A Clue is a hint marker placed on the map showing the approximate location of an undiscovered spot.
- Clues display a blurred micro thumbnail of the spot image (if available).
- The discovery radius is visualized as a circle around the clue position.
- Clues appear when the trail's preview mode is set to `preview`.

### Clue Sources

- `preview`: Generated from the spot's own location for spots with `visibility: preview`.
- `scanEvent`: Generated dynamically when a scan detects a nearby spot.

### Clue Properties

- Location (exact spot position)
- Discovery radius
- Trail ID
- Source type

## Future

- Scan history visible on the map (last ~10 scan positions).
- Clue offset: clue appears near but not at the exact spot location to encourage exploration.
