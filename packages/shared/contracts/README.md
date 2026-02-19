# Contracts

This directory defines the API boundary between Core (backend) and App (frontend). All types represent HTTP request/response contracts.

## What Belongs Here

- **ApplicationContracts**: Method signatures for feature APIs (account, trail, discovery, etc.)
- **CompositeContracts**: Aggregated multi-feature operations (discovery state, spot access)
- **Domain Types**: Data models exchanged over HTTP (accounts, spots, trails, discoveries)
- **Result Types**: Response wrappers (Result, error codes, validation)
- **Enums & Constants**: Shared value types (SpotSource, DiscoveryMode, etc.)

## What Does NOT Belong Here

- Implementation details (services, applications, stores)
- Backend-only fields or logic (internal status, flags)
- App-only hooks or store structures
- UI components or styling
- Business logic (validation, calculations, decisions)
- Database models or internal persistence types

## Rules

1. Types are immutable from the API perspective (readonly fields where appropriate)
2. Dates are ISO strings on wire, deserialized to Date objects
3. All HTTP methods return Result<T> (success + data or error)
4. Avoid optional fields – use null explicitly if needed
5. Backend-only fields must not leak into types sent to App
6. Composite responses use lightweight Summary types (normalized, no duplication)
