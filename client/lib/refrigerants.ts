// Enhanced refrigerant database with CoolProp-validated properties
export interface RefrigerantLimits {
  min_temp_c: number;  // Celsius
  max_temp_c: number;  // Celsius
  critical_temp_c: number;  // Celsius
  critical_pressure_kpa: number;  // kPa
  normal_boiling_point_c: number;  // Celsius
  minTemp: number;  // Kelvin (legacy)
  maxTemp: number;  // Kelvin (legacy)
  minPressure: number;  // Pa (legacy)
  maxPressure: number;  // Pa (legacy)
  criticalTemp: number;  // Kelvin (legacy)
  criticalPressure: number;  // Pa (legacy)
  normalBoilingPoint: number;  // Kelvin (legacy)
}

export interface RefrigerantProperties {
  id: string;
  name: string;
  fullName: string;
  category: 'Natural' | 'HFC' | 'HFO' | 'HCFC' | 'CFC' | 'CO2' | 'Hydrocarbon' | 'Ammonia';
  ozoneDepleteionPotential: number;
  globalWarmingPotential: number;
  safety: 'A1' | 'A2' | 'A2L' | 'A3' | 'B1' | 'B2' | 'B2L' | 'B3';
  // Aliases for compatibility
  odp: number;
  gwp: number;
  safety_class: string;
  applications: string[];
  limits: RefrigerantLimits;
  coolpropSupport: 'full' | 'limited' | 'none';
  alternativeNames?: string[];
  description: string;
  color: string; // For visualization
}

export const REFRIGERANT_DATABASE: RefrigerantProperties[] = [
  {
    id: 'R134a',
    name: 'R-134a',
    fullName: 'Tetrafluoroethane',
    category: 'HFC',
    ozoneDepleteionPotential: 0,
    globalWarmingPotential: 1430,
    safety: 'A1',
    odp: 0,
    gwp: 1430,
    safety_class: 'A1',
    applications: ['Air Conditioning', 'Commercial Refrigeration', 'Automotive AC'],
    limits: {
      min_temp_c: -103.3,
      max_temp_c: 181.9,
      critical_temp_c: 101.06,
      critical_pressure_kpa: 4059.3,
      normal_boiling_point_c: -26.07,
      minTemp: 169.85,  // Legacy Kelvin
      maxTemp: 455.0,
      minPressure: 389.6,
      maxPressure: 7000000,
      criticalTemp: 374.21,
      criticalPressure: 4059280,
      normalBoilingPoint: 247.08
    },
    coolpropSupport: 'full',
    description: 'Most common HFC refrigerant for medium-temperature applications',
    color: '#3B82F6'
  },
  {
    id: 'R410A',
    name: 'R-410A',
    fullName: 'Difluoromethane/Pentafluoroethane',
    category: 'HFC',
    ozoneDepleteionPotential: 0,
    globalWarmingPotential: 2088,
    safety: 'A1',
    odp: 0,
    gwp: 2088,
    safety_class: 'A1',
    applications: ['Air Conditioning', 'Heat Pumps', 'Residential HVAC'],
    limits: {
      min_temp_c: -73.0,
      max_temp_c: 176.9,
      critical_temp_c: 71.34,
      critical_pressure_kpa: 4901.2,
      normal_boiling_point_c: -51.44,
      minTemp: 200.0,
      maxTemp: 450.0,
      minPressure: 5000,
      maxPressure: 6000000,
      criticalTemp: 344.49,
      criticalPressure: 4901200,
      normalBoilingPoint: 221.71
    },
    coolpropSupport: 'full',
    description: 'High-pressure blend for air conditioning systems',
    color: '#10B981'
  },
  {
    id: 'R744',
    name: 'R-744',
    fullName: 'Carbon Dioxide',
    category: 'CO2',
    ozoneDepleteionPotential: 0,
    globalWarmingPotential: 1,
    safety: 'A1',
    odp: 0,
    gwp: 1,
    safety_class: 'A1',
    applications: ['Transcritical Systems', 'Cascade Systems', 'Commercial Refrigeration'],
    limits: {
      min_temp_c: -56.57,
      max_temp_c: 30.98,
      critical_temp_c: 30.98,
      critical_pressure_kpa: 7377.3,
      normal_boiling_point_c: -78.46,
      minTemp: 216.58,
      maxTemp: 304.13,
      minPressure: 517950,
      maxPressure: 15000000,
      criticalTemp: 304.1282,
      criticalPressure: 7377300,
      normalBoilingPoint: 194.69
    },
    coolpropSupport: 'full',
    description: 'Natural refrigerant for low-temperature and transcritical applications',
    color: '#EF4444'
  },
  {
    id: 'R290',
    name: 'R-290',
    fullName: 'Propane',
    category: 'Hydrocarbon',
    ozoneDepleteionPotential: 0,
    globalWarmingPotential: 3,
    safety: 'A3',
    odp: 0,
    gwp: 3,
    safety_class: 'A3',
    applications: ['Domestic Refrigeration', 'Commercial Freezers', 'Heat Pumps'],
    limits: {
      min_temp_c: -187.67,
      max_temp_c: 122.85,
      critical_temp_c: 96.74,
      critical_pressure_kpa: 4251.2,
      normal_boiling_point_c: -42.11,
      minTemp: 85.48,
      maxTemp: 396.0,
      minPressure: 0.00017,
      maxPressure: 4251200,
      criticalTemp: 369.89,
      criticalPressure: 4251200,
      normalBoilingPoint: 231.04
    },
    coolpropSupport: 'full',
    description: 'Natural hydrocarbon refrigerant with excellent efficiency',
    color: '#F59E0B'
  },
  {
    id: 'R32',
    name: 'R-32',
    fullName: 'Difluoromethane',
    category: 'HFC',
    ozoneDepleteionPotential: 0,
    globalWarmingPotential: 675,
    safety: 'A2L',
    odp: 0,
    gwp: 675,
    safety_class: 'A2L',
    applications: ['Air Conditioning', 'Heat Pumps', 'Split Systems'],
    limits: {
      min_temp_c: -136.81,
      max_temp_c: 161.85,
      critical_temp_c: 78.11,
      critical_pressure_kpa: 5782.0,
      normal_boiling_point_c: -51.65,
      minTemp: 136.34,
      maxTemp: 435.0,
      minPressure: 0.478,
      maxPressure: 5782000,
      criticalTemp: 351.26,
      criticalPressure: 5782000,
      normalBoilingPoint: 221.499
    },
    coolpropSupport: 'full',
    description: 'Lower GWP alternative to R-410A',
    color: '#8B5CF6'
  },
  {
    id: 'R448A',
    name: 'R-448A',
    fullName: 'Solstice N40',
    category: 'HFO',
    ozoneDepleteionPotential: 0,
    globalWarmingPotential: 1387,
    safety: 'A1',
    odp: 0,
    gwp: 1387,
    safety_class: 'A1',
    applications: ['Commercial Refrigeration', 'Transport Refrigeration'],
    limits: {
      min_temp_c: -93.0,
      max_temp_c: 126.9,
      critical_temp_c: 82.9,
      critical_pressure_kpa: 3900.0,
      normal_boiling_point_c: -45.0,
      minTemp: 180.0,
      maxTemp: 400.0,
      minPressure: 1000,
      maxPressure: 4000000,
      criticalTemp: 356.0,
      criticalPressure: 3900000,
      normalBoilingPoint: 228.0
    },
    coolpropSupport: 'limited',
    description: 'Low-GWP blend for commercial refrigeration (Limited CoolProp support)',
    color: '#EC4899'
  },
  {
    id: 'R717',
    name: 'R-717',
    fullName: 'Ammonia',
    category: 'Ammonia',
    ozoneDepleteionPotential: 0,
    globalWarmingPotential: 0,
    safety: 'B2L',
    odp: 0,
    gwp: 0,
    safety_class: 'B2L',
    applications: ['Industrial Refrigeration', 'Large Cold Storage', 'Ice Rinks'],
    limits: {
      min_temp_c: -77.65,
      max_temp_c: 426.85,
      critical_temp_c: 132.25,
      critical_pressure_kpa: 11333.0,
      normal_boiling_point_c: -33.33,
      minTemp: 195.495,
      maxTemp: 700.0,
      minPressure: 6090,
      maxPressure: 11333000,
      criticalTemp: 405.4,
      criticalPressure: 11333000,
      normalBoilingPoint: 239.823
    },
    coolpropSupport: 'full',
    description: 'Natural refrigerant for industrial applications',
    color: '#14B8A6'
  },
  {
    id: 'R404A',
    name: 'R-404A',
    fullName: 'HFC Blend',
    category: 'HFC',
    ozoneDepleteionPotential: 0,
    globalWarmingPotential: 3922,
    safety: 'A1',
    odp: 0,
    gwp: 3922,
    safety_class: 'A1',
    applications: ['Commercial Refrigeration', 'Transport Refrigeration', 'Low Temperature'],
    limits: {
      min_temp_c: -90.0,
      max_temp_c: 150.0,
      critical_temp_c: 72.06,
      critical_pressure_kpa: 3734.8,
      normal_boiling_point_c: -46.5,
      minTemp: 183.15,
      maxTemp: 423.15,
      minPressure: 1000,
      maxPressure: 3734800,
      criticalTemp: 345.21,
      criticalPressure: 3734800,
      normalBoilingPoint: 226.65
    },
    coolpropSupport: 'full',
    description: 'Low-temperature commercial refrigeration blend',
    color: '#F97316'
  },
  {
    id: 'R507A',
    name: 'R-507A',
    fullName: 'HFC Azeotropic Blend',
    category: 'HFC',
    ozoneDepleteionPotential: 0,
    globalWarmingPotential: 3985,
    safety: 'A1',
    odp: 0,
    gwp: 3985,
    safety_class: 'A1',
    applications: ['Commercial Refrigeration', 'Transport Refrigeration'],
    limits: {
      min_temp_c: -85.0,
      max_temp_c: 150.0,
      critical_temp_c: 70.62,
      critical_pressure_kpa: 3704.0,
      normal_boiling_point_c: -46.7,
      minTemp: 188.15,
      maxTemp: 423.15,
      minPressure: 1000,
      maxPressure: 3704000,
      criticalTemp: 343.77,
      criticalPressure: 3704000,
      normalBoilingPoint: 226.45
    },
    coolpropSupport: 'full',
    description: 'Azeotropic blend for low-temperature applications',
    color: '#A855F7'
  },
  {
    id: 'R1234yf',
    name: 'R-1234yf',
    fullName: 'Tetrafluoropropene',
    category: 'HFO',
    ozoneDepleteionPotential: 0,
    globalWarmingPotential: 4,
    safety: 'A2L',
    odp: 0,
    gwp: 4,
    safety_class: 'A2L',
    applications: ['Automotive AC', 'Mobile Air Conditioning'],
    limits: {
      min_temp_c: -90.0,
      max_temp_c: 120.0,
      critical_temp_c: 94.7,
      critical_pressure_kpa: 3382.2,
      normal_boiling_point_c: -29.5,
      minTemp: 183.15,
      maxTemp: 393.15,
      minPressure: 1000,
      maxPressure: 3382200,
      criticalTemp: 367.85,
      criticalPressure: 3382200,
      normalBoilingPoint: 243.65
    },
    coolpropSupport: 'full',
    description: 'Low-GWP automotive refrigerant',
    color: '#06B6D4'
  },
  {
    id: 'R1234ze',
    name: 'R-1234ze(E)',
    fullName: 'Trans-1,3,3,3-Tetrafluoropropene',
    category: 'HFO',
    ozoneDepleteionPotential: 0,
    globalWarmingPotential: 6,
    safety: 'A2L',
    odp: 0,
    gwp: 6,
    safety_class: 'A2L',
    applications: ['Chillers', 'Heat Pumps', 'Foam Blowing'],
    limits: {
      min_temp_c: -80.0,
      max_temp_c: 150.0,
      critical_temp_c: 109.4,
      critical_pressure_kpa: 3636.3,
      normal_boiling_point_c: -19.0,
      minTemp: 193.15,
      maxTemp: 423.15,
      minPressure: 1000,
      maxPressure: 3636300,
      criticalTemp: 382.55,
      criticalPressure: 3636300,
      normalBoilingPoint: 254.15
    },
    coolpropSupport: 'full',
    description: 'Low-GWP refrigerant for large systems',
    color: '#84CC16'
  },
  {
    id: 'R600a',
    name: 'R-600a',
    fullName: 'Isobutane',
    category: 'Hydrocarbon',
    ozoneDepleteionPotential: 0,
    globalWarmingPotential: 3,
    safety: 'A3',
    odp: 0,
    gwp: 3,
    safety_class: 'A3',
    applications: ['Domestic Refrigeration', 'Small Commercial'],
    limits: {
      min_temp_c: -159.6,
      max_temp_c: 134.7,
      critical_temp_c: 134.7,
      critical_pressure_kpa: 3629.0,
      normal_boiling_point_c: -11.7,
      minTemp: 113.55,
      maxTemp: 407.85,
      minPressure: 100,
      maxPressure: 3629000,
      criticalTemp: 407.85,
      criticalPressure: 3629000,
      normalBoilingPoint: 261.45
    },
    coolpropSupport: 'full',
    description: 'Natural hydrocarbon for small systems',
    color: '#F59E0B'
  },
  {
    id: 'R22',
    name: 'R-22',
    fullName: 'Chlorodifluoromethane',
    category: 'HCFC',
    ozoneDepleteionPotential: 0.055,
    globalWarmingPotential: 1810,
    safety: 'A1',
    odp: 0.055,
    gwp: 1810,
    safety_class: 'A1',
    applications: ['Legacy Systems', 'Servicing Only'],
    limits: {
      min_temp_c: -157.4,
      max_temp_c: 96.1,
      critical_temp_c: 96.1,
      critical_pressure_kpa: 4990.0,
      normal_boiling_point_c: -40.8,
      minTemp: 115.75,
      maxTemp: 369.25,
      minPressure: 100,
      maxPressure: 4990000,
      criticalTemp: 369.25,
      criticalPressure: 4990000,
      normalBoilingPoint: 232.35
    },
    coolpropSupport: 'full',
    description: 'Legacy HCFC refrigerant (being phased out)',
    color: '#DC2626'
  },
  {
    id: 'R407C',
    name: 'R-407C',
    fullName: 'HFC Blend',
    category: 'HFC',
    ozoneDepleteionPotential: 0,
    globalWarmingPotential: 1774,
    safety: 'A1',
    odp: 0,
    gwp: 1774,
    safety_class: 'A1',
    applications: ['Air Conditioning', 'Heat Pumps', 'Medium Temperature'],
    limits: {
      min_temp_c: -80.0,
      max_temp_c: 150.0,
      critical_temp_c: 86.7,
      critical_pressure_kpa: 4631.7,
      normal_boiling_point_c: -43.8,
      minTemp: 193.15,
      maxTemp: 423.15,
      minPressure: 1000,
      maxPressure: 4631700,
      criticalTemp: 359.85,
      criticalPressure: 4631700,
      normalBoilingPoint: 229.35
    },
    coolpropSupport: 'full',
    description: 'R-22 replacement blend for air conditioning',
    color: '#7C3AED'
  }
];

export function getRefrigerantById(id: string): RefrigerantProperties | undefined {
  return REFRIGERANT_DATABASE.find(ref => ref.id === id);
}

export function validateOperatingConditions(
  refrigerantId: string,
  tempC: number,
  quality?: number
): { valid: boolean; warnings: string[]; errors: string[] } {
  const refrigerant = getRefrigerantById(refrigerantId);
  if (!refrigerant) {
    return {
      valid: false,
      warnings: [],
      errors: [`Unknown refrigerant: ${refrigerantId}`]
    };
  }

  const tempK = tempC + 273.15;
  const warnings: string[] = [];
  const errors: string[] = [];

  // Check temperature limits
  if (tempK < refrigerant.limits.minTemp) {
    errors.push(`Temperature ${tempC}°C (${tempK.toFixed(2)}K) is below minimum limit ${(refrigerant.limits.minTemp - 273.15).toFixed(2)}°C (${refrigerant.limits.minTemp.toFixed(2)}K)`);
  }

  if (tempK > refrigerant.limits.maxTemp) {
    errors.push(`Temperature ${tempC}°C (${tempK.toFixed(2)}K) is above maximum limit ${(refrigerant.limits.maxTemp - 273.15).toFixed(2)}°C (${refrigerant.limits.maxTemp.toFixed(2)}K)`);
  }

  // Special handling for CO2 (R744)
  if (refrigerantId === 'R744') {
    if (tempK > refrigerant.limits.criticalTemp && quality !== undefined) {
      warnings.push(`R-744 (CO₂) above critical temperature ${(refrigerant.limits.criticalTemp - 273.15).toFixed(2)}°C. Operating in transcritical mode.`);
    }
  }

  // CoolProp support warnings
  if (refrigerant.coolpropSupport === 'limited') {
    warnings.push(`${refrigerant.name} has limited CoolProp support. Some properties may not be available.`);
  } else if (refrigerant.coolpropSupport === 'none') {
    errors.push(`${refrigerant.name} is not supported by CoolProp. Calculations may fail.`);
  }

  return {
    valid: errors.length === 0,
    warnings,
    errors
  };
}

// Cycle parameters validation function
export function validateCycleConditions(
  refrigerant: RefrigerantProperties,
  conditions: {
    evaporatorTemp: number;
    condenserTemp: number;
    superheat: number;
    subcooling: number;
  }
): string[] {
  const warnings: string[] = [];

  // Check evaporator temperature limits
  if (conditions.evaporatorTemp < refrigerant.limits.min_temp_c) {
    warnings.push(`Evaporator temperature ${conditions.evaporatorTemp}°C is below minimum limit ${refrigerant.limits.min_temp_c.toFixed(1)}°C`);
  }

  // Check condenser temperature limits
  if (conditions.condenserTemp > refrigerant.limits.max_temp_c) {
    warnings.push(`Condenser temperature ${conditions.condenserTemp}°C is above maximum limit ${refrigerant.limits.max_temp_c.toFixed(1)}°C`);
  }

  // Check if approaching critical temperature
  if (conditions.condenserTemp > (refrigerant.limits.critical_temp_c - 20)) {
    warnings.push(`Condenser temperature ${conditions.condenserTemp}°C is near critical temperature ${refrigerant.limits.critical_temp_c.toFixed(1)}°C`);
  }

  // Special handling for CO2 (R744)
  if (refrigerant.id === 'R744') {
    if (conditions.condenserTemp > refrigerant.limits.critical_temp_c) {
      warnings.push(`R-744 (CO₂) condenser above critical temperature. Operating in transcritical mode.`);
    }
  }

  // CoolProp support warnings
  if (refrigerant.coolpropSupport === 'limited') {
    warnings.push(`${refrigerant.name} has limited CoolProp support. Some properties may not be available.`);
  } else if (refrigerant.coolpropSupport === 'none') {
    warnings.push(`${refrigerant.name} is not supported by CoolProp. Calculations may fail.`);
  }

  // Check superheat and subcooling values
  if (conditions.superheat < 0) {
    warnings.push(`Negative superheat (${conditions.superheat}°C) may indicate wet compression`);
  }
  if (conditions.subcooling < 0) {
    warnings.push(`Negative subcooling (${conditions.subcooling}°C) may indicate flash gas formation`);
  }

  return warnings;
}

export function getSuggestedOperatingRange(refrigerantId: string) {
  const refrigerant = getRefrigerantById(refrigerantId);
  if (!refrigerant) return null;

  const safetyMargin = 10; // Celsius

  return {
    evaporatorTemp: {
      min: refrigerant.limits.min_temp_c + safetyMargin,
      max: refrigerant.limits.normal_boiling_point_c - safetyMargin,
      recommended: refrigerant.limits.normal_boiling_point_c - 20
    },
    condenserTemp: {
      min: refrigerant.limits.normal_boiling_point_c + safetyMargin,
      max: refrigerant.limits.critical_temp_c - safetyMargin,
      recommended: refrigerant.limits.normal_boiling_point_c + 40
    }
  };
}

// Popular refrigerants that should be shown first
export const POPULAR_REFRIGERANTS = [
  'R134a', 'R410A', 'R32', 'R290', 'R744', 'R22', 'R407C', 'R404A'
];

// Function to get refrigerants sorted by popularity
export function getRefrigerantsByPopularity(): RefrigerantProperties[] {
  const popular = POPULAR_REFRIGERANTS.map(id => getRefrigerantById(id)).filter(Boolean) as RefrigerantProperties[];
  const others = REFRIGERANT_DATABASE.filter(ref => !POPULAR_REFRIGERANTS.includes(ref.id));
  return [...popular, ...others];
}

// Function to search refrigerants
export function searchRefrigerants(query: string): RefrigerantProperties[] {
  if (!query.trim()) {
    return getRefrigerantsByPopularity();
  }

  const lowerQuery = query.toLowerCase();

  return REFRIGERANT_DATABASE.filter(ref =>
    ref.id.toLowerCase().includes(lowerQuery) ||
    ref.name.toLowerCase().includes(lowerQuery) ||
    ref.fullName.toLowerCase().includes(lowerQuery) ||
    ref.alternativeNames?.some(name => name.toLowerCase().includes(lowerQuery)) ||
    ref.applications.some(app => app.toLowerCase().includes(lowerQuery))
  ).sort((a, b) => {
    // Prioritize exact matches
    if (a.id.toLowerCase() === lowerQuery) return -1;
    if (b.id.toLowerCase() === lowerQuery) return 1;
    if (a.name.toLowerCase() === lowerQuery) return -1;
    if (b.name.toLowerCase() === lowerQuery) return 1;

    // Then prioritize popular refrigerants
    const aPopular = POPULAR_REFRIGERANTS.includes(a.id);
    const bPopular = POPULAR_REFRIGERANTS.includes(b.id);
    if (aPopular && !bPopular) return -1;
    if (!aPopular && bPopular) return 1;

    return 0;
  });
}
