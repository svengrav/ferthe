# Account Feature - App Implementation

Dieses Verzeichnis enthält die App-seitige Implementierung des Account Features, das SMS-basierte Benutzerauthentifizierung bereitstellt.

## Architektur

Das Account Feature folgt der ferthe-Architektur mit klarer Trennung von Verantwortlichkeiten:

```
App Layer (Account Feature)
├── accountManager.ts       # Main interface für Account-Operationen
├── accountService.ts       # Business Logic Layer
├── accountApplication.ts   # Application Layer mit Session Management
├── accountDemo.ts         # Demo und Beispiel-Implementierung
└── index.ts              # Factory und Exports
```

## Verwendung

### 1. Account Manager initialisieren

```typescript
import { AccountManager } from '@app/features/account/accountManager'
import { createApiContext } from '@app/api/vapiContext'
import { secureStoreConnector } from '@app/device/secureStoreConnector'

// Core Context erstellen (mit API Verbindung)
const coreContext = createApiContext({
  apiEndpoint: 'https://api.ferthe.app',
  environment: 'production'
})

// Account Manager erstellen
const accountManager = new AccountManager({
  coreContext,
  secureStore: secureStoreConnector
})
```

### 2. SMS-basierte Anmeldung

```typescript
// SMS Code anfordern
const smsResult = await accountManager.requestSMSCode('+1234567890')
if (smsResult.success) {
  logger.log(`SMS gesendet! Läuft ab in ${smsResult.expiresIn} Minuten`)
}

// SMS Code verifizieren (nach Benutzereingabe)
const loginResult = await accountManager.loginWithSMS('+1234567890', '123456')
if (loginResult.success) {
  logger.log(`Anmeldung erfolgreich! User ID: ${loginResult.userId}`)
}
```

### 3. Session Management

```typescript
// Anmeldestatus prüfen
const isLoggedIn = accountManager.isLoggedIn()
const userId = accountManager.getCurrentUserId()

// Ausführliche Authentifizierungsstatus-Prüfung
const authStatus = await accountManager.checkAuthenticationStatus()
logger.log('Authentifiziert:', authStatus.isAuthenticated)
logger.log('User ID:', authStatus.userId)

// Benutzeraccount abrufen
const userAccount = await accountManager.getCurrentUserAccount()
if (userAccount) {
  logger.log('Account erstellt:', userAccount.createdAt)
  logger.log('Letzter Login:', userAccount.lastLoginAt)
}
```

### 4. Abmeldung

```typescript
// Benutzer abmelden
await accountManager.logout()
logger.log('Abmeldung erfolgreich')
```

## Demo verwenden

```typescript
import { AccountDemo } from '@app/features/account/accountDemo'

const demo = new AccountDemo({
  coreContext,
  secureStore: secureStoreConnector
})

// Alle Demo-Funktionen ausführen
await demo.runAllDemos()

// Oder einzelne Demos
await demo.demonstrateSMSLogin('+1234567890')
await demo.demonstrateSessionManagement()
await demo.demonstrateLogout()
```

## Features

### SMS Authentication
- ✅ SMS Code anfordern
- ✅ SMS Code verifizieren
- ✅ Sichere Session-Erstellung

### Session Management
- ✅ Automatische Session-Speicherung im SecureStore
- ✅ Session-Validierung
- ✅ Session-Refresh (vorbereitet)
- ✅ Session-Widerruf bei Abmeldung

### User Account
- ✅ Benutzeraccount-Informationen abrufen
- ✅ Anmeldestatus prüfen
- ✅ User ID Management

### Security
- ✅ Sichere lokale Speicherung von Sessions
- ✅ Automatische Session-Bereinigung bei Ablauf
- ✅ Kein Speichern sensibler Daten (phoneHash, etc.)

## Integration mit bestehender Architektur

Das Account Feature integriert sich nahtlos in die bestehende ferthe-Architektur:

- **API Layer**: Nutzt `createAccountApiApplication` für API-Kommunikation
- **Core Context**: Erweitert `CoreContext` um `accountApplication`
- **Secure Storage**: Nutzt bestehenden `secureStoreConnector`
- **Factory Pattern**: Folgt etablierten Dependency Injection Patterns
- **TypeScript**: Vollständige Typisierung aller Interfaces

## Nächste Schritte

1. **React Integration**: React Hooks für Account Management erstellen
2. **UI Components**: Login/Logout Komponenten implementieren
3. **Error Handling**: Erweiterte Fehlerbehandlung und User Feedback
4. **Session Refresh**: Automatische Session-Verlängerung implementieren
5. **Multi-User**: Support für mehrere Benutzer pro Device

## Architektur-Prinzipien

- ✅ **Separation of Concerns**: Klare Trennung zwischen API, Application und Service Layer
- ✅ **Dependency Injection**: Alle Dependencies werden injiziert
- ✅ **Pure Functions**: Business Logic in reinen Funktionen
- ✅ **Type Safety**: Vollständige TypeScript Typisierung
- ✅ **Error Boundaries**: Proper Error Handling mit Logging
- ✅ **Minimal Code**: Fokussierte, kleine Funktionen
