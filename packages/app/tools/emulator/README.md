# EXPO Android Emulator Setup 

## Precheck
- TypeScript Check All ausführen
- Prüfen ob Versionen etc. aktuell sind. Am einfachsten ist es mit ` npx expo-doctor `.
- EAS benötigt ein Token für das Login. Prüfe ob das Token von EXPO noch aktuell ist.

## Clean 
- Entferne alte node_modules und installiere Abhängigkeiten
`rm -rf node_modules package-lock.json && npm install`

## Check
 - Prüfe ob Pakete aktuell und keine Fehler vorliegen:
` npx expo-doctor `

## Build
- Baue die App via Build Script: Verwendet Linux Docker Container. 
- [dockerfile](./Dockerfile)
- [build.sh](./build.sh)

## Emulator (Windows)
- Benötigt das Android SDK + Emulator + abs Tools (werden mit Android Studio installiert)
- Starte den Emulator via PowerShell Script 
- [start-emulator.ps1](./start-emulator.ps1)

## Start
- Expo Client auf dem Server starten:
` npx expo start --dev-client`