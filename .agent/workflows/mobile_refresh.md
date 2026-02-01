---
description: Rebuild the client and sync with Capacitor (iOS/Android)
---

This workflow rebuilds the React client and syncs the changes to the native Capacitor projects.
Use this when you have made changes to the `client/` code and need to verify them on a simulator or device.

// turbo-all
1. Rebuild the client and sync Capacitor
   `npm run build:client && npx cap sync`
