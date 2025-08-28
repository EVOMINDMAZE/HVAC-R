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
  isAnimating?: boolean;
  onAnimationToggle?: () => void;
  animationSpeed?: number;
  currentPoint?: number;
}

export function CycleVisualization({
  cycleData,
  isAnimating = false,
  onAnimationToggle,
  animationSpeed = 1000,
  currentPoint = 1,
}: CycleVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [animationFrame, setAnimationFrame] = useState(0);
  const [selectedPoint, setSelectedPoint] = useState<string | null>(null);
  const [diagramType, setDiagramType] = useState<DiagramType>("P-h");

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
    console.log(
      "Points received:",
      points.map((p) => ({
        id: p.id,
        name: p.name,
        temp: p.temperature,
        pressure: p.pressure,
        enthalpy: p.enthalpy,
      })),
    );

    // Get the actual property values for scaling with validation
    const xValues: number[] = [];
    const yValues: number[] = [];
    const validPoints: CyclePoint[] = [];

    points.forEach((point) => {
      const xProp = config.xAxis.property;
      const yProp = config.yAxis.property;

      const xVal = point[xProp] as number;
      const yVal = point[yProp] as number;

      console.log(
        `Point ${point.id}: ${xProp}=${xVal}, ${yProp}=${yVal}, valid=${!isNaN(xVal) && !isNaN(yVal)}`,
      );

      if (!isNaN(xVal) && xVal !== undefined && xVal !== null) {
        xValues.push(xVal);
      }
      if (!isNaN(yVal) && yVal !== undefined && yVal !== null) {
        yValues.push(yVal);
      }

      // Only include points with valid coordinates
      if (
        !isNaN(xVal) &&
        !isNaN(yVal) &&
        xVal !== undefined &&
        yVal !== undefined
      ) {
        validPoints.push(point);
      }
    });

    console.log(`Valid data points: ${validPoints.length}/4`);
    console.log("X values for scaling:", xValues);
    console.log("Y values for scaling:", yValues);

    // Enhanced scaling with real thermodynamic data
    if (xValues.length >= 3 && yValues.length >= 3) {
      const xMin = Math.min(...xValues);
      const xMax = Math.max(...xValues);
      const yMin = Math.min(...yValues);
      const yMax = Math.max(...yValues);

      console.log(
        `Real thermodynamic scaling: X[${xMin.toFixed(2)} to ${xMax.toFixed(2)}], Y[${yMin.toFixed(2)} to ${yMax.toFixed(2)}]`,
      );

      // Smart padding based on data range
      const xRange = xMax - xMin || 1;
      const yRange = yMax - yMin || 1;
      const xPadding = Math.max(xRange * 0.1, xRange > 1000 ? 50 : 5); // Adaptive padding
      const yPadding = Math.max(yRange * 0.1, yRange > 1000 ? 50 : 5);

      return points.map((point) => {
        const xVal = point[config.xAxis.property] as number;
        const yVal = point[config.yAxis.property] as number;

        let x: number, y: number;

        if (!isNaN(xVal) && !isNaN(yVal)) {
          // Use real thermodynamic coordinates
          x = ((xVal - xMin + xPadding) / (xRange + 2 * xPadding)) * plotWidth;
          y =
            plotHeight -
            ((yVal - yMin + yPadding) / (yRange + 2 * yPadding)) * plotHeight;
        } else {
          // Fallback to idealized position for invalid points
          const fallbackPositions = getIdealizedPositions(
            diagramType,
            plotWidth,
            plotHeight,
          );
          const index = parseInt(point.id) - 1;
          x = fallbackPositions[index]?.x || plotWidth / 2;
          y = fallbackPositions[index]?.y || plotHeight / 2;
        }

        console.log(
          `Point ${point.id} mapped: (${x.toFixed(1)}, ${y.toFixed(1)}) [${!isNaN(xVal) && !isNaN(yVal) ? "REAL" : "FALLBACK"}]`,
        );
        return { ...point, x, y };
      });
    } else {
      // Enhanced fallback with realistic thermodynamic cycle shapes
      console.log("Using enhanced thermodynamic fallback positions");
      const fallbackPositions = getIdealizedPositions(
        diagramType,
        plotWidth,
        plotHeight,
      );

      return points.map((point, index) => {
        const pos = fallbackPositions[index] || {
          x: plotWidth / 2,
          y: plotHeight / 2,
        };
        console.log(
          `Point ${point.id} fallback position: (${pos.x.toFixed(1)}, ${pos.y.toFixed(1)})`,
        );
        return { ...point, x: pos.x, y: pos.y };
      });
    }
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

  // Animation loop
  useEffect(() => {
    if (!isAnimating) return;

    const interval = setInterval(() => {
      setAnimationFrame((prev) => (prev + 1) % 100);
    }, 50);

    return () => clearInterval(interval);
  }, [isAnimating]);

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
  }, [cycleData, animationFrame, selectedPoint, diagramType]);

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

    // Set up coordinate system with larger margins for higher resolution
    const margin = 120;
    const plotWidth = width - 2 * margin;
    const plotHeight = height - 2 * margin;
    const config = DIAGRAM_CONFIGS[diagramType];

    // Calculate proper coordinates based on thermodynamic properties
    const pointsWithCoords = calculateCoordinates(
      cycleData.points,
      config,
      plotWidth,
      plotHeight,
    );

    // Draw axes and grid
    drawAxes(ctx, margin, plotWidth, plotHeight, config, pointsWithCoords);

    // Draw saturation dome for all diagram types
    drawSaturationDome(ctx, margin, plotWidth, plotHeight, config);

    // Draw cycle lines with animation
    drawCycleLines(
      ctx,
      pointsWithCoords,
      margin,
      isAnimating ? animationFrame : 100,
    );

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

    // Calculate real value ranges from cycle points
    const xValues = points
      .map((p) => p[config.xAxis.property] as number)
      .filter((v) => !isNaN(v) && v !== undefined);
    const yValues = points
      .map((p) => p[config.yAxis.property] as number)
      .filter((v) => !isNaN(v) && v !== undefined);

    if (xValues.length === 0 || yValues.length === 0) {
      console.log("No valid axis data available for", diagramType);
      return;
    }

    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);
    const yMin = Math.min(...yValues);
    const yMax = Math.max(...yValues);

    // Add padding to ranges
    const xRange = xMax - xMin || 1;
    const yRange = yMax - yMin || 1;
    const xPadding = xRange * 0.15;
    const yPadding = yRange * 0.15;

    const xMinPadded = xMin - xPadding;
    const xMaxPadded = xMax + xPadding;
    const yMinPadded = yMin - yPadding;
    const yMaxPadded = yMax + yPadding;

    console.log(`Real axis ranges for ${diagramType}:`, {
      xRange: [xMinPadded.toFixed(2), xMaxPadded.toFixed(2)],
      yRange: [yMinPadded.toFixed(2), yMaxPadded.toFixed(2)],
    });

    const numTicks = 6;

    // X-axis ticks with real values
    for (let i = 0; i <= numTicks; i++) {
      const x = margin + (plotWidth * i) / numTicks;
      const realValue = xMinPadded + ((xMaxPadded - xMinPadded) * i) / numTicks;

      ctx.beginPath();
      ctx.moveTo(x, margin + plotHeight);
      ctx.lineTo(x, margin + plotHeight + 10);
      ctx.stroke();

      // Format value based on magnitude and type
      let formattedValue: string;
      if (config.xAxis.property === "pressure") {
        formattedValue =
          realValue > 1000
            ? (realValue / 1000).toFixed(1) + "k"
            : realValue.toFixed(0);
      } else if (config.xAxis.property === "specificVolume") {
        formattedValue = realValue.toFixed(4);
      } else {
        formattedValue = realValue.toFixed(1);
      }

      ctx.fillText(formattedValue, x, margin + plotHeight + 28);
    }

    // Y-axis ticks with real values
    ctx.textAlign = "right";
    for (let i = 0; i <= numTicks; i++) {
      const y = margin + plotHeight - (plotHeight * i) / numTicks;
      const realValue = yMinPadded + ((yMaxPadded - yMinPadded) * i) / numTicks;

      ctx.beginPath();
      ctx.moveTo(margin - 10, y);
      ctx.lineTo(margin, y);
      ctx.stroke();

      // Format value based on magnitude and type
      let formattedValue: string;
      if (config.yAxis.property === "pressure") {
        formattedValue =
          realValue > 1000
            ? (realValue / 1000).toFixed(1) + "k"
            : realValue.toFixed(0);
      } else if (config.yAxis.property === "temperature") {
        formattedValue = realValue.toFixed(0);
      } else {
        formattedValue = realValue.toFixed(1);
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
    if (!cycleData?.saturationDome) {
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

    // Draw real saturation dome using API data
    let xData: number[] = [];
    let yData: number[] = [];

    if (diagramType === "P-h" && cycleData.saturationDome.ph_diagram) {
      xData = cycleData.saturationDome.ph_diagram.enthalpy_kj_kg;
      yData = cycleData.saturationDome.ph_diagram.pressure_kpa;
    } else if (diagramType === "T-s" && cycleData.saturationDome.ts_diagram) {
      xData = cycleData.saturationDome.ts_diagram.entropy_kj_kgk;
      yData = cycleData.saturationDome.ts_diagram.temperature_c;
    } else if (diagramType === "T-v" && cycleData.saturationDome.tv_diagram) {
      xData = cycleData.saturationDome.tv_diagram.specific_volume_m3_kg;
      yData = cycleData.saturationDome.tv_diagram.temperature_c;
    }

    if (xData.length > 0 && yData.length > 0) {
      // Scale the saturation dome data to canvas coordinates
      const xMin = Math.min(...xData);
      const xMax = Math.max(...xData);
      const yMin = Math.min(...yData);
      const yMax = Math.max(...yData);

      console.log(`Drawing saturation dome for ${diagramType}:`, {
        points: xData.length,
        xRange: [xMin, xMax],
        yRange: [yMin, yMax],
      });

      // Draw saturation dome curve
      ctx.strokeStyle = "rgba(59, 130, 246, 0.6)";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 2]);
      ctx.beginPath();

      for (let i = 0; i < Math.min(xData.length, yData.length); i++) {
        const x = margin + ((xData[i] - xMin) / (xMax - xMin)) * plotWidth;
        const y =
          margin +
          plotHeight -
          ((yData[i] - yMin) / (yMax - yMin)) * plotHeight;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();
      ctx.setLineDash([]);

      // Add saturation dome label
      ctx.fillStyle = "rgba(59, 130, 246, 0.8)";
      ctx.font = "12px 'Inter', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Saturation Dome", margin + plotWidth * 0.8, margin + 30);
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

        // Add animated arrow if line is being drawn
        if (isAnimating && lineProgress < 1 && lineProgress > 0.1) {
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
        icon: "🌡️",
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

    // Engineering calculations
    const compressionRatio = point2.pressure / point1.pressure;
    const temperatureLift = point2.temperature - point1.temperature;
    const refrigerationEffect = point1.enthalpy - point4.enthalpy;
    const compressionWork = point2.enthalpy - point1.enthalpy;
    const theoreticalCOP = refrigerationEffect / compressionWork;

    // Draw performance metrics overlay with enhanced styling
    const overlayX = margin + plotWidth - 250;
    const overlayY = margin + 20;

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

    const processes = [
      {
        from: points[0],
        to: points[1],
        label: `ΔT: ${(points[1].temperature - points[0].temperature).toFixed(1)}°C`,
        color: "#dc2626",
      },
      {
        from: points[1],
        to: points[2],
        label: `ΔP: ${((points[1].pressure - points[2].pressure) / 1000).toFixed(1)}MPa`,
        color: "#2563eb",
      },
      {
        from: points[2],
        to: points[3],
        label: `ΔH: ${(points[2].enthalpy - points[3].enthalpy).toFixed(1)}kJ/kg`,
        color: "#059669",
      },
      {
        from: points[3],
        to: points[0],
        label: `ΔH: ${(points[0].enthalpy - points[3].enthalpy).toFixed(1)}kJ/kg`,
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

      // Enhanced point labels with key properties
      const labels = [
        `${point.temperature.toFixed(1)}°C`,
        `${(point.pressure / 1000).toFixed(1)}MPa`,
        `${point.enthalpy.toFixed(0)}kJ/kg`,
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

  const selectedPointData = cycleData?.points.find(
    (p) => p.id === selectedPoint,
  );

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          {DIAGRAM_CONFIGS[diagramType].name} -{" "}
          {cycleData?.refrigerant || "No Data"}
        </CardTitle>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (onAnimationToggle) {
                onAnimationToggle();
              }
            }}
            className="flex items-center gap-2"
          >
            {isAnimating ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {isAnimating ? "Pause" : "Animate"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setAnimationFrame(0);
              setSelectedPoint(null);
            }}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        </div>
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
          </div>

          {/* Engineering Properties Panel */}
          <div className="space-y-4">
            {/* Process Legend - Moved here for better UX */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Process Legend</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-center gap-3 p-2 bg-red-50 rounded">
                    <div className="w-6 h-2 bg-red-500 rounded"></div>
                    <span className="text-sm font-medium">
                      1→2: Compression
                    </span>
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-blue-50 rounded">
                    <div className="w-6 h-2 bg-blue-500 rounded"></div>
                    <span className="text-sm font-medium">
                      2→3: Condensation
                    </span>
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-green-50 rounded">
                    <div className="w-6 h-2 bg-green-500 rounded"></div>
                    <span className="text-sm font-medium">3→4: Expansion</span>
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-yellow-50 rounded">
                    <div className="w-6 h-2 bg-yellow-500 rounded"></div>
                    <span className="text-sm font-medium">
                      4→1: Evaporation
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {selectedPointData ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                    State {selectedPointData.id} - {selectedPointData.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Primary Properties */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Thermometer className="h-4 w-4 text-red-500" />
                      <span className="font-mono">
                        T: {selectedPointData.temperature.toFixed(2)}°C
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Gauge className="h-4 w-4 text-blue-500" />
                      <span className="font-mono">
                        P: {(selectedPointData.pressure / 1000).toFixed(1)} MPa
                      </span>
                    </div>
                    <div className="font-mono">
                      h: {selectedPointData.enthalpy.toFixed(1)} kJ/kg
                    </div>
                    <div className="font-mono">
                      s: {selectedPointData.entropy.toFixed(3)} kJ/kg·K
                    </div>
                  </div>

                  {/* Quality if two-phase */}
                  {selectedPointData.quality !== undefined && (
                    <div className="p-2 bg-blue-50 rounded">
                      <Badge
                        variant="secondary"
                        className="w-full justify-center"
                      >
                        Vapor Quality:{" "}
                        {(selectedPointData.quality * 100).toFixed(1)}%
                      </Badge>
                    </div>
                  )}

                  {/* Engineering Notes */}
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-sm mb-2">
                      Engineering Notes:
                    </h4>
                    <ul className="text-xs space-y-1 text-gray-600">
                      {selectedPointData.id === "1" && (
                        <>
                          <li>
                            • Refrigerant exits evaporator as superheated vapor
                          </li>
                          <li>
                            • Critical for preventing liquid slugging in
                            compressor
                          </li>
                          <li>
                            • Superheat should be 5-15°C for optimal performance
                          </li>
                        </>
                      )}
                      {selectedPointData.id === "2" && (
                        <>
                          <li>
                            • Highest temperature and pressure in the cycle
                          </li>
                          <li>
                            • Compressor discharge temperature critical for oil
                            life
                          </li>
                          <li>
                            �� Should not exceed refrigerant's maximum
                            temperature
                          </li>
                        </>
                      )}
                      {selectedPointData.id === "3" && (
                        <>
                          <li>• Subcooled liquid from condenser</li>
                          <li>• Subcooling improves cycle efficiency</li>
                          <li>
                            • Prevents flash gas formation at expansion valve
                          </li>
                        </>
                      )}
                      {selectedPointData.id === "4" && (
                        <>
                          <li>�� Two-phase mixture after expansion</li>
                          <li>• Quality determines evaporator performance</li>
                          <li>
                            • Lower quality = more liquid = better heat transfer
                          </li>
                        </>
                      )}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center space-y-2">
                    <div className="text-4xl">👆</div>
                    <p className="text-muted-foreground">
                      Click any cycle point to view detailed engineering
                      properties
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Professional Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cycle Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {cycleData && (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Pressure Ratio:</span>
                      <span className="font-mono">
                        {cycleData.points[1] && cycleData.points[0]
                          ? (
                              cycleData.points[1].pressure /
                              cycleData.points[0].pressure
                            ).toFixed(2)
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Temperature Lift:</span>
                      <span className="font-mono">
                        {cycleData.points[1] && cycleData.points[0]
                          ? `${(cycleData.points[1].temperature - cycleData.points[0].temperature).toFixed(1)}°C`
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cycle Type:</span>
                      <span className="font-mono">
                        {diagramType === "P-h"
                          ? "Vapor Compression"
                          : "Thermodynamic"}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Engineering Tools */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Professional Tools</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={() => {
                    if (cycleData) {
                      const csvData = cycleData.points
                        .map(
                          (point, i) =>
                            `Point ${i + 1},${point.temperature},${point.pressure},${point.enthalpy},${point.entropy}`,
                        )
                        .join("\n");
                      const blob = new Blob(
                        [
                          "Point,Temperature(°C),Pressure(kPa),Enthalpy(kJ/kg),Entropy(kJ/kg·K)\n" +
                            csvData,
                        ],
                        { type: "text/csv" },
                      );
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `${cycleData.refrigerant}_cycle_data.csv`;
                      a.click();
                    }
                  }}
                >
                  📊 Export to CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={() => {
                    const canvas = canvasRef.current;
                    if (canvas) {
                      const link = document.createElement("a");
                      link.download = `${cycleData?.refrigerant || "cycle"}_${diagramType}_diagram.png`;
                      link.href = canvas.toDataURL();
                      link.click();
                    }
                  }}
                >
                  🖼️ Save Diagram
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-xs"
                >
                  📋 Copy Properties
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-xs"
                >
                  📐 Measure Tool
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-xs"
                >
                  🔍 Zoom to Fit
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
