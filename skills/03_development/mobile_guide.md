---
name: Mobile App Guide 📱
description: ThermoNeural is configured with [Capacitor](https://capacitorjs.com/) to build native iOS and Android apps from the same codebase.
version: 1.0
---

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

### 3. Open & Run

**iOS (Mac Only):**

```bash
npx cap open ios
```

*Wait for Xcode to open, then click the "Play" button at the top left.*

**Android:**

```bash
npx cap open android
```

*Wait for Android Studio to open, then click the "Play" button.*

**Direct Simulator Launch:**

```bash
npx cap run ios --target <SIMULATOR_ID>
npx cap run android
```

## Deployment

- **iOS**: In Xcode, go to **Product -> Archive** to create a submission for the App Store.
- **Android**: In Android Studio, go to **Build -> Generate Signed Bundle / APK**.

## Notes

## Native Project Structure

- **`ios/`**: Full Xcode project for iPhone/iPad deployment.
- **`android/`**: Full Android Studio project for Google Play deployment.
- **`capacitor.config.ts`**: The bridge configuration between React and Native.

All native configuration (icons, splash screens, permissions) is handled in these folders respectively.

## Responsive Design Patterns

The application is designed "Mobile-First" but scales to desktop. Key implementation details:

- **Charts**: Use `recharts`'s `<ResponsiveContainer>` wrapper to ensure visualizations adapt to screen width (especially inside Cards).
- **Conditional UI**: Use `window.innerWidth` checks or CSS media queries (Tailwind `md:`, `lg:`) to show/hide complex elements (e.g., "Quick Actions" on mobile vs Sidebar on desktop).
- **Touch Targets**: Ensure buttons have a minimum height of 44px for touch accessibility.
