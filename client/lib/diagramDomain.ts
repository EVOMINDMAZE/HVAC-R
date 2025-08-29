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
  const p = prop.toLowerCase();

  // helper to push multiple alternatives
  const push = (...names: string[]) => names.forEach((n) => candidates.push(n));

  switch (p) {
    case 'enthalpy':
      push('enthalpy', 'enthalpy_kj_kg', 'enthalpy_kj/kg', 'h', 'h_kj_kg', 'h_kj/kg');
      break;
    case 'pressure':
      push(
        'pressure',
        'pressure_kpa',
        'pressure_pa',
        'p',
        'press_kpa',
        'p_kpa',
        'p_pa',
      );
      break;
    case 'entropy':
      push('entropy', 'entropy_kj_kgk', 'entropy_kj_kg', 's', 's_kj_kg_k');
      break;
    case 'temperature':
      push('temperature', 'temperature_c', 'temp_c', 't', 'temp');
      break;
    case 'specificvolume':
    case 'specific_volume':
      push(
        'specificVolume',
        'specific_volume',
        'specific_volume_m3_kg',
        'specific_volume_m3/kg',
        'v',
        'specificVolume_m3_kg',
      );
      break;
    default:
      push(prop, prop.toLowerCase(), prop.replace(/-/g, '_'));
  }

  for (const k of candidates) {
    const v = point[k];
    if (v !== undefined && v !== null && !isNaN(Number(v))) return Number(v);
  }
  return null;
}

// "Nice" number helper to round tick steps to human-friendly values
function niceStep(range: number, ticks: number) {
  if (range <= 0 || !isFinite(range)) return 1;
  const rawStep = range / ticks;
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const norm = rawStep / mag; // between 1 and 10
  let nice = 1;
  if (norm >= 7.5) nice = 10;
  else if (norm >= 3.5) nice = 5;
  else if (norm >= 1.5) nice = 2;
  else nice = 1;
  return nice * mag;
}

// Create an array of ticks from min to max using a nice step
function makeTicks(min: number, max: number, ticks = 6) {
  const range = max - min;
  if (!isFinite(range) || range === 0) {
    const centre = Number.isFinite(min) ? min : 0;
    const step = 1;
    const out: number[] = [];
    for (let i = -Math.floor(ticks / 2); i <= Math.floor(ticks / 2); i++) {
      out.push(Number((centre + i * step).toFixed(6)));
    }
    return out;
  }
  const step = niceStep(range, ticks);
  // compute first tick <= min that is multiple of step
  const first = Math.floor(min / step) * step;
  // compute last tick >= max
  const last = Math.ceil(max / step) * step;
  const out: number[] = [];
  for (let x = first; x <= last + step / 2; x = Number((x + step).toFixed(12))) {
    out.push(Number(x));
    if (out.length > 500) break; // safety
  }
  return out;
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
      const tv = dome.tv_diagram || dome.tv || tv || null;
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

  // padding at least some sensible absolute amount for large ranges
  const xPad = Math.max(xRange * paddingFrac, xRange > 1000 ? 50 : xRange * 0.02);
  const yPad = Math.max(yRange * paddingFrac, yRange > 1000 ? 50 : yRange * 0.02);

  const xMinP = xMin - xPad;
  const xMaxP = xMax + xPad;
  const yMinP = yMin - yPad;
  const yMaxP = yMax + yPad;

  // Generate nice ticks using helper
  const xTicks = makeTicks(xMinP, xMaxP, ticks);
  const yTicks = makeTicks(yMinP, yMaxP, ticks);

  return {
    xMin: xMinP,
    xMax: xMaxP,
    yMin: yMinP,
    yMax: yMaxP,
    xTicks,
    yTicks,
  };
}
