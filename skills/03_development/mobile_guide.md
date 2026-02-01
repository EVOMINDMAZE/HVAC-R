# Mobile App Guide 📱

## Overview
ThermoNeural is configured with [Capacitor](https://capacitorjs.com/) to build native iOS and Android apps from the same codebase.

## Prerequisites
**Important:** You must install the FULL native development environments. The command line tools are not enough.

- **iOS**: [Install Xcode](https://apps.apple.com/us/app/xcode/id497799835) from the Mac App Store. (Free, large download ~3GB+).
- **Android**: [Install Android Studio](https://developer.android.com/studio) (Free).

## How to Build & Run
### 1. Update the Web App
Make your changes to the React code (`client/`), then run:
```bash
npm run build
```

### 2. Sync with Mobile
Push the latest web build to the native projects:
```bash
npx cap sync
```

### 3. Open in Simulator
**iOS:**
```bash
npx cap open ios
```
*Wait for Xcode to open, then click the "Play" button at the top left.*

**Android:**
```bash
npx cap open android
```
*Wait for Android Studio to open, then click the "Play" button.*

## Deployment
- **iOS**: In Xcode, go to **Product -> Archive** to create a submission for the App Store.
- **Android**: In Android Studio, go to **Build -> Generate Signed Bundle / APK**.

## Notes
- The App ID is `com.thermoneural.app`.
- All native configuration (icons, splash screens, permissions) is handled in `ios/` and `android/` folders respectively.
