# Push Notifications Setup

Schritt-für-Schritt-Anleitung um Push-Notifications in der ferthe-App zum Laufen zu bringen.

---

## Voraussetzungen

- Firebase-Projekt `ferthe-app` existiert
- Android-App `de.ferthe.app` in Firebase registriert
- iOS-App `de.ferthe.app` in Firebase registriert (optional, nur für iOS-Builds)

---

## 1. Client-Konfiguration (App)

### Android: `google-services.json`

1. Firebase Console → Projekt **ferthe-app** → ⚙️ Projekteinstellungen
2. Tab **Allgemein** → Runterscrollen zu **Ihre Apps**
3. Android-App `de.ferthe.app` auswählen
4. **google-services.json herunterladen**
5. Datei nach `packages/app/google-services.json` kopieren

### iOS: `GoogleService-Info.plist` (optional)

1. Firebase Console → Projekt **ferthe-app** → ⚙️ Projekteinstellungen
2. iOS-App `de.ferthe.app` auswählen
3. **GoogleService-Info.plist herunterladen**
4. Datei nach `packages/app/GoogleService-Info.plist` kopieren

> **Hinweis:** Ohne iOS-Datei funktioniert Android trotzdem. iOS-Builds schlagen dann fehl.

---

## 2. SHA-Fingerprint registrieren (Android)

Firebase benötigt den SHA-Fingerprint deiner Development-App, um FCM-Tokens auszustellen.

### SHA-Fingerprint generieren

```bash
cd packages/app

# Android-Projekt generieren (falls noch nicht geschehen)
npx expo prebuild --clean --platform android

# SHA-Fingerprint extrahieren
keytool -list -v -keystore android/app/debug.keystore \
  -alias androiddebugkey -storepass android -keypass android \
  | grep -E "SHA1|SHA256"
```

**Output:**
```
SHA1: 5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25
SHA256: FA:C6:17:45:DC:09:03:78:6F:B9:ED:E6:2A:96:2B:39:9F:73:48:F0:BB:6F:89:9B:83:32:66:75:91:03:3B:9C
```

### SHA in Firebase eintragen

1. Firebase Console → Projekt **ferthe-app** → ⚙️ Projekteinstellungen
2. Tab **Allgemein** → Android-App `de.ferthe.app`
3. Runterscrollen zu **SHA-Zertifikatfingerabdrücke**
4. **SHA-1** hinzufügen (Wert von oben eintragen)
5. **SHA-256** hinzufügen (Wert von oben eintragen)
6. Speichern

> **Wichtig:** Ohne SHA-Fingerprint schlägt `getToken()` mit `FIS_AUTH_ERROR` fehl.

---

## 3. Backend-Konfiguration (Service Account)

Das Backend benötigt einen Firebase Service Account, um Push-Notifications zu **senden**.

### Service Account generieren

1. Firebase Console → Projekt **ferthe-app** → ⚙️ Projekteinstellungen
2. Tab **Dienstkonten**
3. Button **Neuen privaten Schlüssel generieren** → Bestätigen
4. JSON-Datei wird heruntergeladen (z.B. `ferthe-app-firebase-adminsdk-xxxxx.json`)

### Service Account konfigurieren

**Development (lokal):**

Füge die Service-Account-JSON als **einzeilige** Umgebungsvariable in `.env` ein:

```bash
# packages/core/.env
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"ferthe-app","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-...@ferthe-app.iam.gserviceaccount.com",...}'
```

**Produktion (Azure):**

Erstelle ein Secret in Azure Key Vault:

```bash
az keyvault secret set \
  --vault-name kv-ferthe-core \
  --name firebase-service-account \
  --value '{"type":"service_account",...}'
```

Das Backend lädt es automatisch aus dem Key Vault (siehe [secrets.ts](../packages/core/config/secrets.ts)).

---

## 4. App testen

1. **App neu bauen und starten:**
   ```bash
   cd packages/app
   npx expo run:android
   ```

2. **In der App anmelden** (Permission-Dialog erscheint)

3. **Push-Permission erteilen** → FCM-Token wird automatisch an Backend gesendet

4. **Logs prüfen:**
   ```
   [Push] Device token synced to backend
   ```

5. **Test-Push senden:**
   ```bash
   deno run -A tools/send-push-notification.ts <accountId> \
     --title "Test" --body "Hello World"
   ```

6. **Notification erscheint** auf dem Gerät

---

## Troubleshooting

### `FIS_AUTH_ERROR`
- **Ursache:** SHA-Fingerprint fehlt in Firebase Console
- **Lösung:** Schritt 2 wiederholen, App neu starten

### `No service account configured`
- **Ursache:** `FIREBASE_SERVICE_ACCOUNT` nicht gesetzt
- **Lösung:** Schritt 3 wiederholen, Backend neu starten

### `No device tokens found`
- **Ursache:** User hat keine Push-Permission erteilt
- **Lösung:** App neu installieren, Permission-Dialog bestätigen

### Notification kommt nicht an
- **Prüfen:** Backend-Logs auf FCM-Fehler
- **Prüfen:** Device-Token in Datenbank vorhanden (Store: `device-tokens`)
- **Prüfen:** App läuft im Foreground? (Notifee zeigt Notification trotzdem)

---

## Architektur-Übersicht

```
┌─────────────┐      FCM Token      ┌──────────────┐
│  App (iOS/  │ ──────────────────> │   Backend    │
│   Android)  │                     │   (Core)     │
└─────────────┘                     └──────────────┘
       │                                    │
       │ FCM Push ◄─────────────────────────┘
       │           (via Google FCM API)
       ▼
┌─────────────┐
│   Notifee   │  Zeigt Notification
│  (Display)  │  + Channels + Actions
└─────────────┘
```

**Flow:**
1. App fordert Permission + holt FCM-Token
2. Token wird an Backend gesendet (`POST /account/device-token`)
3. Backend speichert Token in Store (`device-tokens`)
4. Event tritt ein (z.B. neuer Trail)
5. Backend lädt Tokens des Users
6. Backend sendet Push via FCM v1 API
7. App empfängt Push → Notifee zeigt Notification

---

## Weitere Infos

- **Firebase Connector:** [firebaseConnector.ts](../packages/core/connectors/firebaseConnector.ts)
- **Notification Service:** [notificationService.ts](../packages/core/features/notification/notificationService.ts)
- **App Handler:** [useNotificationHandler.ts](../packages/app/src/shared/messaging/useNotificationHandler.ts)
- **Test-Tool:** [send-push-notification.ts](../tools/send-push-notification.ts)
