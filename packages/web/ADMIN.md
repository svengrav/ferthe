# Admin Content Board - Setup Guide

## Schnellstart

1. **Env-Variablen setzen**

Erstelle `.env` in `packages/web/`:

```bash
# Admin-Token für ContentBoard-Zugriff
ADMIN_TOKEN=your-secret-admin-token

# URL zur Core-API (optional, default: http://localhost:3000)
CORE_API_URL=http://localhost:3000

# Resend API Key für Feedback-E-Mails (optional)
RESEND_API_KEY=re_xxx
FEEDBACK_EMAIL=feedback@ferthe.de
```

2. **Server starten**

```bash
cd packages/web
deno task dev
```

3. **Zugriff auf Admin-Panel**

- Öffne: `http://localhost:8000/admin/content`
- Login mit dem Admin-Token aus `.env`

## Implementiert

✅ **Backend**
- Admin-Auth-Middleware (`/admin/api/*` geschützt)
- Proxy zu Core-API (GET/POST/PUT/DELETE)
- Token-basierte Authentifizierung

✅ **Frontend**
- Login-Page mit Token-Eingabe
- ContentBoard mit Sidebar
- Spots/Trails-Listen
- Layer-Toggle

## Nächste Schritte

✅ **Map-Integration**
```bash
# Google Maps für React installiert
cd packages/web
deno add npm:@react-google-maps/api
```

✅ **Features implementiert**
- Interactive Map (Google Maps)
- Click-to-Create (Klick auf Karte → neuer Spot/Trail)
- Spot/Trail Selection
- Trail-Boundary-Editor (Rectangle-Bounds)
- Quick-Editor-Sidebar
- CRUD Operations (Create/Read/Update/Delete)

🚧 **TODO**
- Drag-to-Move (Spot-Position ändern)
- Interactive Trail-Boundary Drawing (Polygon zeichnen)
- Image-Upload

## Architektur

```
Browser
   │
   ├→ /admin/content (ContentBoard UI)
   │     ↓
   ├→ /admin/api/* (Protected with ADMIN_TOKEN)
   │     ↓
   └→ http://localhost:3000/api/* (Core API)
```

## Troubleshooting

**401 Unauthorized**
- Prüfe ADMIN_TOKEN in `.env`
- Token muss exakt übereinstimmen

**Core API nicht erreichbar**
- Starte Core-API: `deno run --allow-all packages/core/main.ts`
- Prüfe CORE_API_URL

**TypeScript-Fehler**
- Aktuell werden API-Response-Types mit `@ts-expect-error` ignoriert
- TODO: Proper Types aus `@shared/contracts` importieren
