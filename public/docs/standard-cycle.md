# Standard Cycle Analysis

This document covers theory and practical guidance for standard single-stage vapor-compression refrigeration cycles.

## Basic Theory
- The cycle consists of evaporator, compressor, condenser, and expansion device.
- Key thermodynamic processes: isobaric heat addition/removal and near-isentropic compression.

## Input Parameters
- Evaporator temperature (T_evap)
- Condenser temperature (T_cond)
- Superheat and subcooling
- Refrigerant selection (critical for properties)

## Refrigerant Properties
- Different refrigerants have different critical temps, GWP, and performance.
- Use the refrigerant selector to choose fluids like R134a, R290, R744.

## Performance Metrics
- COP: function of T_evap and T_cond — lower condensing temp increases COP.
- Capacity: depends on mass flow and enthalpy difference across evaporator.

## Best Practices
- Keep subcooling moderate (1–5°C) to avoid flash gas at expansion.
- Optimize superheat to ensure compressor suction isn't flooded.

Use the API endpoints to programmatically run standard cycle calculations (see API Reference).
