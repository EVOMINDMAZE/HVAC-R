# Standard Cycle Analysis

An overview of the single-stage vapor-compression refrigeration cycle and practical guidance for simulations.

## Basic Theory

- Components: evaporator, compressor, condenser, expansion device.
- The cycle moves heat from the evaporator to the condenser using refrigerant as the working fluid.

## Input Parameters

- Evaporator temperature (`T_evap`), condenser temperature (`T_cond`), superheat, and subcooling are the primary inputs.
- Be consistent with units (temperatures in °C, pressures in kPa).

## Refrigerant Properties

- Each refrigerant has a unique saturation curve; check critical temperature and safety properties before selection.

## Performance Metrics

- COP, capacity, and compressor work are the primary metrics. Track mass flow and state points for diagnostics.

## Best Practices

- Maintain moderate subcooling (1–5°C) and tune superheat to avoid liquid carryover into the compressor.
