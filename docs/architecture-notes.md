# Architecture Notes

## Sensor Permission Management

**Problem**: Blocking device location check (lat===0 && lon===0) in mapApplication.ts caused infinite loading when device unavailable.

**Solution**: Reactive state machine with non-blocking initialization
- SensorStatus flow: `uninitialized → permission-required → location-unavailable → ready`
- sensorStore tracks: status, permissionGranted, statusMessage, requestPermission callback
- deviceConnector.requestLocationPermission() returns `{granted: boolean}`
- sensorApplication.initializeDevice() orchestrates: permission request → status updates → location tracking
- mapApplication removed blocking checks, reacts to onDeviceUpdate events

**Pattern**: Event-driven updates (Connector → Application → Store → UI)

**Benefits**: Non-blocking initialization, clear user feedback, testable permission flow, separation of concerns

---

## Image Upload Architecture

**Pattern**: Feature-owned uploads (not generic /images routes)

**Flow**: 
- UI (AvatarUpload.tsx) → accountApplication.uploadAvatar(base64)
- App API → POST /account/avatar
- Core → accountApplication.uploadAvatar(context, base64) → imageApplication.uploadImage()
- Infrastructure → Azure Blob Storage with SAS tokens

**ImageApplication** (feature-agnostic):
- CUID2-based anonymous paths for security
- Blob metadata for ownership tracking: `{uploadedBy, imageType, timestamp}`
- Type-safe ImageType union: 'account-avatar' | 'discovery' | 'spot'
- SAS token generation (15-minute expiry)

**Implementation**:
- expo-image-picker: aspect [1,1], quality 0.8, allowsEditing: true
- FileSystem.readAsStringAsync(uri, {encoding: 'base64'})
- Base64-over-HTTP: server validation, no Azure credentials in client, type-safe contracts

**Security**: Anonymous paths prevent guessing, server-side validation, short-lived tokens, metadata ownership verification
