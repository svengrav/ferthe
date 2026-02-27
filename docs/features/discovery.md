# Discovery

## Definition

- A Discovery represents a user's personal finding of a spot.
- A Discovery cannot exist without a Spot.
- A Spot can exist without any Discovery (e.g. no one has found it yet).
- Discovery extends the spot with user-specific data: timestamp, content, share status.

## Core Mechanics

- A discovery is created when a user reaches a spot for the first time.
- Discoveries are private by default.
- A discovery can be shared with a community within 24 hours of creation.
- Users can delete a discovery (e.g. if it was created by mistake).

## Profile Persistence

- The app remembers the last active trail.
- On reopen, the user resumes where they left off.
- Profile syncs across devices when using phone authentication.

## Stats

Each discovery shows:

- Rank among all discoverers of that spot (e.g. 5th out of 100)
- Position within the trail (spots discovered / total spots)
- Time elapsed since the previous discovery
- Distance traveled since the previous discovery
- Number of scans between discoveries

## Content (User-Generated)

- Users can attach one photo and one comment to a discovery.
- Content is uploaded and stored with the discovery.
- Content is visible to community members when the discovery is shared.

## Reactions

- Users can rate discovered spots from 1 to 5 stars.
- Aggregate rating (average + count) is shown per spot.
- Ratings help surface popular and high-quality spots.

## Future

- Push notification when someone discovers a spot you created.
- Push notification when someone shares a discovery in a community you are part of.
