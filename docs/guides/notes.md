**Application-Schicht: Erkenntnisse**

**Wann Application:**
- API-Call + Store-Update
- Mehrere Stores koordinieren
- Cross-Feature-Logik (z.B. Sensor → Discovery → Map)
- Non-React-Lifecycle (Event-Subscriptions, DeviceConnector)

**Wann direkter Store-Zugriff:**
- Reines UI-State (Modal, Filter, Sortierung)
- Kein API, keine Cross-Feature-Konsequenz

**Wann Hook:**
- Reaktive Store-Komposition (mehrere Slices mergen → ViewModel)
- UI-Logik (Gestures, Animationen)
- Reactivity ist UI-Concern → kann nie über Application laufen

**Mental Model:**
```
Application  →  schreibt Stores  (imperativ, async, testbar ohne React)
Hook/Selector → liest Stores     (reaktiv, sync, UI-Brücke)
Component     → liest via Hook, schreibt via Application
```

**Was im Projekt nicht stimmt:**
- `useDiscoveredSpotPagination` / `useMySpotsPagination` rufen `api.*` direkt auf → sollte über Application
- Zugriffsmuster inkonsistent: manche Hooks nutzen Application, andere greifen direkt auf api im Store zu