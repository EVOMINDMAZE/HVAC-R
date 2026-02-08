---
name: Pricing Model & Revenue Streams 💰
description: Detailed pricing structures for the ThermoNeural "Business in a Box" platform, including community subscription, enterprise pricing, hardware, and fintech revenue streams.
version: 1.0
---

# Pricing Model & Revenue Streams 💰

## Overview

ThermoNeural follows a **"Trident" revenue model** with three integrated high‑value streams: **Community Subscription**, **Enterprise SaaS**, and **Hardware + Fintech partnerships**. This document details each pricing component and its role in the overall business ecosystem.

## 1. Community Subscription – "Business in a Box"

**Primary Product**: Monthly access to the ThermoNeural Community (hosted on Skool) with bundled software and automation benefits.

### Core Offering

- **Price**: **$199/month**
- **Billing**: Monthly subscription via Skool
- **Target Audience**: HVAC business owners (1–10 technicians)

### Included Assets

1. **Community Access**
   - Discussion forums, peer learning, networking
   - Live Q&A sessions and expert guidance

2. **HVAC‑R Pro App (White‑Labeled)**
   - Professional estimation, CRM, and project management
   - PDF report generation with custom branding
   - Saved calculation history and advanced HVAC tools
   - Mobile‑ready PWA (iOS/Android via Capacitor)

3. **Automation Engine (Zero‑Setup)**
   - **Review Hunter**: Automatically requests customer reviews after completed jobs
   - **Invoice Chaser**: Follows up on overdue invoices with customizable SMS/email
   - Serverless execution via Supabase Edge Functions – no infrastructure to manage

4. **Support & Updates**
   - Priority support via community channels
   - Continuous feature updates and bug fixes

## 2. Enterprise – "Fleet Command"

**Target**: Larger HVAC companies (10+ technicians) needing dispatcher‑level oversight and fleet management.

### Pricing Structure

- **Per‑Seat Model**: **$49/technician/month**
- **Minimum**: 10 seats ($490/month)
- **Billing**: Annual contract preferred, monthly invoicing available

### Included Features

- **Live Fleet Map**: Real‑time technician GPS location (from app pings)
- **Performance Dashboard**: Efficiency leaderboards, job‑completion analytics
- **Asset History**: Serial‑number search across the entire company portfolio
- **Role‑Based Access Control**: Dispatcher, manager, and technician roles
- **Advanced Reporting**: Custom CSV exports, KPI tracking

## 3. Hardware – "ThermoKey" Bluetooth Probe

**Concept**: White‑labeled Bluetooth temperature/pressure probe that integrates directly with the app’s calculation tools.

### Pricing & Bundling

- **Standalone Price**: $149–$199 (depending on manufacturing volume)
- **Subscription Bundle**: **Free** with an annual "Business in a Box" subscription
- **Purpose**: Creates physical lock‑in and provides reliable real‑time data for calculations

### Technical Integration

- Web Bluetooth API (Chrome/Android native, Bluefy for iOS)
- Auto‑detection in the Superheat/Subcooling calculator
- Data feeds directly into the Render calculation engine for improved accuracy

## 4. Fintech – "ThermoPay" Consumer Financing

**Partnership**: Integration with Wisetack (or Stripe Capital) to offer consumer financing at point of sale.

### Revenue Model

- **Referral Fee**: **1%** of financed amount
- **Example**: $12,000 system → $120 commission paid instantly upon approval
- **Integration**: "Enable Monthly Payments" toggle inside the existing Invoice Generator

### Flow

1. Technician creates invoice in app
2. App displays: _“Or $199/mo via Wisetack”_
3. Customer clicks link, gets approved in 30 seconds
4. ThermoNeural receives 1% referral fee automatically

## 5. Revenue Expansion Strategy ("Trident Model")

| Stream | Role in Ecosystem | Revenue Type | Target Margin |
| :--- | :--- | :--- | :--- |
| **Community Subscription** | Core recurring revenue | Monthly SaaS | High (80%+) |
| **Enterprise (Fleet)** | Scale & whale accounts | Per‑seat SaaS | High (70%+) |
| **Hardware (ThermoKey)** | Physical lock‑in & data | One‑time + recurring bundling | Moderate (50%+) |
| **Fintech (ThermoPay)** | Conversion lubricant | Commission (1%) | Very high (100% margin) |

## 6. Implementation Roadmap

### Phase 1: Fintech (Low Effort, High Cash)

- Apply for Wisetack partnership
- Add “Apply for Financing” button to Invoice PDF
- **Timeline**: 2–4 weeks

### Phase 2: Enterprise (Data Visualization)

- Create `FleetDashboard.tsx`
- Upgrade `companies` table to support `role: 'manager' | 'tech'`
- **Timeline**: 4–6 weeks

### Phase 3: Hardware (Logistics Heavy)

- Source sample Bluetooth manometer (Elitech, Testo)
- Reverse‑engineer BLE protocol
- **Timeline**: 8–12 weeks

## 7. Related Documentation

- [Business in a Box](../02_business/business_in_a_box.md)
- [Revenue Expansion Strategy](../01_strategy/revenue_expansion_plan.md)
- [Master Execution Plan](../01_strategy/master_execution_plan.md)

## 8. Revision History

- **v1.0** (2026‑02‑07): Initial pricing model created during documentation audit.
