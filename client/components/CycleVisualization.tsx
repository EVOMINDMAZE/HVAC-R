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
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Detect dark mode changes
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    };
    checkDarkMode();

    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  // Draggable overlay state: position in pixels relative to canvas
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

    // Enable high-quality rendering with High DPI scaling
    const logicalWidth = 1600;
    const logicalHeight = 1000;

    // Force at least 3x scaling for 4k-like quality or use device pixel ratio if higher
    const dpr = window.devicePixelRatio || 1;
    const scale = Math.max(dpr, 3);

    // Set actual backing store size
    canvas.width = logicalWidth * scale;
    canvas.height = logicalHeight * scale;

    // Normalize coordinate system to use logical pixels
    ctx.scale(scale, scale);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    drawCycle(ctx, logicalWidth, logicalHeight);
  }, [cycleData, selectedPoint, diagramType, isDarkMode]);



  const drawCycle = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
  ) => {
    // Clear canvas with gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    if (isDarkMode) {
      gradient.addColorStop(0, "#0f172a"); // slate-900
      gradient.addColorStop(1, "#1e293b"); // slate-800
    } else {
      gradient.addColorStop(0, "#fafafa");
      gradient.addColorStop(1, "#f8fafc");
    }
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

    // Draw enhanced annotations (arrows and labels)
    drawDiagramAnnotations(
      ctx,
      pointsWithCoords,
      margin,
    );
  };

  const drawPlaceholder = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
  ) => {
    ctx.fillStyle = isDarkMode ? "#1e293b" : "#f3f4f6";
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = isDarkMode ? "#9ca3af" : "#6b7280";
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
    ctx.strokeStyle = isDarkMode ? "rgba(148, 163, 184, 0.1)" : "#e5e7eb";
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
    // Minor grid lines
    ctx.strokeStyle = isDarkMode ? "rgba(148, 163, 184, 0.05)" : "#f3f4f6";
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
    ctx.strokeStyle = isDarkMode ? "#94a3b8" : "#1f2937";
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
    ctx.fillStyle = isDarkMode ? "#94a3b8" : "#1f2937";
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
    ctx.strokeStyle = isDarkMode ? "#64748b" : "#374151";
    ctx.lineWidth = 2;
    ctx.fillStyle = isDarkMode ? "#94a3b8" : "#374151";
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
      ctx.strokeStyle = isDarkMode ? 'rgba(96, 165, 250, 0.6)' : 'rgba(59, 130, 246, 0.6)';
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

      ctx.fillStyle = isDarkMode ? 'rgba(96, 165, 250, 0.8)' : 'rgba(59, 130, 246, 0.8)';
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

    const colors = isDarkMode
      ? ["#f87171", "#60a5fa", "#34d399", "#fbbf24"] // 400 variants for dark mode
      : ["#dc2626", "#2563eb", "#059669", "#d97706"]; // 600 variants for light mode
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
    ctx.fillStyle = isDarkMode ? "rgba(15, 23, 42, 0.9)" : "rgba(255, 255, 255, 0.9)";
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
      ctx.fillStyle = isDarkMode ? "#0f172a" : "white";
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
      ctx.fillStyle = isDarkMode ? "rgba(15, 23, 42, 0.95)" : "rgba(255, 255, 255, 0.95)";
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
        color: isDarkMode ? "#f87171" : "#dc2626",
      },
      {
        name: "Condenser",
        icon: "🌡️",
        position: { x: 0.5, y: 0.1 },
        color: isDarkMode ? "#60a5fa" : "#2563eb",
      },
      {
        name: "Expansion Valve",
        icon: "🔻",
        position: { x: 0.85, y: 0.3 },
        color: isDarkMode ? "#34d399" : "#059669",
      },
      {
        name: "Evaporator",
        icon: "❄️",
        position: { x: 0.5, y: 0.85 },
        color: isDarkMode ? "#fbbf24" : "#d97706",
      },
    ];

    components.forEach((comp) => {
      const x =
        margin + comp.position.x * (canvasRef.current!.width - 2 * margin);
      const y =
        margin + comp.position.y * (canvasRef.current!.height - 2 * margin);

      // Component background
      ctx.fillStyle = isDarkMode ? "rgba(15, 23, 42, 0.95)" : "rgba(255, 255, 255, 0.95)";
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

  const drawDiagramAnnotations = (
    ctx: CanvasRenderingContext2D,
    points: CyclePoint[],
    margin: number,
  ) => {
    if (!cycleData || points.length < 4) return;

    // Draw process arrows with values (Delta T, Delta P, etc.)
    drawProcessArrows(ctx, points, margin);

    // Add thermodynamic property annotations to each point
    drawPropertyAnnotations(ctx, points, margin);
  };

  const drawProcessArrows = (
    ctx: CanvasRenderingContext2D,
    points: CyclePoint[],
    margin: number,
  ) => {
    if (points.length < 4) return;

    const safeNum = (v: any) => {
      if (v === null || v === undefined) return null;
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
        color: isDarkMode ? "#f87171" : "#dc2626",
      },
      {
        from: points[1],
        to: points[2],
        label: (() => {
          const p1 = safeNum(points[1].pressure);
          const p2 = safeNum(points[2].pressure);
          return p1 !== null && p2 !== null ? `ΔP: ${((p1 - p2) / 1000).toFixed(1)}MPa` : "ΔP: N/A";
        })(),
        color: isDarkMode ? "#60a5fa" : "#2563eb",
      },
      {
        from: points[2],
        to: points[3],
        label: (() => {
          const h2 = safeNum(points[2].enthalpy);
          const h3 = safeNum(points[3].enthalpy);
          return h2 !== null && h3 !== null ? `ΔH: ${(h2 - h3).toFixed(1)}kJ/kg` : "ΔH: N/A";
        })(),
        color: isDarkMode ? "#34d399" : "#059669",
      },
      {
        from: points[3],
        to: points[0],
        label: (() => {
          const h0 = safeNum(points[0].enthalpy);
          const h3 = safeNum(points[3].enthalpy);
          return h0 !== null && h3 !== null ? `ΔH: ${(h0 - h3).toFixed(1)}kJ/kg` : "ΔH: N/A";
        })(),
        color: isDarkMode ? "#fbbf24" : "#d97706",
      },
    ];

    processes.forEach((process) => {
      const midX = margin + (process.from.x + process.to.x) / 2;
      const midY = margin + (process.from.y + process.to.y) / 2;

      // Draw label background
      ctx.fillStyle = isDarkMode ? "rgba(15, 23, 42, 0.9)" : "rgba(255, 255, 255, 0.9)";
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
        if (v === null || v === undefined) return null;
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
      ctx.fillStyle = isDarkMode ? "rgba(15, 23, 42, 0.95)" : "rgba(255, 255, 255, 0.95)";

      const colors = isDarkMode
        ? ["#f87171", "#60a5fa", "#34d399", "#fbbf24"]
        : ["#dc2626", "#2563eb", "#059669", "#d97706"];
      ctx.strokeStyle = colors[index];
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
      ctx.fillStyle = colors[index];
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

    const logicalWidth = 1600;
    const logicalHeight = 1000;

    // Scale click coordinates to logical coordinates
    const scaleX = logicalWidth / rect.width;
    const scaleY = logicalHeight / rect.height;
    const clickX = (event.clientX - rect.left) * scaleX;
    const clickY = (event.clientY - rect.top) * scaleY;

    const margin = 120; // Updated margin for new canvas size
    const plotWidth = logicalWidth - 2 * margin;
    const plotHeight = logicalHeight - 2 * margin;
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
    if (v === null || v === undefined || v === "") return "N/A";
    const n = Number(v);
    return Number.isFinite(n) ? n.toFixed(digits) : "N/A";
  };

  const fmtPressureMPa = (v: any, digits = 2) => {
    if (v === null || v === undefined || v === "") return "N/A";
    const n = Number(v);
    return Number.isFinite(n) ? (n / 1000).toFixed(digits) + " MPa" : "N/A";
  };

  // Determine theme colors based on cycle type
  const themeParams = (() => {
    switch (cycleData?.cycleType) {
      case "cascade-low":
        return {
          bg: "bg-cyan-100 dark:bg-cyan-900/30",
          text: "text-cyan-600 dark:text-cyan-400",
          border: "border-cyan-500",
          ring: "ring-cyan-500/20",
          icon: <Zap className="h-5 w-5" />,
          label: "Low Temp Stage"
        };
      case "cascade-high":
        return {
          bg: "bg-orange-100 dark:bg-orange-900/30",
          text: "text-orange-600 dark:text-orange-400",
          border: "border-orange-500",
          ring: "ring-orange-500/20",
          icon: <Thermometer className="h-5 w-5" />, // Differentiate icon
          label: "High Temp Stage"
        };
      default:
        return {
          bg: "bg-blue-100 dark:bg-blue-900/30",
          text: "text-blue-600 dark:text-blue-400",
          border: "border-blue-500",
          ring: "ring-blue-500/20",
          icon: <Zap className="h-5 w-5" />,
          label: "Standard Cycle"
        };
    }
  })();

  return (
    <div className="w-full space-y-4">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-md ${themeParams.bg} ${themeParams.text}`}>
            {themeParams.icon}
          </div>
          <div>
            <h3 className="font-semibold text-lg flex items-center gap-2">
              {DIAGRAM_CONFIGS[diagramType].name}
              {/* Optional: Add badge for cycle stage */}
              {cycleData?.cycleType !== 'standard' && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${themeParams.text} ${themeParams.bg} border-opacity-30`}>
                  {themeParams.label}
                </span>
              )}
            </h3>
            <p className="text-sm text-muted-foreground">{cycleData?.refrigerant || "No Data"}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-white dark:bg-slate-950 px-3 py-1.5 rounded-md border shadow-sm">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Type:</span>
            <Select
              value={diagramType}
              onValueChange={(value: DiagramType) => setDiagramType(value)}
            >
              <SelectTrigger className="w-[140px] h-8 border-0 bg-transparent focus:ring-0 p-0 text-foreground font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="P-h">Pressure-Enthalpy</SelectItem>
                <SelectItem value="T-s">Temperature-Entropy</SelectItem>
                <SelectItem value="P-v">Pressure-Volume</SelectItem>
                <SelectItem value="T-v">Temperature-Volume</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Main Visualization */}
        <div className="lg:col-span-3 space-y-4">
          <div className="relative group">
            <canvas
              ref={canvasRef}
              width={1600}
              height={1000}
              className={`border rounded-xl cursor-crosshair w-full shadow-lg bg-white dark:bg-slate-950 dark:border-slate-800 transition-all duration-300 hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-700`}
              onClick={handleCanvasClick}
              style={{ maxWidth: "100%", height: "auto" }}
            />
            {!cycleData && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-xl">
                <div className="text-muted-foreground font-medium">No Cycle Data Available</div>
              </div>
            )}
            <div className="absolute bottom-4 right-4 text-xs text-muted-foreground bg-white/80 dark:bg-black/50 backdrop-blur px-2 py-1 rounded border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Click points for details
            </div>
          </div>
        </div>

        {/* Sidebar Panel - Unified Details */}
        <div className="space-y-6">

          {/* 1. Cycle Analysis (Always Visible) */}
          <Card className={`border-l-4 ${themeParams.border} shadow-sm`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Gauge className="h-4 w-4 shrink-0" />
                <span>Cycle Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cycleData && cycleData.points.length >= 4 ? (
                (() => {
                  const p1 = Number(cycleData.points[0]?.pressure); // Evap Out
                  const p2 = Number(cycleData.points[1]?.pressure); // Comp Out
                  const t1 = Number(cycleData.points[0]?.temperature);
                  const t2 = Number(cycleData.points[1]?.temperature);
                  const h1 = Number(cycleData.points[0]?.enthalpy);
                  const h2 = Number(cycleData.points[1]?.enthalpy); // Comp Out
                  const h4 = Number(cycleData.points[3]?.enthalpy); // Evap In

                  const compressionRatio = p1 ? p2 / p1 : 0;
                  const tempLift = t2 - t1;
                  const refrigEffect = h1 - h4;
                  const compWork = h2 - h1;
                  const cop = compWork ? refrigEffect / compWork : 0;

                  return (
                    <div className="space-y-3 pt-1">
                      <div className="flex justify-between items-center pb-2 border-b border-dashed">
                        <span className="text-sm text-muted-foreground">Theoretical COP</span>
                        <Badge variant="outline" className={`font-mono text-base ${themeParams.text} ${themeParams.bg} border-0`}>
                          {Number.isFinite(cop) ? cop.toFixed(2) : "N/A"}
                        </Badge>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Compression Ratio</span>
                          <span className="font-mono">{Number.isFinite(compressionRatio) ? compressionRatio.toFixed(2) : "N/A"}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Temperature Lift</span>
                          <span className="font-mono">{Number.isFinite(tempLift) ? tempLift.toFixed(1) + " °C" : "N/A"}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Refrig. Effect</span>
                          <span className="font-mono">{Number.isFinite(refrigEffect) ? refrigEffect.toFixed(1) + " kJ/kg" : "N/A"}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Comp. Work</span>
                          <span className="font-mono">{Number.isFinite(compWork) ? compWork.toFixed(1) + " kJ/kg" : "N/A"}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="text-center py-4 text-muted-foreground text-sm">No cycle data available</div>
              )}
            </CardContent>
          </Card>

          {/* 2. Point Inspector (Always Visible, Dynamic Content) */}
          <Card className={`shadow-sm ${selectedPointData ? 'ring-1 ' + themeParams.ring : 'border-dashed'}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  {selectedPointData ? (
                    <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${themeParams.bg} ${themeParams.ring} ring-2 ${themeParams.text}`}>
                      {selectedPointData.id}
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs text-muted-foreground">
                      ?
                    </div>
                  )}
                  <span>Point Inspector</span>
                </span>
                {selectedPointData && (
                  <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 text-muted-foreground hover:text-foreground" onClick={() => setSelectedPoint(null)} title="Clear selection">
                    <span className="text-xs">✕</span>
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedPointData ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-200">
                  <div className="grid grid-cols-2 gap-x-2 gap-y-3 text-sm">
                    <div className="bg-slate-50 dark:bg-slate-900/40 p-2 rounded">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Temperature</div>
                      <div className="font-mono text-base font-medium">{fmt(selectedPointData.temperature, 1)} <span className="text-xs text-muted-foreground">°C</span></div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/40 p-2 rounded">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Pressure</div>
                      <div className="font-mono text-base font-medium">{fmtPressureMPa(selectedPointData.pressure, 2)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Enthalpy</div>
                      <div className="font-mono">{fmt(selectedPointData.enthalpy, 1)} <span className="text-xs text-muted-foreground">kJ/kg</span></div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Entropy</div>
                      <div className="font-mono">{fmt(selectedPointData.entropy, 3)} <span className="text-xs text-muted-foreground">kJ/kg·K</span></div>
                    </div>
                  </div>

                  {selectedPointData.quality !== undefined && Number.isFinite(Number(selectedPointData.quality)) && (
                    <div className="text-xs bg-blue-50 dark:bg-blue-900/20 p-2 rounded text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800 flex items-center gap-2">
                      <span className="text-base">💧</span>
                      <span><strong>Vapor Quality:</strong> {(Number(selectedPointData.quality) * 100).toFixed(1)}%</span>
                    </div>
                  )}

                  {/* Contextual Note */}
                  <div className="text-xs text-muted-foreground border-t pt-2 mt-2">
                    <span className="font-medium text-foreground">Note: </span>
                    {selectedPointData.id === "1" && "Evaporator Outlet (Superheated Vapor)"}
                    {selectedPointData.id === "2" && "Compressor Discharge (Superheated Gas)"}
                    {selectedPointData.id === "3" && "Condenser Outlet (Subcooled Liquid)"}
                    {selectedPointData.id === "4" && "Evaporator Inlet (Liquid+Vapor Mix)"}
                    {!["1", "2", "3", "4"].includes(selectedPointData.id) && "State point properties"}
                  </div>
                </div>
              ) : (
                <div className="h-32 flex flex-col items-center justify-center text-center text-sm text-muted-foreground border-2 border-dashed rounded-lg bg-slate-50/50 dark:bg-slate-900/20">
                  <span className="text-2xl mb-2 opacity-50">👆</span>
                  <p>Select a point on the chart<br />to view detailed properties</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 2. Legend */}
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Process Legend</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-xs">
                <span className="w-2 h-2 rounded-full bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.5)]"></span>
                <span className="font-medium">1→2: Compression</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.5)]"></span>
                <span className="font-medium">2→3: Condensation</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]"></span>
                <span className="font-medium">3→4: Expansion</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.5)]"></span>
                <span className="font-medium">4→1: Evaporation</span>
              </div>
            </div>
          </div>

          {/* 3. Actions */}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="w-full text-xs h-8" onClick={() => {
              const canvas = canvasRef.current; if (canvas) { const link = document.createElement("a"); link.download = `${cycleData?.refrigerant || "cycle"}_diagram.png`; link.href = canvas.toDataURL(); link.click(); }
            }}>
              📸 Save Image
            </Button>
            <Button variant="outline" size="sm" className="w-full text-xs h-8" onClick={() => {
              if (cycleData) {
                const csvData = cycleData.points.map((p, i) => `P${i + 1},${p.temperature},${p.pressure},${p.enthalpy},${p.entropy}`).join("\n");
                const blob = new Blob(["Point,T(C),P(kPa),h(kJ/kg),s(kJ/kgK)\n" + csvData], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a"); a.href = url; a.download = `${cycleData.refrigerant}_data.csv`; a.click();
              }
            }}>
              📊 Export CSV
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
}
