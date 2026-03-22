# Design Document: ThermoNeural App Improvement (Architecture & Stability)

**Status**: Draft
**Date**: 2026-03-21
**Topic Slug**: hvac-r-app-improvement
**Design Depth**: deep
**Task Complexity**: complex

## 1. Problem Statement

### Current State
ThermoNeural's HVAC-R engineering calculations (CoolProp-based) currently reside primarily on the Express.js server. While some logic is duplicated in TypeScript for the client, this creates **calculation drift** (inconsistent results between mobile and server) and makes the app **fragile in offline environments** (technicians cannot run complex models in basement mechanical rooms). Furthermore, the multi-tenant security model (RLS) is becoming a **scaling bottleneck** due to deep joins in policies, and manual session management (refreshing company context) leads to **stale data** and a clunky UI experience.

### Target State
A "Unified Engineering Engine" that achieves **1:1 logic parity** by running the same Python source code in a client-side WASM environment (Pyodide). This engine will be supported by a **self-healing data layer** (TanStack Query) with persistent caching for full offline access. Multi-tenant security will be optimized for **O(1) lookups** via denormalized organization markers, ensuring the app remains snappy as the user base grows.

### Key Decisions
- **Client-Side Python (Pyodide/WASM)** — *Rationale: Eliminates calculation drift and enables high-precision offline engineering without manual porting of complex physics libraries. Traces To: REQ-1 (Precision), REQ-2 (Offline).*
  - *(Considered: Shared TypeScript library — rejected because porting 10+ years of mature Python physics libs like CoolProp to TS is error-prone and resource-intensive.)*
- **Persistent TanStack Query** — *Rationale: Automates cache invalidation during multi-company context switching and provides a standard "stale-while-revalidate" offline experience. Traces To: REQ-3 (Sync), REQ-4 (Offline).*
- **Denormalized Organization Markers** — *Rationale: Future-proofs RLS performance by avoiding nested JOINs in security policies, ensuring sub-millisecond query authorization at any scale. Traces To: REQ-5 (Scalability).*

## 2. Requirements

### Functional Requirements
- **REQ-1 (Precision Engine)**: App must provide 1:1 calculation parity with the server-side Python physics engine using WASM.
- **REQ-2 (Offline Calculations)**: Technicians must be able to run complex HVAC calculations without a network connection.
- **REQ-3 (Auto-Sync)**: App must automatically invalidate and refresh caches when switching organizational contexts.
- **REQ-4 (Offline Data)**: Technicians must be able to view recently accessed equipment data and site history while offline.
- **REQ-5 (Multi-Tenant Security)**: The database must enforce strict multi-tenant isolation with sub-millisecond overhead.

### Non-Functional Requirements
- **PERF-1 (Initialization)**: Pyodide/WASM must initialize in the background without blocking the initial UI interaction.
- **RELI-1 (Data Integrity)**: Cached data must be clearly labeled as "offline/stale" to ensure technicians make informed safety decisions.
- **OBSV-1 (Offline Telemetry)**: Errors and calculation results occurring offline must be buffered and uploaded when a connection is restored.

### Constraints
- **Initial Payload**: Accept a larger initial app load (10-20MB) to accommodate the Python/WASM runtime.
- **Storage**: Technician devices must have at least 100MB of free space for IndexedDB caching and telemetry buffering.

## 3. Architecture

### Core Components
- **Pyodide Web Worker**: A dedicated background thread for the Python/WASM runtime. This ensures the main UI thread remains responsive during complex thermodynamic calculations.
- **Persistent TanStack Query**: Manages all server state. It uses the `persistQueryClient` plugin with an IndexedDB adapter to ensure that data fetched from Supabase in one session is available for reading while offline in the next.
- **Supabase PostgreSQL (Multi-Tenant)**: Core tables include a denormalized `organization_id` column. Supabase Row Level Security (RLS) policies are simplified to a direct check (e.g., `auth.uid() IN (SELECT user_id FROM organization_members WHERE organization_id = table.organization_id)`) to ensure sub-millisecond query authorization at any scale.
- **Supabase Edge Functions**: Serve as the "Server-Side" twin of the Python logic, running the same source code as the client-side Pyodide engine for high-precision validation and heavy batch processing.
- **Offline Telemetry Buffer (IndexedDB)**: A client-side logic layer that writes errors and calculation results to IndexedDB, then automatically flushes them to a `telemetry_logs` table in Supabase via the Supabase client when a connection is restored.

### Data Flow
1. **App Init**: TanStack Query loads cached Supabase data from IndexedDB; Pyodide warms up in a Web Worker.
2. **Context Switch**: User switches company via `SupabaseAuthProvider`; TanStack Query invalidates the cache; App fetches new organizational data from Supabase and persists it.
3. **Offline Mode**: `navigator.onLine` loss triggers the "Offline" UI indicator; TanStack Query serves stale data from the cache; Telemetry records to IndexedDB.
4. **Resync**: Connection restored; Telemetry flushes to Supabase; TanStack Query background-refetches (SWR) the current view.

### Key Decisions
- **Denormalized `organization_id` for Supabase RLS** — *Rationale: Directly addresses the Supabase "nested join" performance bottleneck by making security checks O(1) or O(log N) rather than O(N^2) as the user base grows. Traces To: REQ-5.*
  - *(Considered: Complex nested RLS policies — rejected because performance degrades significantly as the number of organizational memberships increases.)*
- **Supabase Client in "SWR" Mode** — *Rationale: Leverages TanStack Query to manage the Supabase fetch state, automating the "offline-to-online" transition without manual code. Traces To: REQ-3, REQ-4.*
- **Web Worker for Pyodide** — *Rationale: Prevents the UI from freezing during the ~10s WASM initialization and subsequent compute-heavy physics calculations. Traces To: PERF-1.*

## 4. Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| **Payload Size** | Medium | High | Use lazy loading for the Pyodide Web Worker; only download the physics runtime when a technician opens an engineering tool. |
| **Data Drift (Cached)** | High | Medium | Implement an explicit "Offline/Stale" UI indicator (RELI-1); technicians are trained that non-validated data carries higher risk. |
| **RLS Denormalization Errors** | High | Low | Use database triggers to automatically sync `organization_id` from parent records (e.g., Equipment -> Site -> Organization) to prevent manual error. |
| **Worker Initialization Latency** | Low | High | Pre-warm the Web Worker in the background immediately after app login so it's ready by the time the technician navigates to a tool. |
| **Inconsistent Sync** | Medium | Medium | Use TanStack Query's automatic retry and `offline` state tracking to ensure the UI remains consistent with the local cache during signal drops. |

### Key Decisions
- **Lazy Loading of WASM** — *Rationale: Balances the need for precision calculations with a fast initial TTI (Time to Interactive) for the core app. Traces To: PERF-1.*
- **Triggers for Organization Sync** — *Rationale: Ensures that denormalized security markers remain 100% accurate without manual developer intervention. Traces To: REQ-5.*

## 5. Agent Team

- **Architect (`architect`)**: Oversees the initial WASM integration and Pyodide Web Worker setup, ensuring 1:1 logic parity between client and server.
- **Data Engineer (`data_engineer`)**: Manages the Supabase database migrations, implements the denormalized `organization_id` strategy, and refactors RLS policies for O(1) lookups.
- **Coder (`coder`)**: Implements the TanStack Query persistence layer, integrates the `persistQueryClient` with IndexedDB, and builds the "Offline Mode" UI indicators.
- **Tester (`tester`)**: Builds a comprehensive "Offline Parity" test suite to verify that WASM-based calculations on the mobile client match Supabase Edge Function results exactly.
- **Code Reviewer (`code_reviewer`)**: Performs the final quality gate, focusing on security (RLS integrity) and performance (Pyodide initialization non-blocking check).

## 6. Success Criteria

1. **Zero Calculation Drift**: Every engineering calculation run via the mobile client (Pyodide) matches the Supabase Edge Function result to at least 5 decimal places across all edge cases.
2. **Sub-Second RLS Overhead**: All Supabase queries execute in under 100ms for organizations with 10,000+ records.
3. **100% Offline Access**: A technician can successfully navigate site history, view equipment specs, and run a complete thermodynamics tool with their device in "Airplane Mode."
4. **Seamless Context Switch**: Switching between two different organizations in the UI completes in under 2 seconds, including full cache invalidation and background revalidation.
5. **Robust Error Logging**: All offline calculation errors are successfully captured in IndexedDB and appear in the `telemetry_logs` Supabase table within 60 seconds of signal restoration.
