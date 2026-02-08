# Psychrometric Calculations

Understanding psychrometric properties is essential for HVAC system design and troubleshooting. This guide explains our psychrometric calculator.

## Key Measurements

### Dry Bulb Temperature
Temperature measured by a standard thermometer. This is the "sensible" air temperature.

### Wet Bulb Temperature
Temperature measured with a wetted wick around the thermometer. Lower than dry bulb due to evaporative cooling effect.

### Relative Humidity
The ratio of actual water vapor in the air to the maximum possible at that temperature, expressed as a percentage.

### Dew Point
The temperature at which the air becomes saturated (100% RH) and condensation begins.

## Using the Calculator

### Method 1: Dry Bulb + Wet Bulb
1. Enter dry bulb temperature
2. Enter wet bulb temperature
3. Calculator returns: RH%, dew point, humidity ratio, enthalpy

### Method 2: Dry Bulb + Relative Humidity
1. Enter dry bulb temperature
2. Enter relative humidity percentage
3. Calculator returns: wet bulb, dew point, humidity ratio, enthalpy

## Practical Applications

### Target Superheat Calculation
The calculator can determine target superheat using:
```
Target SH = ((3 × Indoor WB) - 80 - Outdoor DB) / 2
```

### System Diagnostics
- **High wet bulb depression**: Low humidity, potential comfort issues
- **Low wet bulb depression**: High humidity, potential mold concerns
- **Dew point near supply temp**: Risk of condensation on ducts/equipment

## Altitude Considerations

Psychrometric properties change with altitude. Our calculator includes elevation correction for accurate results at any location.

---

*For system troubleshooting, see [System Troubleshooting](/docs/troubleshooting).*
