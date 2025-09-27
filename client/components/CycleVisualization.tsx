import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Zap, Thermometer, Gauge, BarChart3 } from "lucide-react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { computeDomain } from "@/lib/diagramDomain";

interface CyclePoint {
  id: string;
  name: string;
  temperature: number; // °C
  pressure: number; // kPa
  enthalpy: number; // kJ/kg
  entropy: number; // kJ/kg-K
  specificVolume?: number; // m³/kg
  quality?: number; // 0-1 for two-phase
  x: number; // Canvas coordinates
  y: number;
}

type DiagramType = "P-h" | "T-s" | "P-v" | "T-v";

interface DiagramConfig {
  xAxis: { property: keyof CyclePoint; label: string; unit: string };
  yAxis: { property: keyof CyclePoint; label: string; unit: string };
  name: string;
}

const DIAGRAM_CONFIGS: Record<DiagramType, DiagramConfig> = {
  "P-h": {
    xAxis: { property: "enthalpy", label: "Enthalpy", unit: "kJ/kg" },
    yAxis: { property: "pressure", label: "Pressure", unit: "kPa" },
    name: "Pressure-Enthalpy Diagram",
  },
  "T-s": {
    xAxis: { property: "entropy", label: "Entropy", unit: "kJ/kg·K" },
    yAxis: { property: "temperature", label: "Temperature", unit: "°C" },
    name: "Temperature-Entropy Diagram",
  },
  "P-v": {
    xAxis: {
      property: "specificVolume",
      label: "Specific Volume",
      unit: "m³/kg",
    },
    yAxis: { property: "pressure", label: "Pressure", unit: "kPa" },
    name: "Pressure-Volume Diagram",
  },
  "T-v": {
    xAxis: {
      property: "specificVolume",
      label: "Specific Volume",
      unit: "m³/kg",
    },
    yAxis: { property: "temperature", label: "Temperature", unit: "°C" },
    name: "Temperature-Volume Diagram",
  },
};

interface CycleVisualizationProps {
  cycleData?: {
    points: CyclePoint[];
    refrigerant: string;
    cycleType: "standard" | "cascade-low" | "cascade-high";
    saturationDome?: {
      ph_diagram: {
        enthalpy_kj_kg: number[];
        pressure_kpa: number[];
      };
      ts_diagram: {
        entropy_kj_kgk: number[];
        temperature_c: number[];
      };
      tv_diagram: {
        specific_volume_m3_kg: number[];
        temperature_c: number[];
      };
    };
  };
}

export function CycleVisualization({ cycleData }: CycleVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedPoint, setSelectedPoint] = useState<string | null>(null);
  const [diagramType, setDiagramType] = useState<DiagramType>("P-h");

  // Draggable overlay state: position in pixels relative to canvas
  const [overlayPos, setOverlayPos] = useState<{ x: number; y: number } | null>(() => {
    try {
      const raw = localStorage.getItem('cycle_performance_overlay_pos');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  });
  const draggingRef = useRef(false);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Flexible resolver to read multiple possible property names from API or local cycle data
  const resolvePointValue = (point: any, prop: string): number | null => {
    if (!point) return null;
    const candidates: string[] = [];
    switch (prop) {
      case "enthalpy":
        candidates.push("enthalpy", "enthalpy_kj_kg", "h", "h_kj_kg");
        break;
      case "pressure":
        candidates.push("pressure", "pressure_kpa", "p", "press_kpa");
        break;
      case "entropy":
        candidates.push("entropy", "entropy_kj_kgk", "entropy_kj_kg", "s");
        break;
      case "temperature":
        candidates.push("temperature", "temperature_c", "t", "temp_c");
        break;
      case "specificVolume":
      case "specific_volume":
      case "specificVolume_m3_kg":
        candidates.push("specificVolume", "specific_volume", "specific_volume_m3_kg", "v", "specificVolume_m3_kg");
        break;
      default:
        candidates.push(prop);
    }

    for (const k of candidates) {
      const v = point[k];
      if (v !== undefined && v !== null && !isNaN(Number(v))) return Number(v);
    }
    return null;
  };

  // Enhanced coordinate calculation with better thermodynamic accuracy
  const calculateCoordinates = (
    points: CyclePoint[],
    config: DiagramConfig,
    plotWidth: number,
    plotHeight: number,
  ) => {
    if (!points || points.length === 0) return points;

    console.log(
      "Calculating coordinates with enhanced algorithm for",
      diagramType,
    );

    // If saturation dome data exists, prefer it for axis ranges to match the dome scaling
    const dome = (cycleData as any)?.saturationDome || (cycleData as any)?.saturation_dome || null;
    let xValues: number[] = [];
    let yValues: number[] = [];

    if (dome) {
      // Extract dome arrays for the current diagram when available
      if (diagramType === "P-h") {
        const ph = dome.ph_diagram || dome.ph || dome['ph'] || null;
        if (ph) {
          xValues = (ph.enthalpy_kj_kg || ph.enthalpy || ph.h || []).slice();
          yValues = (ph.pressure_kpa || ph.pressure || ph.p || []).slice();
        }
      } else if (diagramType === "T-s") {
        const ts = dome.ts_diagram || dome.ts || dome['ts'] || null;
        if (ts) {
          xValues = (ts.entropy_kj_kgk || ts.entropy_kj_kg || ts.entropy || ts.s || []).slice();
          yValues = (ts.temperature_c || ts.temperature || ts.t || []).slice();
        }
      } else if (diagramType === "T-v") {
        const tv = dome.tv_diagram || dome.tv || dome['tv'] || null;
        if (tv) {
          xValues = (tv.specific_volume_m3_kg || tv.specific_volume || tv.v || []).slice();
          yValues = (tv.temperature_c || tv.temperature || tv.t || []).slice();
        }
      }
    }

    // Fallback to point-derived ranges when dome data is not present or insufficient
    if (xValues.length === 0 || yValues.length === 0) {
      points.forEach((point) => {
        const xVal = resolvePointValue(point, config.xAxis.property as string);
        const yVal = resolvePointValue(point, config.yAxis.property as string);
        if (xVal !== null) xValues.push(xVal);
        if (yVal !== null) yValues.push(yVal);
      });
    }

    console.log("X values for scaling:", xValues);
    console.log("Y values for scaling:", yValues);

    if (xValues.length >= 1 && yValues.length >= 1) {
      const xMin = Math.min(...xValues);
      const xMax = Math.max(...xValues);
      const yMin = Math.min(...yValues);
      const yMax = Math.max(...yValues);

      // Use consistent padding
      const xRange = xMax - xMin || 1;
      const yRange = yMax - yMin || 1;
      const xPadding = Math.max(xRange * 0.12, xRange > 1000 ? 50 : 1);
      const yPadding = Math.max(yRange * 0.12, yRange > 1000 ? 50 : 1);

      return points.map((point) => {
        const xVal = resolvePointValue(point, config.xAxis.property as string);
        const yVal = resolvePointValue(point, config.yAxis.property as string);

        let x: number, y: number;

        if (xVal !== null && yVal !== null) {
          x = ((xVal - xMin + xPadding) / (xRange + 2 * xPadding)) * plotWidth;
          y = plotHeight - ((yVal - yMin + yPadding) / (yRange + 2 * yPadding)) * plotHeight;
        } else {
          const fallbackPositions = getIdealizedPositions(diagramType, plotWidth, plotHeight);
          const index = parseInt(point.id) - 1;
          x = fallbackPositions[index]?.x || plotWidth / 2;
          y = fallbackPositions[index]?.y || plotHeight / 2;
        }

        return { ...point, x, y };
      });
    }

    // ultimate fallback
    const fallbackPositions = getIdealizedPositions(diagramType, plotWidth, plotHeight);
    return points.map((point, index) => ({ ...point, x: fallbackPositions[index]?.x || plotWidth / 2, y: fallbackPositions[index]?.y || plotHeight / 2 }));
  };

  // Enhanced idealized positions that reflect real thermodynamic cycles
  const getIdealizedPositions = (
    type: DiagramType,
    width: number,
    height: number,
  ) => {
    const positions: { x: number; y: number }[] = [];

    if (type === "P-h") {
      // Realistic P-h cycle with proper thermodynamic relationships
      positions.push(
        { x: width * 0.3, y: height * 0.75 }, // 1: Low P, moderate h (evaporator outlet)
        { x: width * 0.7, y: height * 0.2 }, // 2: High P, high h (compressor outlet)
        { x: width * 0.2, y: height * 0.2 }, // 3: High P, low h (condenser outlet)
        { x: width * 0.2, y: height * 0.75 }, // 4: Low P, low h (expansion outlet)
      );
    } else if (type === "T-s") {
      // Realistic T-s cycle
      positions.push(
        { x: width * 0.35, y: height * 0.8 }, // 1: Low T, moderate s
        { x: width * 0.55, y: height * 0.15 }, // 2: High T, high s
        { x: width * 0.25, y: height * 0.15 }, // 3: High T, low s
        { x: width * 0.25, y: height * 0.8 }, // 4: Low T, low s
      );
    } else {
      // P-v and T-v diagrams with realistic shapes
      positions.push(
        { x: width * 0.75, y: height * 0.7 }, // 1: Large volume, low pressure
        { x: width * 0.25, y: height * 0.3 }, // 2: Small volume, high pressure
        { x: width * 0.3, y: height * 0.3 }, // 3: Moderate volume, high pressure
        { x: width * 0.7, y: height * 0.7 }, // 4: Large volume, low pressure
      );
    }

    return positions;
  };

  // Canvas drawing with enhanced rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !cycleData) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Enable high-quality rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    drawCycle(ctx, canvas.width, canvas.height);
  }, [cycleData, selectedPoint, diagramType, overlayPos]);

  // Mouse/touch handlers to make overlay draggable
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getEventPos = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      let clientX = 0;
      let clientY = 0;
      if ((e as TouchEvent).touches && (e as TouchEvent).touches.length > 0) {
        clientX = (e as TouchEvent).touches[0].clientX;
        clientY = (e as TouchEvent).touches[0].clientY;
      } else if ((e as TouchEvent).changedTouches && (e as TouchEvent).changedTouches.length > 0) {
        clientX = (e as TouchEvent).changedTouches[0].clientX;
        clientY = (e as TouchEvent).changedTouches[0].clientY;
      } else {
        clientX = (e as MouseEvent).clientX;
        clientY = (e as MouseEvent).clientY;
      }

      // Map to canvas coordinate space (account for CSS size vs actual pixel buffer)
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
    };

    const onDown = (ev: MouseEvent | TouchEvent) => {
      const pos = getEventPos(ev);
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;

      // Determine default overlay position used by drawEngineeringOverlay when overlayPos is null
      const margin = 120;
      const plotWidth = canvasWidth - 2 * margin;
      const plotHeight = canvasHeight - 2 * margin;
      const defaultX = margin + plotWidth - 250;
      const defaultY = margin + 20;

      const overlayX = overlayPos ? overlayPos.x : defaultX;
      const overlayY = overlayPos ? overlayPos.y : defaultY;
      const overlayW = 230;
      const overlayH = 160;

      // Check if pointer is inside overlay rect
      if (pos.x >= overlayX && pos.x <= overlayX + overlayW && pos.y >= overlayY && pos.y <= overlayY + overlayH) {
        draggingRef.current = true;
        dragOffsetRef.current = { x: pos.x - overlayX, y: pos.y - overlayY };
        // change cursor
        canvas.style.cursor = 'grabbing';
        ev.preventDefault();
      }
    };

    const onMove = (ev: MouseEvent | TouchEvent) => {
      if (!draggingRef.current) return;
      const pos = getEventPos(ev);
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const overlayW = 230;
      const overlayH = 160;

      let newX = pos.x - dragOffsetRef.current.x;
      let newY = pos.y - dragOffsetRef.current.y;

      // constrain to canvas
      newX = Math.max(0, Math.min(newX, canvasWidth - overlayW));
      newY = Math.max(0, Math.min(newY, canvasHeight - overlayH));

      setOverlayPos({ x: newX, y: newY });
    };

    const onUp = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      // persist position
      try {
        if (overlayPos) localStorage.setItem('cycle_performance_overlay_pos', JSON.stringify(overlayPos));
      } catch (e) {}
      canvas.style.cursor = 'default';
    };

    // Attach listeners
    canvas.addEventListener('mousedown', onDown as any);
    canvas.addEventListener('touchstart', onDown as any, { passive: false });
    window.addEventListener('mousemove', onMove as any);
    window.addEventListener('touchmove', onMove as any, { passive: false });
    window.addEventListener('mouseup', onUp as any);
    window.addEventListener('touchend', onUp as any);

    return () => {
      canvas.removeEventListener('mousedown', onDown as any);
      canvas.removeEventListener('touchstart', onDown as any);
      window.removeEventListener('mousemove', onMove as any);
      window.removeEventListener('touchmove', onMove as any);
      window.removeEventListener('mouseup', onUp as any);
      window.removeEventListener('touchend', onUp as any);
    };
  }, [overlayPos, cycleData]);

  const drawCycle = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
  ) => {
    // Clear canvas with gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#fafafa");
    gradient.addColorStop(1, "#f8fafc");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    if (!cycleData?.points || cycleData.points.length < 4) {
      drawPlaceholder(ctx, width, height);
      return;
    }

    // Use shared domain calculation so scales match Chart Package
    const config = DIAGRAM_CONFIGS[diagramType];
    const domain = computeDomain(diagramType, cycleData || {}, cycleData?.points || []);

    // Set up coordinate system with larger margins for higher resolution
    const margin = 120;
    const plotWidth = width - 2 * margin;
    const plotHeight = height - 2 * margin;

    // Calculate proper coordinates based on thermodynamic properties and shared domain
    const pointsWithCoords = calculateCoordinates(
      cycleData.points,
      config,
      plotWidth,
      plotHeight,
    );

    // Draw axes and grid using domain ticks
    drawAxes(ctx, margin, plotWidth, plotHeight, config, pointsWithCoords);

    // Draw saturation dome using same domain
    drawSaturationDome(ctx, margin, plotWidth, plotHeight, config);

    // Draw cycle lines (animation removed)
    drawCycleLines(ctx, pointsWithCoords, margin, 100);

    // Draw points
    drawCyclePoints(ctx, pointsWithCoords, margin);

    // Draw component labels
    drawComponentLabels(ctx, pointsWithCoords, margin);

    // Draw enhanced engineering data overlay
    drawEngineeringOverlay(
      ctx,
      pointsWithCoords,
      margin,
      plotWidth,
      plotHeight,
    );
  };

  const drawPlaceholder = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
  ) => {
    ctx.fillStyle = "#f3f4f6";
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "#6b7280";
    ctx.font = "16px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
      "Run calculation to see cycle visualization",
      width / 2,
      height / 2,
    );
  };

  const drawGrid = (
    ctx: CanvasRenderingContext2D,
    margin: number,
    plotWidth: number,
    plotHeight: number,
  ) => {
    // Major grid lines
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 1;
    ctx.setLineDash([]);

    const gridLines = 10;

    // Vertical grid lines
    for (let i = 0; i <= gridLines; i++) {
      const x = margin + (plotWidth * i) / gridLines;
      ctx.beginPath();
      ctx.moveTo(x, margin);
      ctx.lineTo(x, margin + plotHeight);
      ctx.stroke();
    }

    // Horizontal grid lines
    for (let i = 0; i <= gridLines; i++) {
      const y = margin + (plotHeight * i) / gridLines;
      ctx.beginPath();
      ctx.moveTo(margin, y);
      ctx.lineTo(margin + plotWidth, y);
      ctx.stroke();
    }

    // Minor grid lines
    ctx.strokeStyle = "#f3f4f6";
    ctx.lineWidth = 0.5;

    const minorGridLines = 50;

    // Vertical minor grid
    for (let i = 0; i <= minorGridLines; i++) {
      const x = margin + (plotWidth * i) / minorGridLines;
      ctx.beginPath();
      ctx.moveTo(x, margin);
      ctx.lineTo(x, margin + plotHeight);
      ctx.stroke();
    }

    // Horizontal minor grid
    for (let i = 0; i <= minorGridLines; i++) {
      const y = margin + (plotHeight * i) / minorGridLines;
      ctx.beginPath();
      ctx.moveTo(margin, y);
      ctx.lineTo(margin + plotWidth, y);
      ctx.stroke();
    }
  };

  const drawAxes = (
    ctx: CanvasRenderingContext2D,
    margin: number,
    plotWidth: number,
    plotHeight: number,
    config: DiagramConfig,
    pointsWithCoords: CyclePoint[],
  ) => {
    // Draw grid first
    drawGrid(ctx, margin, plotWidth, plotHeight);

    // Main axes with enhanced styling
    ctx.strokeStyle = "#1f2937";
    ctx.lineWidth = 3;
    ctx.setLineDash([]);

    // X-axis
    ctx.beginPath();
    ctx.moveTo(margin, margin + plotHeight);
    ctx.lineTo(margin + plotWidth, margin + plotHeight);
    ctx.stroke();

    // Y-axis
    ctx.beginPath();
    ctx.moveTo(margin, margin);
    ctx.lineTo(margin, margin + plotHeight);
    ctx.stroke();

    // Enhanced axis labels
    ctx.fillStyle = "#1f2937";
    ctx.font =
      "bold 16px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.textAlign = "center";

    // X-axis label
    ctx.fillText(
      `${config.xAxis.label} (${config.xAxis.unit})`,
      margin + plotWidth / 2,
      margin + plotHeight + 50,
    );

    // Y-axis label
    ctx.save();
    ctx.translate(25, margin + plotHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`${config.yAxis.label} (${config.yAxis.unit})`, 0, 0);
    ctx.restore();

    // Add axis tick marks and values with real thermodynamic data
    drawAxisTicks(ctx, margin, plotWidth, plotHeight, config, pointsWithCoords);
  };

  const drawAxisTicks = (
    ctx: CanvasRenderingContext2D,
    margin: number,
    plotWidth: number,
    plotHeight: number,
    config: DiagramConfig,
    points: CyclePoint[],
  ) => {
    ctx.strokeStyle = "#374151";
    ctx.lineWidth = 2;
    ctx.fillStyle = "#374151";
    ctx.font = "bold 14px 'Inter', sans-serif";
    ctx.textAlign = "center";

    // Use shared computeDomain for consistent axis ranges and ticks
    const domain = computeDomain(diagramType, (cycleData as any) || {}, points || [], 0.12, 6);

    const xMinPadded = domain.xMin;
    const xMaxPadded = domain.xMax;
    const yMinPadded = domain.yMin;
    const yMaxPadded = domain.yMax;

    const xTicks = domain.xTicks;
    const yTicks = domain.yTicks;

    // X-axis ticks with real values
    for (let i = 0; i < xTicks.length; i++) {
      const txVal = xTicks[i];
      const x = margin + ((txVal - xMinPadded) / (xMaxPadded - xMinPadded || 1)) * plotWidth;

      ctx.beginPath();
      ctx.moveTo(x, margin + plotHeight);
      ctx.lineTo(x, margin + plotHeight + 10);
      ctx.stroke();

      // Format value based on magnitude and type
      let formattedValue: string;
      if (config.xAxis.property === 'pressure') {
        formattedValue = txVal > 1000 ? (txVal / 1000).toFixed(1) + 'k' : txVal.toFixed(0);
      } else if (config.xAxis.property === 'specificVolume') {
        formattedValue = txVal.toFixed(4);
      } else {
        formattedValue = txVal.toFixed(1);
      }

      ctx.fillText(formattedValue, x, margin + plotHeight + 28);
    }

    // Y-axis ticks with real values
    ctx.textAlign = 'right';
    for (let i = 0; i < yTicks.length; i++) {
      const tyVal = yTicks[i];
      const y = margin + plotHeight - ((tyVal - yMinPadded) / (yMaxPadded - yMinPadded || 1)) * plotHeight;

      ctx.beginPath();
      ctx.moveTo(margin - 10, y);
      ctx.lineTo(margin, y);
      ctx.stroke();

      let formattedValue: string;
      if (config.yAxis.property === 'pressure') {
        formattedValue = tyVal > 1000 ? (tyVal / 1000).toFixed(1) + 'k' : tyVal.toFixed(0);
      } else if (config.yAxis.property === 'temperature') {
        formattedValue = tyVal.toFixed(0);
      } else {
        formattedValue = tyVal.toFixed(1);
      }

      ctx.fillText(formattedValue, margin - 15, y + 5);
    }
  };

  const drawSaturationDome = (
    ctx: CanvasRenderingContext2D,
    margin: number,
    plotWidth: number,
    plotHeight: number,
    config: DiagramConfig,
  ) => {
    // Accept either camelCase or snake_case saturation dome property names
    const dome = (cycleData as any).saturationDome || (cycleData as any).saturation_dome || null;
    if (!dome) {
      // Fallback to simplified dome if no data available
      const centerX = margin + plotWidth * 0.35;
      const centerY = margin + plotHeight * 0.6;
      const radiusX = plotWidth * 0.3;
      const radiusY = plotHeight * 0.4;

      ctx.strokeStyle = "rgba(59, 130, 246, 0.3)";
      ctx.lineWidth = 1;
      ctx.setLineDash([8, 4]);
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI);
      ctx.stroke();
      ctx.setLineDash([]);
      return;
    }

    // Draw real saturation dome using API data, accept multiple key variants
    let xData: number[] = [];
    let yData: number[] = [];

    if (diagramType === "P-h") {
      const ph = dome.ph_diagram || dome.ph || dome['ph'] || null;
      if (ph) {
        xData = ph.enthalpy_kj_kg || ph.enthalpy || ph.h || [];
        yData = ph.pressure_kpa || ph.pressure || ph.p || [];
      }
    } else if (diagramType === "T-s") {
      const ts = dome.ts_diagram || dome.ts || dome['ts'] || null;
      if (ts) {
        xData = ts.entropy_kj_kgk || ts.entropy_kj_kg || ts.entropy || ts.s || [];
        yData = ts.temperature_c || ts.temperature || ts.t || [];
      }
    } else if (diagramType === "T-v") {
      const tv = dome.tv_diagram || dome.tv || dome['tv'] || null;
      if (tv) {
        xData = tv.specific_volume_m3_kg || tv.specific_volume || tv.v || [];
        yData = tv.temperature_c || tv.temperature || tv.t || [];
      }
    }

    if (xData.length > 0 && yData.length > 0) {
      // Use shared domain so dome aligns with axes
      const domain = computeDomain(diagramType, (cycleData as any) || {}, cycleData?.points || [], 0.12, 6);
      const xMin = domain.xMin;
      const xMax = domain.xMax;
      const yMin = domain.yMin;
      const yMax = domain.yMax;

      // Draw saturation dome curve
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.6)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 2]);
      ctx.beginPath();

      for (let i = 0; i < Math.min(xData.length, yData.length); i++) {
        const x = margin + ((xData[i] - xMin) / (xMax - xMin || 1)) * plotWidth;
        const y = margin + plotHeight - ((yData[i] - yMin) / (yMax - yMin || 1)) * plotHeight;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = 'rgba(59, 130, 246, 0.8)';
      ctx.font = "12px 'Inter', sans-serif";
      ctx.textAlign = 'center';
      ctx.fillText('Saturation Dome', margin + plotWidth * 0.8, margin + 30);
    } else {
      console.log(`No saturation dome data for ${diagramType}`);
    }
  };

  const drawCycleLines = (
    ctx: CanvasRenderingContext2D,
    points: CyclePoint[],
    margin: number,
    progress: number,
  ) => {
    if (points.length < 4) return;

    const colors = ["#dc2626", "#2563eb", "#059669", "#d97706"];
    const processNames = [
      "Compression",
      "Condensation",
      "Expansion",
      "Evaporation",
    ];
    const lineWidths = [5, 5, 5, 5];

    // Enable anti-aliasing for smooth lines
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    for (let i = 0; i < 4; i++) {
      const startPoint = points[i];
      const endPoint = points[(i + 1) % 4];
      const color = colors[i];

      // Calculate drawing progress for this line
      const lineProgress = Math.max(0, Math.min(1, (progress - i * 25) / 25));

      if (lineProgress > 0) {
        // Create gradient for the line
        const gradient = ctx.createLinearGradient(
          margin + startPoint.x,
          margin + startPoint.y,
          margin + endPoint.x,
          margin + endPoint.y,
        );
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, color + "cc"); // Add transparency

        // Draw shadow first
        ctx.shadowColor = color + "40";
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        ctx.strokeStyle = gradient;
        ctx.lineWidth = lineWidths[i];
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        ctx.beginPath();
        ctx.moveTo(margin + startPoint.x, margin + startPoint.y);

        // Draw smooth curves instead of straight lines
        const deltaX = endPoint.x - startPoint.x;
        const deltaY = endPoint.y - startPoint.y;
        const currentX = startPoint.x + deltaX * lineProgress;
        const currentY = startPoint.y + deltaY * lineProgress;

        // Add bezier curves for smooth transitions
        const controlX1 = startPoint.x + deltaX * 0.3;
        const controlY1 = startPoint.y;
        const controlX2 = startPoint.x + deltaX * 0.7;
        const controlY2 = endPoint.y;

        if (lineProgress === 1) {
          ctx.bezierCurveTo(
            margin + controlX1,
            margin + controlY1,
            margin + controlX2,
            margin + controlY2,
            margin + endPoint.x,
            margin + endPoint.y,
          );
        } else {
          ctx.lineTo(margin + currentX, margin + currentY);
        }

        ctx.stroke();

        // Reset shadow
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // Animated arrows are only shown when progress < 100 (animation disabled by default)
        if (progress < 100 && lineProgress < 1 && lineProgress > 0.1) {
          drawEnhancedArrow(
            ctx,
            margin + currentX,
            margin + currentY,
            Math.atan2(deltaY, deltaX),
            color,
            i,
          );
        }

        // Add process label
        if (lineProgress > 0.5) {
          drawProcessLabel(
            ctx,
            startPoint,
            endPoint,
            margin,
            processNames[i],
            color,
          );
        }
      }
    }
  };

  const drawEnhancedArrow = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    angle: number,
    color: string,
    processIndex: number,
  ) => {
    const size = 12;
    const pulseScale = 1 + 0.3 * Math.sin(Date.now() * 0.005 + processIndex); // Pulsing effect

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(pulseScale, pulseScale);

    // Arrow shadow
    ctx.shadowColor = color + "60";
    ctx.shadowBlur = 6;
    ctx.fillStyle = color;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-size, -size / 2);
    ctx.lineTo(-size * 0.6, 0);
    ctx.lineTo(-size, size / 2);
    ctx.closePath();
    ctx.fill();

    // Arrow highlight
    ctx.shadowColor = "transparent";
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.moveTo(-2, 0);
    ctx.lineTo(-size * 0.7, -size / 4);
    ctx.lineTo(-size * 0.7, size / 4);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  };

  const drawProcessLabel = (
    ctx: CanvasRenderingContext2D,
    startPoint: CyclePoint,
    endPoint: CyclePoint,
    margin: number,
    processName: string,
    color: string,
  ) => {
    const midX = margin + (startPoint.x + endPoint.x) / 2;
    const midY = margin + (startPoint.y + endPoint.y) / 2;

    // Label background
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;

    const padding = 8;
    ctx.font = "bold 12px 'Inter', sans-serif";
    const textWidth = ctx.measureText(processName).width;

    ctx.beginPath();
    ctx.roundRect(
      midX - textWidth / 2 - padding,
      midY - 10 - padding,
      textWidth + 2 * padding,
      20 + 2 * padding,
      4,
    );
    ctx.fill();
    ctx.stroke();

    // Label text
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.fillText(processName, midX, midY + 4);
  };

  const drawCyclePoints = (
    ctx: CanvasRenderingContext2D,
    points: CyclePoint[],
    margin: number,
  ) => {
    const pointColors = ["#dc2626", "#2563eb", "#059669", "#d97706"];
    const pointNames = ["1", "2", "3", "4"];

    points.forEach((point, index) => {
      const x = margin + point.x;
      const y = margin + point.y;
      const isSelected = selectedPoint === point.id;
      const color = pointColors[index];
      const radius = isSelected ? 12 : 10;

      // Point shadow
      ctx.shadowColor = color + "40";
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      // Outer ring
      ctx.fillStyle = "white";
      ctx.beginPath();
      ctx.arc(x, y, radius + 2, 0, 2 * Math.PI);
      ctx.fill();

      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.stroke();

      // Inner circle
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, radius - 2, 0, 2 * Math.PI);
      ctx.fill();

      // Reset shadow
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // Point number
      ctx.fillStyle = "white";
      ctx.font = "bold 14px 'Inter', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(pointNames[index], x, y + 5);

      // Point label with background
      const labelY = y - radius - 20;
      const labelText = point.name;

      ctx.font = "12px 'Inter', sans-serif";
      const textWidth = ctx.measureText(labelText).width;

      // Label background
      ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;

      ctx.beginPath();
      ctx.roundRect(x - textWidth / 2 - 6, labelY - 8, textWidth + 12, 16, 4);
      ctx.fill();
      ctx.stroke();

      // Label text
      ctx.fillStyle = color;
      ctx.textAlign = "center";
      ctx.fillText(labelText, x, labelY + 4);

      // Animated pulse effect for selected point
      if (isSelected) {
        const pulseRadius = radius + 5 + 3 * Math.sin(Date.now() * 0.008);
        ctx.strokeStyle = color + "60";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, pulseRadius, 0, 2 * Math.PI);
        ctx.stroke();
      }
    });
  };

  const drawComponentLabels = (
    ctx: CanvasRenderingContext2D,
    points: CyclePoint[],
    margin: number,
  ) => {
    const components = [
      {
        name: "Compressor",
        icon: "⚙️",
        position: { x: 0.15, y: 0.7 },
        color: "#dc2626",
      },
      {
        name: "Condenser",
        icon: "🌡��",
        position: { x: 0.5, y: 0.1 },
        color: "#2563eb",
      },
      {
        name: "Expansion Valve",
        icon: "🔻",
        position: { x: 0.85, y: 0.3 },
        color: "#059669",
      },
      {
        name: "Evaporator",
        icon: "❄️",
        position: { x: 0.5, y: 0.85 },
        color: "#d97706",
      },
    ];

    components.forEach((comp) => {
      const x =
        margin + comp.position.x * (canvasRef.current!.width - 2 * margin);
      const y =
        margin + comp.position.y * (canvasRef.current!.height - 2 * margin);

      // Component background
      ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
      ctx.strokeStyle = comp.color;
      ctx.lineWidth = 2;

      const text = `${comp.icon} ${comp.name}`;
      ctx.font = "bold 14px 'Inter', sans-serif";
      const textWidth = ctx.measureText(text).width;

      ctx.beginPath();
      ctx.roundRect(x - textWidth / 2 - 8, y - 10, textWidth + 16, 20, 6);
      ctx.fill();
      ctx.stroke();

      // Component text
      ctx.fillStyle = comp.color;
      ctx.textAlign = "center";
      ctx.fillText(text, x, y + 5);
    });
  };

  const drawEngineeringOverlay = (
    ctx: CanvasRenderingContext2D,
    points: CyclePoint[],
    margin: number,
    plotWidth: number,
    plotHeight: number,
  ) => {
    if (!cycleData || points.length < 4) return;

    // Calculate cycle performance metrics
    const point1 = points[0]; // Evaporator outlet
    const point2 = points[1]; // Compressor outlet
    const point3 = points[2]; // Condenser outlet
    const point4 = points[3]; // Expansion outlet

    // Engineering calculations (guarded)
    const safeNum = (v: any) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };

    const p1 = safeNum(point1.pressure);
    const p2 = safeNum(point2.pressure);
    const t1 = safeNum(point1.temperature);
    const t2 = safeNum(point2.temperature);
    const h1 = safeNum(point1.enthalpy);
    const h2 = safeNum(point2.enthalpy);
    const h3 = safeNum(point3.enthalpy);
    const h4 = safeNum(point4.enthalpy);

    if (p1 === null || p2 === null || t1 === null || t2 === null || h1 === null || h2 === null || h3 === null || h4 === null) {
      // Missing data, skip overlay to avoid exceptions
      return;
    }

    const compressionRatio = p2 / p1;
    const temperatureLift = t2 - t1;
    const refrigerationEffect = h1 - h4;
    const compressionWork = h2 - h1;
    const theoreticalCOP = refrigerationEffect / compressionWork;

    // Draw performance metrics overlay with enhanced styling
    const defaultOverlayX = margin + plotWidth - 250;
    const defaultOverlayY = margin + 20;
    const overlayX = overlayPos ? overlayPos.x : defaultOverlayX;
    const overlayY = overlayPos ? overlayPos.y : defaultOverlayY;

    // Background with gradient
    const gradient = ctx.createLinearGradient(
      overlayX,
      overlayY,
      overlayX,
      overlayY + 160,
    );
    gradient.addColorStop(0, "rgba(255, 255, 255, 0.98)");
    gradient.addColorStop(1, "rgba(248, 250, 252, 0.95)");

    ctx.fillStyle = gradient;
    ctx.strokeStyle = "rgba(59, 130, 246, 0.6)";
    ctx.lineWidth = 2;
    ctx.shadowColor = "rgba(0, 0, 0, 0.1)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    ctx.beginPath();
    ctx.roundRect(overlayX, overlayY, 230, 160, 12);
    ctx.fill();
    ctx.stroke();

    // Draw draggable handle (small grip) at top-right
    const handleW = 28;
    const handleH = 18;
    const handleX = overlayX + 230 - handleW - 8;
    const handleY = overlayY + 8;
    ctx.fillStyle = 'rgba(31,41,55,0.06)';
    ctx.roundRect(handleX, handleY, handleW, handleH, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(31,41,55,0.08)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw little grip lines
    ctx.strokeStyle = 'rgba(31,41,55,0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(handleX + 6, handleY + 6);
    ctx.lineTo(handleX + 22, handleY + 6);
    ctx.moveTo(handleX + 6, handleY + 10);
    ctx.lineTo(handleX + 22, handleY + 10);
    ctx.stroke();

    // Reset shadow
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Title with icon
    ctx.fillStyle = "#1f2937";
    ctx.font = "bold 16px 'Inter', sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("📊 Cycle Performance", overlayX + 12, overlayY + 25);

    // Separator line
    ctx.strokeStyle = "rgba(59, 130, 246, 0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(overlayX + 12, overlayY + 35);
    ctx.lineTo(overlayX + 218, overlayY + 35);
    ctx.stroke();

    // Enhanced metrics with better formatting
    ctx.font = "13px 'Inter', sans-serif";
    const metrics = [
      {
        label: "Compression Ratio",
        value: compressionRatio.toFixed(2),
        unit: "",
        color: "#dc2626",
      },
      {
        label: "Temperature Lift",
        value: temperatureLift.toFixed(1),
        unit: "°C",
        color: "#ea580c",
      },
      {
        label: "Refrigeration Effect",
        value: refrigerationEffect.toFixed(1),
        unit: "kJ/kg",
        color: "#059669",
      },
      {
        label: "Compression Work",
        value: compressionWork.toFixed(1),
        unit: "kJ/kg",
        color: "#7c3aed",
      },
      {
        label: "Theoretical COP",
        value: theoreticalCOP.toFixed(2),
        unit: "",
        color: "#2563eb",
      },
    ];

    metrics.forEach((metric, index) => {
      const y = overlayY + 55 + index * 20;

      // Label
      ctx.fillStyle = "#374151";
      ctx.textAlign = "left";
      ctx.fillText(metric.label + ":", overlayX + 12, y);

      // Value with color
      ctx.fillStyle = metric.color;
      ctx.font = "bold 13px 'Inter', sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(`${metric.value} ${metric.unit}`, overlayX + 218, y);
      ctx.font = "13px 'Inter', sans-serif";
    });

    // Draw process arrows with values
    drawProcessArrows(ctx, points, margin);

    // Add thermodynamic property annotations
    drawPropertyAnnotations(ctx, points, margin);
  };

  const drawProcessArrows = (
    ctx: CanvasRenderingContext2D,
    points: CyclePoint[],
    margin: number,
  ) => {
    if (points.length < 4) return;

    const safeNum = (v: any) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };

    const processes = [
      {
        from: points[0],
        to: points[1],
        label: (() => {
          const t1 = safeNum(points[0].temperature);
          const t2 = safeNum(points[1].temperature);
          return t1 !== null && t2 !== null ? `ΔT: ${(t2 - t1).toFixed(1)}°C` : "ΔT: N/A";
        })(),
        color: "#dc2626",
      },
      {
        from: points[1],
        to: points[2],
        label: (() => {
          const p1 = safeNum(points[1].pressure);
          const p2 = safeNum(points[2].pressure);
          return p1 !== null && p2 !== null ? `ΔP: ${((p1 - p2) / 1000).toFixed(1)}MPa` : "ΔP: N/A";
        })(),
        color: "#2563eb",
      },
      {
        from: points[2],
        to: points[3],
        label: (() => {
          const h2 = safeNum(points[2].enthalpy);
          const h3 = safeNum(points[3].enthalpy);
          return h2 !== null && h3 !== null ? `ΔH: ${(h2 - h3).toFixed(1)}kJ/kg` : "ΔH: N/A";
        })(),
        color: "#059669",
      },
      {
        from: points[3],
        to: points[0],
        label: (() => {
          const h0 = safeNum(points[0].enthalpy);
          const h3 = safeNum(points[3].enthalpy);
          return h0 !== null && h3 !== null ? `ΔH: ${(h0 - h3).toFixed(1)}kJ/kg` : "ΔH: N/A";
        })(),
        color: "#d97706",
      },
    ];

    processes.forEach((process) => {
      const midX = margin + (process.from.x + process.to.x) / 2;
      const midY = margin + (process.from.y + process.to.y) / 2;

      // Draw label background
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.strokeStyle = process.color;
      ctx.lineWidth = 1;

      ctx.font = "11px 'Inter', sans-serif";
      const textWidth = ctx.measureText(process.label).width;

      ctx.beginPath();
      ctx.roundRect(midX - textWidth / 2 - 6, midY - 8, textWidth + 12, 16, 3);
      ctx.fill();
      ctx.stroke();

      // Draw label text
      ctx.fillStyle = process.color;
      ctx.textAlign = "center";
      ctx.fillText(process.label, midX, midY + 4);
    });
  };

  const drawPropertyAnnotations = (
    ctx: CanvasRenderingContext2D,
    points: CyclePoint[],
    margin: number,
  ) => {
    points.forEach((point, index) => {
      const x = margin + point.x;
      const y = margin + point.y;

      // Enhanced point labels with key properties (guarded)
    const safeNum = (v: any) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };

    const temp = safeNum(point.temperature);
    const pres = safeNum(point.pressure);
    const enth = safeNum(point.enthalpy);

    const labels = [
      temp !== null ? `${temp.toFixed(1)}°C` : "N/A",
      pres !== null ? `${(pres / 1000).toFixed(1)}MPa` : "N/A",
      enth !== null ? `${enth.toFixed(0)}kJ/kg` : "N/A",
    ];

      // Background for labels
      ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
      ctx.strokeStyle = ["#dc2626", "#2563eb", "#059669", "#d97706"][index];
      ctx.lineWidth = 1;

      const maxWidth = Math.max(
        ...labels.map((label) => ctx.measureText(label).width),
      );
      const labelHeight = labels.length * 14 + 8;

      // Position label to avoid overlapping with point
      const labelX = x + (index % 2 === 0 ? 30 : -30 - maxWidth);
      const labelY = y - labelHeight / 2;

      ctx.beginPath();
      ctx.roundRect(labelX - 4, labelY - 4, maxWidth + 8, labelHeight, 4);
      ctx.fill();
      ctx.stroke();

      // Draw labels
      ctx.fillStyle = ["#dc2626", "#2563eb", "#059669", "#d97706"][index];
      ctx.font = "10px 'Inter', sans-serif";
      ctx.textAlign = index % 2 === 0 ? "left" : "right";

      labels.forEach((label, labelIndex) => {
        const textX = index % 2 === 0 ? labelX : labelX + maxWidth;
        ctx.fillText(label, textX, labelY + 12 + labelIndex * 14);
      });
    });
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!cycleData?.points) return;

    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();

    // Scale click coordinates to canvas coordinates
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (event.clientX - rect.left) * scaleX;
    const clickY = (event.clientY - rect.top) * scaleY;

    const margin = 120; // Updated margin for new canvas size
    const plotWidth = canvas.width - 2 * margin;
    const plotHeight = canvas.height - 2 * margin;
    const config = DIAGRAM_CONFIGS[diagramType];

    // Calculate proper coordinates for click detection
    const pointsWithCoords = calculateCoordinates(
      cycleData.points,
      config,
      plotWidth,
      plotHeight,
    );

    console.log("Click detection:", {
      clickX,
      clickY,
      pointsWithCoords: pointsWithCoords.map((p) => ({
        id: p.id,
        x: margin + p.x,
        y: margin + p.y,
      })),
    });

    // Check if click is near any point using calculated coordinates
    pointsWithCoords.forEach((point) => {
      const pointX = margin + point.x;
      const pointY = margin + point.y;
      const distance = Math.sqrt(
        (clickX - pointX) ** 2 + (clickY - pointY) ** 2,
      );

      console.log(`Point ${point.id} distance:`, distance);

      if (distance < 40) {
        // Increased click radius for better UX
        console.log(`Selecting point ${point.id}`);
        setSelectedPoint(selectedPoint === point.id ? null : point.id);
      }
    });
  };

  const selectedPointData = cycleData?.points.find((p) => p.id === selectedPoint);

  // Safe number formatters for rendering
  const fmt = (v: any, digits = 2) => {
    const n = Number(v);
    return Number.isFinite(n) ? n.toFixed(digits) : "N/A";
  };

  const fmtPressureMPa = (v: any, digits = 2) => {
    const n = Number(v);
    return Number.isFinite(n) ? (n / 1000).toFixed(digits) + " MPa" : "N/A";
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          {DIAGRAM_CONFIGS[diagramType].name} -{" "}
          {cycleData?.refrigerant || "No Data"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <Label htmlFor="diagram-type">Diagram Type:</Label>
          </div>
          <Select
            value={diagramType}
            onValueChange={(value: DiagramType) => setDiagramType(value)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select diagram type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="P-h">P-h (Pressure-Enthalpy)</SelectItem>
              <SelectItem value="T-s">T-s (Temperature-Entropy)</SelectItem>
              <SelectItem value="P-v">P-v (Pressure-Volume)</SelectItem>
              <SelectItem value="T-v">T-v (Temperature-Volume)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Main Visualization */}
          <div className="lg:col-span-3">
            <canvas
              ref={canvasRef}
              width={1600}
              height={1000}
              className="border rounded-lg cursor-pointer w-full shadow-xl bg-gradient-to-br from-gray-50 to-white"
              onClick={handleCanvasClick}
              style={{ maxWidth: "100%", height: "auto" }}
            />
            <div className="mt-2 text-sm text-gray-600">
              Click on cycle points to see detailed properties
            </div>

            {/* Details moved under diagram (Cycle Analysis & State Details) */}
            <div className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible defaultValue="analysis">
                    <AccordionItem value="analysis">
                      <AccordionTrigger>Cycle Analysis</AccordionTrigger>
                      <AccordionContent>
                        {cycleData ? (
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Pressure Ratio</span>
                              <span className="font-mono text-lg font-semibold">{(() => {
                                const p0 = Number(cycleData.points[0]?.pressure);
                                const p1 = Number(cycleData.points[1]?.pressure);
                                return Number.isFinite(p0) && Number.isFinite(p1) && p0 !== 0
                                  ? (p1 / p0).toFixed(2)
                                  : "N/A";
                              })()}</span>
                            </div>

                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Temperature Lift</span>
                              <span className="font-mono text-lg font-semibold">{(() => {
                                const t0 = Number(cycleData.points[0]?.temperature);
                                const t1 = Number(cycleData.points[1]?.temperature);
                                return Number.isFinite(t0) && Number.isFinite(t1)
                                  ? `${(t1 - t0).toFixed(1)} °C`
                                  : "N/A";
                              })()}</span>
                            </div>

                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Cycle Type</span>
                              <span className="font-mono text-sm">{diagramType === "P-h" ? "Vapor Compression" : "Thermodynamic"}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">No cycle data available</div>
                        )}
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="state">
                      <AccordionTrigger>State Details</AccordionTrigger>
                      <AccordionContent>
                        {selectedPointData ? (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <div className="text-xs text-gray-500">Temperature</div>
                                <div className="font-mono text-lg font-semibold">{fmt(selectedPointData.temperature, 2)} °C</div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500">Pressure</div>
                                <div className="font-mono text-lg font-semibold">{fmtPressureMPa(selectedPointData.pressure, 2)}</div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500">Enthalpy</div>
                                <div className="font-mono">{fmt(selectedPointData.enthalpy, 1)} kJ/kg</div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500">Entropy</div>
                                <div className="font-mono">{fmt(selectedPointData.entropy, 3)} kJ/kg��K</div>
                              </div>
                            </div>

                            {selectedPointData.quality !== undefined && Number.isFinite(Number(selectedPointData.quality)) && (
                              <div className="p-2 bg-blue-50 rounded">
                                <Badge variant="secondary" className="w-full justify-center">Vapor Quality: {(Number(selectedPointData.quality) * 100).toFixed(1)}%</Badge>
                              </div>
                            )}

                            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                              <h4 className="font-semibold text-sm mb-2">Engineering Notes:</h4>
                              <ul className="text-xs space-y-1 text-gray-600">
                                {selectedPointData.id === "1" && (
                                  <>
                                    <li>• Refrigerant exits evaporator as superheated vapor</li>
                                    <li>• Critical for preventing liquid slugging in compressor</li>
                                    <li>• Superheat should be 5-15°C for optimal performance</li>
                                  </>
                                )}
                                {selectedPointData.id === "2" && (
                                  <>
                                    <li>• Highest temperature and pressure in the cycle</li>
                                    <li>• Compressor discharge temperature critical for oil life</li>
                                    <li>• Should not exceed refrigerant's maximum temperature</li>
                                  </>
                                )}
                                {selectedPointData.id === "3" && (
                                  <>
                                    <li>• Subcooled liquid from condenser</li>
                                    <li>• Subcooling improves cycle efficiency</li>
                                    <li>• Prevents flash gas formation at expansion valve</li>
                                  </>
                                )}
                                {selectedPointData.id === "4" && (
                                  <>
                                    <li>• Two-phase mixture after expansion</li>
                                    <li>• Quality determines evaporator performance</li>
                                    <li>• Lower quality = more liquid = better heat transfer</li>
                                  </>
                                )}
                              </ul>
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">Select a cycle point on the diagram to view state details</div>
                        )}
                      </AccordionContent>
                    </AccordionItem>

                  </Accordion>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Engineering Properties Panel */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Details</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible defaultValue="tools">
                  <AccordionItem value="tools">
                    <AccordionTrigger>Legend & Tools</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3">
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Process Legend</h4>
                          <div className="grid grid-cols-1 gap-2">
                            <div className="flex items-center gap-3 p-2 bg-red-50 rounded"><div className="w-6 h-2 bg-red-500 rounded" /> <span className="text-sm font-medium">1→2: Compression</span></div>
                            <div className="flex items-center gap-3 p-2 bg-blue-50 rounded"><div className="w-6 h-2 bg-blue-500 rounded" /> <span className="text-sm font-medium">2→3: Condensation</span></div>
                            <div className="flex items-center gap-3 p-2 bg-green-50 rounded"><div className="w-6 h-2 bg-green-500 rounded" /> <span className="text-sm font-medium">3→4: Expansion</span></div>
                            <div className="flex items-center gap-3 p-2 bg-yellow-50 rounded"><div className="w-6 h-2 bg-yellow-500 rounded" /> <span className="text-sm font-medium">4→1: Evaporation</span></div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Professional Tools</h4>
                          <div className="space-y-2">
                            <Button variant="outline" size="sm" className="w-full justify-start text-xs" onClick={() => {
                              if (cycleData) {
                                const csvData = cycleData.points.map((point, i) => `Point ${i + 1},${point.temperature},${point.pressure},${point.enthalpy},${point.entropy}`).join("\n");
                                const blob = new Blob(["Point,Temperature(°C),Pressure(kPa),Enthalpy(kJ/kg),Entropy(kJ/kg·K)\n" + csvData], { type: "text/csv" });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement("a"); a.href = url; a.download = `${cycleData.refrigerant}_cycle_data.csv`; a.click();
                              }
                            }}>📊 Export to CSV</Button>

                            <Button variant="outline" size="sm" className="w-full justify-start text-xs" onClick={() => {
                              const canvas = canvasRef.current; if (canvas) { const link = document.createElement("a"); link.download = `${cycleData?.refrigerant || "cycle"}_${diagramType}_diagram.png`; link.href = canvas.toDataURL(); link.click(); }
                            }}>🖼️ Save Diagram</Button>

                            <Button variant="outline" size="sm" className="w-full justify-start text-xs">📋 Copy Properties</Button>
                            <Button variant="outline" size="sm" className="w-full justify-start text-xs">📐 Measure Tool</Button>
                            <Button variant="outline" size="sm" className="w-full justify-start text-xs">🔍 Zoom to Fit</Button>
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
