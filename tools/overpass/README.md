# Overpass API — Self-Hosted Instance

Avoids rate limits of the public Overpass API.

## Start

```bash
cd tools/overpass

# Default: Bavaria (Germany)
docker compose up -d

# Custom region
OVERPASS_PLANET_URL=https://download.geofabrik.de/europe/austria-latest.osm.bz2 docker compose up -d
```

Initial import takes **30–60 min** depending on region size.
Monitor with: `docker logs -f ferthe-overpass`

## Configure Core API

Set in `.env` (core package):

```env
OVERPASS_URL=http://localhost:8088/api/interpreter
```

Without this env var, the public Overpass API is used as fallback.

## Region Reference

- Bavaria: `https://download.geofabrik.de/europe/germany/bayern-latest.osm.bz2` (~600 MB)
- Austria: `https://download.geofabrik.de/europe/austria-latest.osm.bz2` (~700 MB)
- DACH: `https://download.geofabrik.de/europe/dach-latest.osm.bz2` (~3 GB)

Full list: https://download.geofabrik.de/
