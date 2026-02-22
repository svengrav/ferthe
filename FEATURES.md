## UX

- UX Feedback like vibrations, sounds, and visual effects are used to enhance the user experience and provide feedback on interactions. For example, when you discover a spot, you might feel a vibration and see a visual effect to celebrate the achievement.

## Welcome and Onboarding
- When you open the app for the first time, you are greeted with a welcome screen that introduces the concept of the app and its core features. This screen sets the tone for the adventure and encourages you to start exploring.
- You discover your first spot, this spot is dynamically generated based on your location and is meant to be easily discoverable to give you a quick win and show you how the discovery process works. This helps you understand the core mechanics of the app right away and motivates you to continue exploring.

## Participation and Development Engagement
- You can give feedback on the app and suggest new features or improvements. This can be done through in-app feedback forms, community forums, or social media channels.
- You can participate in beta testing new features and provide feedback to the development team.
- Update notes and developer roadmap are communicated in the app and on the website to keep you informed about upcoming features and improvements.
- The about section in the app explains the development background (small independent and open minded team) and encourages you to reach out with feedback, suggestions, or if you want to contribute to the project.
- It also shows list items with the latest blog posts, social media channels, and contact information for support and feedback.
- There is information about privacy and data usage, as well as links to the terms of service and privacy policy.

## Access and Authentication
- You can use a local account without any auth to access the app. It's stored locally then but you lose your data if you uninstall the app or switch devices. This is the default option to make it as easy as possible to get started.
- You can sync your account with auth by phone. Phone no. is not saved, it's only used for authentication and then discarded. This allows you to keep your data when switching devices or uninstalling the app.


## Spots

**Definition:**
- **Spot** = Location with discovery potential
- **Discovery** = You finding a spot
- A spot can be part of one or more trails

**Properties**
- Name, description, photos
- Location (lat/lng)
- Discovery radius (meters)
- Clue radius (meters) 
- Rarity (common, rare, epic, legendary)
- Visibility (hidden, preview, visible)
- If a spot is previewed it has a blurred image

**Interactions**
- You can report a spot if you think it's dangerous / illegitimate. Reported spots are hidden until reviewed by the team.
- You can create a new spot and submit it for review. If approved, it becomes part of the trail and discoverable by others.

**Types:**
A spot is usually a point of interest, but can also be:
- A segment (e.g. a climb or descent)
- An area (e.g. a viewpoint)

**Visibility Modes:**
- **Private**: This is a spot your create your self and it's only visible to you. You can use it to mark interesting places for yourself without sharing them.
- **Hidden** (default): Not visible on the map until discovered
- **Preview**: Shows a clue on the map that you must reach to reveal the spot
- Visibility is set per spot, independent of the trail
- **Public**: Visible on the map for everyone without discovery (e.g. for important landmarks or points of interest). You still get a discovery if you reach it for the first time, but it's visible to everyone from the start.

**Discovery Mechanics:**
- Hidden spots can be scanned based on scan radius and your location
- Once discovered, spots can be shared within the community
- Discovered spots become visible on the map for others
- Spots can have additional information: photos, descriptions, reviews

**Time-Based Spots:**
- Spots can be time-based, only discoverable during specific time windows
- Use cases: events, seasonal spots

**Future Notes:**
- Clue offset: A clue is not right on the spot but reaching the clue reveals the true spot location (encourages exploration)
- A spot can have a one time secret like a discount code
- Probably Advisory: Spots should not be placed in private areas or places that could cause safety issues. Clear guidelines and moderation are needed to ensure responsible spot placement.
- Maybe it's possible to destroy a spot if enough people don't like it (e.g. if it's in a dangerous location or if it's fake). This would require a reporting and review system.

### Create Spots
- You can create a new spot by providing its name, description, location, and other properties. This allows you to contribute to the community and share interesting locations with others.
- Not yet: Created spots are submitted for review by the team to ensure they meet the guidelines and are safe?
**Future Notes**
- User gets a push message if somebody else discovers a spot they created or if somebody shares a discovery in a community they are part of. This encourages engagement and creates a sense of community around the spots you contribute.
- Users cann add a note to a disocvered spot and decide to share it with the community or not. This allows you to share your thoughts, tips, or stories about the spot when you share it with others.

## Discovery

- Discoveries are a subpart of Spots. They represent your personal finding of a spot.
- A Discovery cant exist without a Spot, but a Spot can exist without a Discovery (e.g. if nobody found it yet or if you haven't found it yet).
- Discovery always extends the Spot data with user-specific information like timestamp, photos, comments, and whether it's shared with the community or not.

- A Discovery is a unique finding of a user at a specific spot. It is private to you until you choose to share it with the community. Discoveries are the core of the app's social features, as they represent your achievements and contributions to the community.
- You get a discovery when you find a spot for the first time
- Discoveries can be shared with the community, making the spot visible to others and contributing
- Discoveries have a timestamp and can be used to track your activity and engagement
- Discovery stats can be aggregated to show popular spots and trails. It also shows your rank among all discoverers of that spot (e.g. 5th out of 100 discoverers)

**Stats**
- Amount of scans between discoveries
- Time between discoveries
- Your rank among all discoverers of that spot (e.g. 5th out of)
- Total amount of discoveries you have
- Distance traveled between discoveries
- Time taken to discover a spot after the previous one

**Discovery Profile:**
- Automatically saves your last active trail
- When you reopen the app, you resume where you left off
- Profile syncs across devices when using phone authentication

**TODO**
- You can remove a discovery if you want to (e.g. if it was a mistake or if you want to hide it again)
- Pushup if somebody discovers a spot you created or if somebody shares a discovery in a community you are part of

### Discovery Content

**User-Generated Content:**
- You can add a photo and comment to any discovery
- Photos are uploaded and stored with the discovery
- Comments allow you to share thoughts, stories, or tips about the spot
- Each discovery can have one content entry (photo + comment)

**Reactions:**
- You can like or dislike discoveries (your own or from others in communities)
- Reaction summary shows total likes and dislikes
- Your current reaction is highlighted
- Reactions help surface popular and quality discoveries

## Trail

**Definition:**
- **Trail** = Collection of spots forming a route or thematic experience
- Trails define the discovery rules and presentation

**Properties:**
- Name, description, images
- Geographic boundary (defines map area)
- Scanner radius (how far scan reaches)
- Snap radius (when directional hints appear)
- Custom map background image (optional)
- Trail shows stats about how many spots are discovered, how many discoveries you have, and your rank among all discoverers of that trail.

**Discovery Modes:**
- **Free**: Discover spots in any order, explore freely
- **Sequence**: Spots must be discovered in specific order (linear progression)

**Visible Map:**
- **Hidden**: No clues shown, spots are completely hidden
- **Preview**: Shows clues for undiscovered spots (if spot has `visibility: 'preview'`)
- **Discovered**: Shows only discovered spots
- **Public**: Also shows all undiscovered spots as visible on the map (e.g. for a tourist trail where you want to show all points of interest)

**Trail Selection:**
- App remembers your last active trail
- You can switch between available trails
- Each trail has its own discovery progress

**Images**
- Trail Avatar Image: Represents the trail in lists and profiles
- Trail Overview Map Background: Custom image for the map when viewing the overview
- Trail Navigation Map Background: Custom image for the map when navigating the trail (optional, can be same as overview)

**TODO**
- Trail Preview shows 4-5 Spots as blurred preview images.
- Trail Completed Animation when you discover the last spot of a trail.
  

## Clue

**Definition:**
- **Clue** = Hint marker on the map showing approximate location of an undiscovered spot

**Purpose:**
- Guides you toward spots with `visibility: 'preview'`
- Shows discovery radius as circle around clue position
- Appears when trail has `previewMode: 'preview'` enabled

**Sources:**
- `preview`: Generated from spot location (for spots with visibility: 'preview')
- `scanEvent`: Generated by scanner events

**Properties:**
- Location (exact spot position)
- Discovery radius (visualized as circle)
- Trail ID
- Source type

## Sensor

- Scans are used to detect nearby undiscovered spots
- Scan radius is determined by the trail
- When a scan is performed, clues are generated for any undiscovered spots within the scan radius
- Scans can be triggered manually by the user but it has a cooldown period to prevent abuse

Feature Notes:
- Your (latest) scans are visible on the map as little points

## Map

- Map shows trails, spots, clues, discoveries, and scans
- Snaps are small directional lines from you to the next closest spot if you are close enough
- Every trail can define a own background image for the map. This can be used to create thematic maps for specific trails (e.g. fantasy map for a fantasy trail)
- You can switch between a navigation and a overview map (different images if you want so)
- Map shows your current location and heading
- Map shows other community members' discoveries as little icons (if they shared them)

## Community

### Community Discovery

- **Discovery** = Private user finding
  - Shareable within 24h after creation
  - Stays private until explicitly shared

- **Community** = Social space with trail focus
  - Has 1 trail (initially, multiple later)
  - Can only share discoveries where spot belongs to community trail
  - Stats based on shared discoveries only

- **Share** = User action to share discovery with community
  - Spot must exist in community trail
  - Discovery can be shared in 1 community initially 

## Settings

**Theme:**
- Switch between Dark and Light mode
- Theme preference is saved and applied on app restart
- System-wide theme affects all UI components

**Language:**
- Switch between English (EN) and German (DE)
- Language preference is saved
- All text, labels, and messages update immediately

**Persistence:**
- Settings are stored locally
- Synced across devices when using phone authentication

## Images

**Spot Images:**
- Each spot can have an image
- Preview mode shows blurred version until discovered
- Full resolution revealed upon discovery

**Discovery Content Images:**
- You can upload photos to your discoveries
- Images are stored and displayed in discovery cards
- Community members can see your photos when you share discoveries

**Image Types:**
- Preview URL: Blurred/low-res version
- Full URL: High-res version after discovery

## Accounts

- User Share ID (6-digit code) for sharing own account with others (e.g. to show your discoveries)
- Account data is stored locally for offline access