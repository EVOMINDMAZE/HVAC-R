# Revenue Expansion Strategy: The "Trident" Model 🔱

This document outlines the strategy for integrating three high-value revenue streams: **Hardware (Dongles)**, **Fintech (Lending)**, and **Enterprise (Fleets)**.

## 1. The Strategy: "Smart Integration"

We will not build these as separate silos. They will be integrated as **force multipliers** for the core "Business in a Box".

| Feature        | Role in Ecosystem               | Revenue Type                 |
| :------------- | :------------------------------ | :--------------------------- |
| **Hardware**   | The "Physical Cookie" (Lock-in) | One-off + High Margin        |
| **Fintech**    | The "Lubricant" (Conversion)    | % Commission (Recurring)     |
| **Enterprise** | The "Whale" (Scale)             | High-Ticket SaaS (Recurring) |

---

## 2. Implementation Plan

### A. Hardware: The "ThermoKey" (Bluetooth Probe) 🌡️

- **Concept**: A white-labeled Bluetooth temperature/pressure probe.
- **Smart Integration**:
  - **The "Dongle" Effect**: The App's "Superheat Calculator" _auto-detects_ the probe.
  - **The Lock-in**: Give the probe away for **FREE** (or at cost) with an Annual "Business in a Box" subscription.
  - **The Data**: Real-time reliable data feeds directly into the `Render` calculation engine, improving accuracy (and making manual entry feel archaic).
- **Tech Stack**: Web Bluetooth API (works in Chrome/Android instantly, Bluefy for iOS).

### B. Fintech: "ThermoPay" (Consumer Financing) 💳

- **Concept**: Allow Technicians to offer financing to homeowners _at the kitchen table_.
- **Smart Integration**:
  - **The Trigger**: Inside the **Invoice Generator** (existing feature).
  - **The UI**: A toggle: _"Enable Monthly Payments for Customer?"_
  - **The Flow**:
    1.  Tech quotes $12,000 for a new system.
    2.  App displays: _"Or $199/mo via Wisetack"_.
    3.  Customer clicks link, gets approved in 30s.
    4.  We get a **1% referral fee** ($120) instantly.
- **Partner**: Wisetack or Stripe Capital (Integrated via API).

### C. Enterprise: "Fleet Command" 🏢

- **Concept**: A "God Mode" dashboard for dispatchers managing 50+ techs.
- **Smart Integration**:
  - **The Data**: We already have Edge Functions collecting GPS and job status.
  - **The UI**: A new `/fleet` route in the Web App (RBAC protected).
  - **The Features**:
    - **Live Map**: Real-time tech location (from App Pings).
    - **Performance**: Optimized via route-splitting and localized state management.
    - **Efficiency Leaderboard**: Who does the best installs? (Based on Render calculations).
    - **Asset History**: Search by Serial Number across the entire company.
- **Pricing**: Per Seat Model (e.g., $49/tech/mo).

---

## 3. Execution Roadmap

### Phase 1: Fintech (Low Effort, High Cash) 💰

- **Why**: Requires zero hardware manufacturing and zero new "SaaS" logic. just API integration.
- **Action**: Apply for Wisetack Partnership -> Add "Apply for Financing" button to Invoice PDF.

### Phase 2: Enterprise (Data Visualization) 📊

- **Why**: We have the data; we just need to visualize it.
- **Action**: Create `FleetDashboard.tsx` and upgrade `companies` table to support `role: 'manager' | 'tech'`.

### Phase 3: Hardware (Logistics Heavy) 📦

- **Why**: Highest friction (shipping, returns). Do this last or finding a partner to drop-ship.
- **Action**: Source a sample Bluetooth Manometer (e.g., Elitech or Testo) and reverse-engineer the BLE protocol.
