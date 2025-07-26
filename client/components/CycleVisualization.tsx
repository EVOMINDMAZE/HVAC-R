import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Play, Pause, RotateCcw, Zap, Thermometer, Gauge, BarChart3 } from "lucide-react";

interface CyclePoint {
  id: string;
  name: string;
  temperature: number; // °C
  pressure: number; // kPa
  enthalpy: number; // kJ/kg
  entropy: number; // kJ/kg-K
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
    name: "Pressure-Enthalpy Diagram"
  },
  "T-s": {
    xAxis: { property: "entropy", label: "Entropy", unit: "kJ/kg·K" },
    yAxis: { property: "temperature", label: "Temperature", unit: "°C" },
    name: "Temperature-Entropy Diagram"
  },
  "P-v": {
    xAxis: { property: "enthalpy", label: "Specific Volume", unit: "m³/kg" }, // Using enthalpy as placeholder
    yAxis: { property: "pressure", label: "Pressure", unit: "kPa" },
    name: "Pressure-Volume Diagram"
  },
  "T-v": {
    xAxis: { property: "enthalpy", label: "Specific Volume", unit: "m³/kg" }, // Using enthalpy as placeholder
    yAxis: { property: "temperature", label: "Temperature", unit: "°C" },
    name: "Temperature-Volume Diagram"
  }
};

interface CycleVisualizationProps {
  cycleData?: {
    points: CyclePoint[];
    refrigerant: string;
    cycleType: "standard" | "cascade-low" | "cascade-high";
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

  // Calculate coordinates using actual thermodynamic data
  const calculateCoordinates = (points: CyclePoint[], config: DiagramConfig, plotWidth: number, plotHeight: number) => {
    if (!points || points.length === 0) return points;

    console.log("Calculating coordinates with real data for", diagramType);
    console.log("Points received:", points);

    // Get the actual property values for scaling
    const xValues: number[] = [];
    const yValues: number[] = [];

    points.forEach(point => {
      const xProp = config.xAxis.property;
      const yProp = config.yAxis.property;

      const xVal = point[xProp] as number;
      const yVal = point[yProp] as number;

      console.log(`Point ${point.id}: ${xProp}=${xVal}, ${yProp}=${yVal}`);

      if (!isNaN(xVal) && xVal !== undefined) xValues.push(xVal);
      if (!isNaN(yVal) && yVal !== undefined) yValues.push(yVal);
    });

    console.log("X values for scaling:", xValues);
    console.log("Y values for scaling:", yValues);

    // If we have valid data, use it for scaling
    if (xValues.length > 0 && yValues.length > 0) {
      const xMin = Math.min(...xValues);
      const xMax = Math.max(...xValues);
      const yMin = Math.min(...yValues);
      const yMax = Math.max(...yValues);

      console.log(`Scaling: X[${xMin} to ${xMax}], Y[${yMin} to ${yMax}]`);

      // Add padding
      const xRange = xMax - xMin || 1;
      const yRange = yMax - yMin || 1;
      const xPadding = xRange * 0.15;
      const yPadding = yRange * 0.15;

      return points.map(point => {
        const xVal = point[config.xAxis.property] as number;
        const yVal = point[config.yAxis.property] as number;

        const x = !isNaN(xVal)
          ? ((xVal - xMin + xPadding) / (xRange + 2 * xPadding)) * plotWidth
          : plotWidth / 2;

        const y = !isNaN(yVal)
          ? plotHeight - ((yVal - yMin + yPadding) / (yRange + 2 * yPadding)) * plotHeight
          : plotHeight / 2;

        console.log(`Point ${point.id} mapped to canvas: (${x.toFixed(1)}, ${y.toFixed(1)})`);
        return { ...point, x, y };
      });
    } else {
      // Fallback to idealized positions if no valid data
      console.log("No valid data found, using fallback positions");
      return points.map((point, index) => {
        let x: number, y: number;

        // Create realistic cycle shapes based on typical refrigeration cycle characteristics
        if (diagramType === "P-h") {
          const positions = [
            { x: 0.35, y: 0.75 }, // Point 1 - Evaporator outlet (low P, medium h)
            { x: 0.65, y: 0.25 }, // Point 2 - Compressor outlet (high P, high h)
            { x: 0.25, y: 0.25 }, // Point 3 - Condenser outlet (high P, low h)
            { x: 0.25, y: 0.75 }, // Point 4 - Expansion outlet (low P, low h)
          ];
          x = plotWidth * positions[index].x;
          y = plotHeight * positions[index].y;
        } else if (diagramType === "T-s") {
          const positions = [
            { x: 0.4, y: 0.8 },  // Point 1 - Low T, medium s
            { x: 0.45, y: 0.2 }, // Point 2 - High T, medium s
            { x: 0.3, y: 0.2 },  // Point 3 - High T, low s
            { x: 0.25, y: 0.8 }, // Point 4 - Low T, low s
          ];
          x = plotWidth * positions[index].x;
          y = plotHeight * positions[index].y;
        } else {
          // P-v and T-v diagrams
          const positions = [
            { x: 0.7, y: 0.7 }, // Point 1
            { x: 0.3, y: 0.3 }, // Point 2
            { x: 0.3, y: 0.6 }, // Point 3
            { x: 0.7, y: 0.6 }, // Point 4
          ];
          x = plotWidth * positions[index].x;
          y = plotHeight * positions[index].y;
        }

        return { ...point, x, y };
      });
    }
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
    ctx.imageSmoothingQuality = 'high';

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

    // Set up coordinate system with larger margins for 4K canvas
    const margin = 100;
    const plotWidth = width - 2 * margin;
    const plotHeight = height - 2 * margin;
    const config = DIAGRAM_CONFIGS[diagramType];

    // Calculate proper coordinates based on thermodynamic properties
    const pointsWithCoords = calculateCoordinates(cycleData.points, config, plotWidth, plotHeight);

    // Draw axes and grid
    drawAxes(ctx, margin, plotWidth, plotHeight, config);

    // Draw saturation dome (only for P-h diagrams)
    if (diagramType === "P-h") {
      drawSaturationDome(ctx, margin, plotWidth, plotHeight);
    }

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
    ctx.font = "bold 16px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
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

    // Add axis tick marks and values
    drawAxisTicks(ctx, margin, plotWidth, plotHeight, config);
  };

  const drawAxisTicks = (
    ctx: CanvasRenderingContext2D,
    margin: number,
    plotWidth: number,
    plotHeight: number,
    config: DiagramConfig,
  ) => {
    ctx.strokeStyle = "#374151";
    ctx.lineWidth = 2;
    ctx.fillStyle = "#374151";
    ctx.font = "12px 'Inter', sans-serif";
    ctx.textAlign = "center";

    const numTicks = 5;

    // X-axis ticks
    for (let i = 0; i <= numTicks; i++) {
      const x = margin + (plotWidth * i) / numTicks;
      ctx.beginPath();
      ctx.moveTo(x, margin + plotHeight);
      ctx.lineTo(x, margin + plotHeight + 8);
      ctx.stroke();

      // Tick labels (simplified)
      const value = (i / numTicks * 100).toFixed(0);
      ctx.fillText(value, x, margin + plotHeight + 25);
    }

    // Y-axis ticks
    ctx.textAlign = "right";
    for (let i = 0; i <= numTicks; i++) {
      const y = margin + plotHeight - (plotHeight * i) / numTicks;
      ctx.beginPath();
      ctx.moveTo(margin - 8, y);
      ctx.lineTo(margin, y);
      ctx.stroke();

      // Tick labels (simplified)
      const value = (i / numTicks * 100).toFixed(0);
      ctx.fillText(value, margin - 12, y + 4);
    }
  };

  const drawSaturationDome = (
    ctx: CanvasRenderingContext2D,
    margin: number,
    plotWidth: number,
    plotHeight: number,
  ) => {
    // Enhanced saturation dome for P-h diagram
    const centerX = margin + plotWidth * 0.35;
    const centerY = margin + plotHeight * 0.6;
    const radiusX = plotWidth * 0.3;
    const radiusY = plotHeight * 0.4;

    // Dome fill with gradient
    const gradient = ctx.createRadialGradient(
      centerX, centerY - radiusY * 0.3, 0,
      centerX, centerY, radiusY
    );
    gradient.addColorStop(0, "rgba(59, 130, 246, 0.05)");
    gradient.addColorStop(1, "rgba(59, 130, 246, 0.02)");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI);
    ctx.fill();

    // Dome border
    ctx.strokeStyle = "rgba(59, 130, 246, 0.4)";
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);

    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI);
    ctx.stroke();
    ctx.setLineDash([]);

    // Add saturation dome label
    ctx.fillStyle = "rgba(59, 130, 246, 0.8)";
    ctx.font = "12px 'Inter', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Saturation Dome", centerX, centerY + radiusY + 20);
  };

  const drawCycleLines = (
    ctx: CanvasRenderingContext2D,
    points: CyclePoint[],
    margin: number,
    progress: number,
  ) => {
    if (points.length < 4) return;

    const colors = ["#dc2626", "#2563eb", "#059669", "#d97706"];
    const processNames = ["Compression", "Condensation", "Expansion", "Evaporation"];
    const lineWidths = [5, 5, 5, 5];

    // Enable anti-aliasing for smooth lines
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    for (let i = 0; i < 4; i++) {
      const startPoint = points[i];
      const endPoint = points[(i + 1) % 4];
      const color = colors[i];

      // Calculate drawing progress for this line
      const lineProgress = Math.max(0, Math.min(1, (progress - i * 25) / 25));

      if (lineProgress > 0) {
        // Create gradient for the line
        const gradient = ctx.createLinearGradient(
          margin + startPoint.x, margin + startPoint.y,
          margin + endPoint.x, margin + endPoint.y
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
            margin + controlX1, margin + controlY1,
            margin + controlX2, margin + controlY2,
            margin + endPoint.x, margin + endPoint.y
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
            i
          );
        }

        // Add process label
        if (lineProgress > 0.5) {
          drawProcessLabel(ctx, startPoint, endPoint, margin, processNames[i], color);
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
      4
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
      ctx.roundRect(
        x - textWidth / 2 - 6,
        labelY - 8,
        textWidth + 12,
        16,
        4
      );
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
      { name: "Compressor", icon: "⚙️", position: { x: 0.15, y: 0.7 }, color: "#dc2626" },
      { name: "Condenser", icon: "🌡️", position: { x: 0.5, y: 0.1 }, color: "#2563eb" },
      { name: "Expansion Valve", icon: "🔻", position: { x: 0.85, y: 0.3 }, color: "#059669" },
      { name: "Evaporator", icon: "❄️", position: { x: 0.5, y: 0.85 }, color: "#d97706" },
    ];

    components.forEach((comp) => {
      const x = margin + comp.position.x * (canvasRef.current!.width - 2 * margin);
      const y = margin + comp.position.y * (canvasRef.current!.height - 2 * margin);

      // Component background
      ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
      ctx.strokeStyle = comp.color;
      ctx.lineWidth = 2;

      const text = `${comp.icon} ${comp.name}`;
      ctx.font = "bold 14px 'Inter', sans-serif";
      const textWidth = ctx.measureText(text).width;

      ctx.beginPath();
      ctx.roundRect(
        x - textWidth / 2 - 8,
        y - 10,
        textWidth + 16,
        20,
        6
      );
      ctx.fill();
      ctx.stroke();

      // Component text
      ctx.fillStyle = comp.color;
      ctx.textAlign = "center";
      ctx.fillText(text, x, y + 5);
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

    const margin = 100; // Updated margin for new canvas size

    // Check if click is near any point
    cycleData.points.forEach((point) => {
      const pointX = margin + point.x;
      const pointY = margin + point.y;
      const distance = Math.sqrt(
        (clickX - pointX) ** 2 + (clickY - pointY) ** 2,
      );

      if (distance < 25) { // Increased click radius for better UX
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
          {DIAGRAM_CONFIGS[diagramType].name} - {cycleData?.refrigerant || "No Data"}
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
          <Select value={diagramType} onValueChange={(value: DiagramType) => setDiagramType(value)}>
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
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Visualization */}
          <div className="lg:col-span-2">
            <canvas
              ref={canvasRef}
              width={1200}
              height={800}
              className="border rounded-lg cursor-pointer w-full shadow-lg bg-gradient-to-br from-gray-50 to-white"
              onClick={handleCanvasClick}
              style={{ maxWidth: '100%', height: 'auto' }}
            />
            <div className="mt-2 text-sm text-gray-600">
              Click on cycle points to see detailed properties
            </div>
          </div>

          {/* Properties Panel */}
          <div className="space-y-4">
            {selectedPointData ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Point {selectedPointData.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Thermometer className="h-4 w-4 text-red-500" />
                    <span>
                      Temperature: {selectedPointData.temperature.toFixed(1)}°C
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Gauge className="h-4 w-4 text-blue-500" />
                    <span>
                      Pressure: {(selectedPointData.pressure / 1000).toFixed(1)}{" "}
                      kPa
                    </span>
                  </div>
                  <div>
                    <span>
                      Enthalpy: {selectedPointData.enthalpy.toFixed(1)} kJ/kg
                    </span>
                  </div>
                  <div>
                    <span>
                      Entropy: {selectedPointData.entropy.toFixed(3)} kJ/kg-K
                    </span>
                  </div>
                  {selectedPointData.quality !== undefined && (
                    <div>
                      <Badge variant="secondary">
                        Quality: {(selectedPointData.quality * 100).toFixed(1)}%
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-gray-500 text-center">
                    Select a point on the cycle to view its properties
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Process Legend */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Process Legend</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-1 bg-red-500"></div>
                  <span className="text-sm">1→2: Compression</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-1 bg-blue-500"></div>
                  <span className="text-sm">2→3: Condensation</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-1 bg-green-500"></div>
                  <span className="text-sm">3→4: Expansion</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-1 bg-yellow-500"></div>
                  <span className="text-sm">4→1: Evaporation</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
