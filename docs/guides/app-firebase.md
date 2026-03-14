# Firebase

## Project 
[ferthe-app](https://console.firebase.google.com/u/0/project/ferthe-app/overview)

Packages:
- `de.ferthe.app.dev` – Development Package
- `de.ferthe.app` – Production Package

Configuration:
- File: `packages/app/google-services.json`
- Project ID: `ferthe-app`
- Project Number: `162900310838`

---

## Verwendung

Firebase wird im Projekt **ausschließlich für Push-Notifications** über FCM (Firebase Cloud Messaging) eingesetzt.  
Für die eigentliche Darstellung der Notifications wird zusätzlich `notifee` verwendet.

### Packages (app)

```
@react-native-firebase/app
@react-native-firebase/messaging
```

---

## Initialisierungs-Flow

1. Die App startet `useInitializationPipeline` → ruft `usePushNotifications` auf
2. `registerForPushNotificationsAsync` wird ausgeführt:
   - Firebase ist nativ bereits initialisiert via `google-services.json` (Android) / `GoogleService-Info.plist` (iOS)
   - Notification-Berechtigung wird beim Nutzer angefragt
   - FCM-Token wird abgerufen und per `registerDeviceToken` ans Backend gesendet
3. Bei Token-Refresh wird der neue Token automatisch ans Backend gemeldet

> Die JS-seitige Firebase-Initialisierung (`initializeApp`) entfällt – `@react-native-firebase` verwendet automatisch die nativen Konfigurationsdateien.

---

## Notification Channels (Android)

| Channel ID | Name            | Zweck                            |
|------------|-----------------|----------------------------------|
| `default`  | Default Channel | Allgemeine Benachrichtigungen    |
| `trails`   | Trail Updates   | Trail-Updates und Entdeckungen   |

---

## Bekannte Fehler

**`FIS_AUTH_ERROR`**: Der SHA-Fingerprint der App ist nicht in der Firebase Console registriert.  
→ Lösung: In der Firebase Console unter *Android App → SHA certificate fingerprints* den SHA-1/SHA-256 des Build-Keys eintragen.

---

## Wichtige Dateien

| Datei | Beschreibung |
|-------|--------------|
| `packages/app/google-services.json` | Android Firebase-Konfiguration (beide Packages) |
| `packages/app/src/init/usePushNotifications.ts` | Hook: Permission, Channels, Foreground-Handler |
| `packages/app/src/shared/messaging/registerNotificationHandler.ts` | Firebase-Init, Token-Registrierung, Backend-Sync |
| `packages/shared/contracts/config.ts` | `FirebaseConfig`-Schema |