# Known Errors

## `scheduleOnRN` – Common Crash Pitfall (Android / JSI)

When calling `scheduleOnRN` from a worklet (e.g. inside `Gesture.onEnd`), **do not pass an inline function or closure**.

### Incorrect (can cause native crashes)

```ts
scheduleOnRN(() => {
  onGestureEnd(s, x, y)
})
```

**Why this is dangerous**

* The callback is created in the **worklet/UI runtime**
* `scheduleOnRN` expects a function from the **React Native JS runtime**
* This mismatch can lead to Android native crashes (e.g. `isHostFunction(runtime)` assertion)

### Correct usage

```ts
scheduleOnRN(onGestureEnd, s, x, y)
```

**Rules**

* The function must be defined in the **RN JS scope** (component body, preferably `useCallback`)
* Only pass **primitive values** as arguments
* Read shared values (`.value`) inside the worklet, not in the RN callback

### Typical symptoms

* Crash immediately after gesture end (Pinch / Pan / Scale)
* Android-only
* Logcat error:

  ```
  HostFunctionType &facebook::jsi::Function::getHostFunction(Runtime &) const
  assertion "isHostFunction(runtime)" failed
  ```
