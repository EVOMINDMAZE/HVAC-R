export type DiagramType = 'P-h' | 'T-s' | 'P-v' | 'T-v';

type DomainResult = {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  xTicks: number[];
  yTicks: number[];
};

// Resolve common property name variants
export function resolveValue(point: any, prop: string): number | null {
  if (!point) return null;
  const candidates: string[] = [];
  switch (prop) {
    case 'enthalpy':
      candidates.push('enthalpy', 'enthalpy_kj_kg', 'h', 'h_kj_kg');
      break;
    case 'pressure':
      candidates.push('pressure', 'pressure_kpa', 'p', 'press_kpa');
      break;
    case 'entropy':
      candidates.push('entropy', 'entropy_kj_kgk', 'entropy_kj_kg', 's');
      break;
    case 'temperature':
      candidates.push('temperature', 'temperature_c', 't', 'temp_c');
      break;
    case 'specificVolume':
    case 'specific_volume':
      candidates.push('specificVolume', 'specific_volume', 'specific_volume_m3_kg', 'v', 'specificVolume_m3_kg');
      break;
    default:
      candidates.push(prop);
  }
  for (const k of candidates) {
    const v = point[k];
    if (v !== undefined && v !== null && !isNaN(Number(v))) return Number(v);
  }
  return null;
}

// Compute domain using saturation dome arrays when available, otherwise use cycle points
export function computeDomain(
  diagramType: DiagramType,
  cycleData: any,
  points: any[] = [],
  paddingFrac = 0.12,
  ticks = 6,
): DomainResult {
  // Try to get dome from cycleData
  const dome = (cycleData && (cycleData.saturation_dome || cycleData.saturationDome)) || null;

  let xArr: number[] = [];
  let yArr: number[] = [];

  if (dome) {
    if (diagramType === 'P-h') {
      const ph = dome.ph_diagram || dome.ph || dome['ph'] || null;
      if (ph) {
        xArr = (ph.enthalpy_kj_kg || ph.enthalpy || ph.h || []).slice();
        yArr = (ph.pressure_kpa || ph.pressure || ph.p || []).slice();
      }
    } else if (diagramType === 'T-s') {
      const ts = dome.ts_diagram || dome.ts || dome['ts'] || null;
      if (ts) {
        xArr = (ts.entropy_kj_kgk || ts.entropy_kj_kg || ts.entropy || ts.s || []).slice();
        yArr = (ts.temperature_c || ts.temperature || ts.t || []).slice();
      }
    } else if (diagramType === 'T-v') {
      const tv = dome.tv_diagram || dome.tv || dome['tv'] || null;
      if (tv) {
        xArr = (tv.specific_volume_m3_kg || tv.specific_volume || tv.v || []).slice();
        yArr = (tv.temperature_c || tv.temperature || tv.t || []).slice();
      }
    }
  }

  // Fallback to points
  if (!xArr || xArr.length === 0 || !yArr || yArr.length === 0) {
    for (const p of points || []) {
      // pick property names based on diagram
      if (diagramType === 'P-h') {
        const xv = resolveValue(p, 'enthalpy');
        const yv = resolveValue(p, 'pressure');
        if (xv !== null) xArr.push(xv);
        if (yv !== null) yArr.push(yv);
      } else if (diagramType === 'T-s') {
        const xv = resolveValue(p, 'entropy');
        const yv = resolveValue(p, 'temperature');
        if (xv !== null) xArr.push(xv);
        if (yv !== null) yArr.push(yv);
      } else if (diagramType === 'T-v' || diagramType === 'P-v') {
        const xv = resolveValue(p, 'specificVolume');
        const yv = resolveValue(p, diagramType === 'P-v' ? 'pressure' : 'temperature');
        if (xv !== null) xArr.push(xv);
        if (yv !== null) yArr.push(yv);
      }
    }
  }

  // Ensure we have something
  if (!xArr || xArr.length === 0) xArr = [0, 1];
  if (!yArr || yArr.length === 0) yArr = [0, 1];

  const xMin = Math.min(...xArr);
  const xMax = Math.max(...xArr);
  const yMin = Math.min(...yArr);
  const yMax = Math.max(...yArr);

  const xRange = xMax - xMin || 1;
  const yRange = yMax - yMin || 1;

  const xPad = Math.max(xRange * paddingFrac, xRange > 1000 ? 50 : 1);
  const yPad = Math.max(yRange * paddingFrac, yRange > 1000 ? 50 : 1);

  const xMinP = xMin - xPad;
  const xMaxP = xMax + xPad;
  const yMinP = yMin - yPad;
  const yMaxP = yMax + yPad;

  // Generate ticks
  const xTicks: number[] = [];
  for (let i = 0; i <= ticks; i++) {
    xTicks.push(xMinP + (i / ticks) * (xMaxP - xMinP));
  }
  const yTicks: number[] = [];
  for (let i = 0; i <= ticks; i++) {
    yTicks.push(yMinP + (i / ticks) * (yMaxP - yMinP));
  }

  return {
    xMin: xMinP,
    xMax: xMaxP,
    yMin: yMinP,
    yMax: yMaxP,
    xTicks,
    yTicks,
  };
}
