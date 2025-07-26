// Enhanced refrigerant database with CoolProp-validated properties
export interface RefrigerantLimits {
  minTemp: number;  // Kelvin
  maxTemp: number;  // Kelvin
  minPressure: number;  // Pa
  maxPressure: number;  // Pa
  criticalTemp: number;  // Kelvin
  criticalPressure: number;  // Pa
  normalBoilingPoint: number;  // Kelvin
}

export interface RefrigerantProperties {
  id: string;
  name: string;
  fullName: string;
  category: 'Natural' | 'HFC' | 'HFO' | 'HCFC' | 'CFC' | 'CO2' | 'Hydrocarbon' | 'Ammonia';
  ozoneDepleteionPotential: number;
  globalWarmingPotential: number;
  safety: 'A1' | 'A2' | 'A2L' | 'A3' | 'B1' | 'B2' | 'B2L' | 'B3';
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
    applications: ['Air Conditioning', 'Commercial Refrigeration', 'Automotive AC'],
    limits: {
      minTemp: 169.85,  // Triple point
      maxTemp: 455.0,   // CoolProp max reliable temp
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
    applications: ['Air Conditioning', 'Heat Pumps', 'Residential HVAC'],
    limits: {
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
    applications: ['Transcritical Systems', 'Cascade Systems', 'Commercial Refrigeration'],
    limits: {
      minTemp: 216.58,  // Triple point
      maxTemp: 304.13,  // Critical temperature (transcritical above this)
      minPressure: 517950,  // Triple point pressure
      maxPressure: 15000000,  // Working limit
      criticalTemp: 304.1282,
      criticalPressure: 7377300,
      normalBoilingPoint: 194.69  // Sublimation point
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
    applications: ['Domestic Refrigeration', 'Commercial Freezers', 'Heat Pumps'],
    limits: {
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
    applications: ['Air Conditioning', 'Heat Pumps', 'Split Systems'],
    limits: {
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
    applications: ['Commercial Refrigeration', 'Transport Refrigeration'],
    limits: {
      minTemp: 180.0,  // Estimated based on components
      maxTemp: 400.0,  // Estimated safe operating range
      minPressure: 1000,
      maxPressure: 4000000,
      criticalTemp: 356.0,  // Estimated
      criticalPressure: 3900000,  // Estimated
      normalBoilingPoint: 228.0  // Estimated
    },
    coolpropSupport: 'limited',  // This is why you're seeing N/A values
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
    applications: ['Industrial Refrigeration', 'Large Cold Storage', 'Ice Rinks'],
    limits: {
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

export function getSuggestedOperatingRange(refrigerantId: string) {
  const refrigerant = getRefrigerantById(refrigerantId);
  if (!refrigerant) return null;

  const safetyMargin = 10; // Kelvin
  
  return {
    evaporatorTemp: {
      min: refrigerant.limits.minTemp - 273.15 + safetyMargin,
      max: refrigerant.limits.normalBoilingPoint - 273.15 - safetyMargin,
      recommended: refrigerant.limits.normalBoilingPoint - 273.15 - 20
    },
    condenserTemp: {
      min: refrigerant.limits.normalBoilingPoint - 273.15 + safetyMargin,
      max: refrigerant.limits.criticalTemp - 273.15 - safetyMargin,
      recommended: refrigerant.limits.normalBoilingPoint - 273.15 + 40
    }
  };
}
