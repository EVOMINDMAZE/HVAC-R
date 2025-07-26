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
}

export function CycleVisualization({
  cycleData,
  isAnimating = false,
  onAnimationToggle,
}: CycleVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [animationFrame, setAnimationFrame] = useState(0);
  const [selectedPoint, setSelectedPoint] = useState<string | null>(null);
  const [diagramType, setDiagramType] = useState<DiagramType>("P-h");

  // Calculate canvas coordinates based on thermodynamic properties
  const calculateCoordinates = (points: CyclePoint[], config: DiagramConfig, plotWidth: number, plotHeight: number) => {
    if (!points || points.length === 0) return points;

    // Get property values for scaling
    const xValues = points.map(p => p[config.xAxis.property] as number).filter(v => !isNaN(v));
    const yValues = points.map(p => p[config.yAxis.property] as number).filter(v => !isNaN(v));

    if (xValues.length === 0 || yValues.length === 0) return points;

    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);
    const yMin = Math.min(...yValues);
    const yMax = Math.max(...yValues);

    // Add padding (10% on each side)
    const xRange = xMax - xMin;
    const yRange = yMax - yMin;
    const xPadding = xRange * 0.1;
    const yPadding = yRange * 0.1;

    return points.map(point => {
      const xValue = point[config.xAxis.property] as number;
      const yValue = point[config.yAxis.property] as number;

      // Scale to canvas coordinates
      const x = xValue && !isNaN(xValue)
        ? ((xValue - xMin + xPadding) / (xRange + 2 * xPadding)) * plotWidth
        : plotWidth / 2;

      const y = yValue && !isNaN(yValue)
        ? plotHeight - ((yValue - yMin + yPadding) / (yRange + 2 * yPadding)) * plotHeight
        : plotHeight / 2;

      return { ...point, x, y };
    });
  };

  // Animation loop
  useEffect(() => {
    if (!isAnimating) return;

    const interval = setInterval(() => {
      setAnimationFrame((prev) => (prev + 1) % 100);
    }, 50);

    return () => clearInterval(interval);
  }, [isAnimating]);

  // Canvas drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !cycleData) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    drawCycle(ctx, canvas.width, canvas.height);
  }, [cycleData, animationFrame, selectedPoint]);

  const drawCycle = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
  ) => {
    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    if (!cycleData?.points || cycleData.points.length < 4) {
      drawPlaceholder(ctx, width, height);
      return;
    }

    // Set up coordinate system
    const margin = 60;
    const plotWidth = width - 2 * margin;
    const plotHeight = height - 2 * margin;
    const config = DIAGRAM_CONFIGS[diagramType];

    // Calculate proper coordinates based on thermodynamic properties
    const pointsWithCoords = calculateCoordinates(cycleData.points, config, plotWidth, plotHeight);

    // Draw axes
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

  const drawAxes = (
    ctx: CanvasRenderingContext2D,
    margin: number,
    plotWidth: number,
    plotHeight: number,
    config: DiagramConfig,
  ) => {
    ctx.strokeStyle = "#374151";
    ctx.lineWidth = 2;

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

    // Labels
    ctx.fillStyle = "#374151";
    ctx.font = "14px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
      `${config.xAxis.label} (${config.xAxis.unit})`,
      margin + plotWidth / 2,
      margin + plotHeight + 40,
    );

    ctx.save();
    ctx.translate(20, margin + plotHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`${config.yAxis.label} (${config.yAxis.unit})`, 0, 0);
    ctx.restore();
  };

  const drawSaturationDome = (
    ctx: CanvasRenderingContext2D,
    margin: number,
    plotWidth: number,
    plotHeight: number,
  ) => {
    // Simplified saturation dome
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);

    ctx.beginPath();
    const centerX = margin + plotWidth * 0.3;
    const centerY = margin + plotHeight * 0.7;
    const radiusX = plotWidth * 0.25;
    const radiusY = plotHeight * 0.3;

    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI);
    ctx.stroke();
    ctx.setLineDash([]);
  };

  const drawCycleLines = (
    ctx: CanvasRenderingContext2D,
    points: CyclePoint[],
    margin: number,
    progress: number,
  ) => {
    if (points.length < 4) return;

    const colors = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b"];
    const processes = [
      "Compression",
      "Condensation",
      "Expansion",
      "Evaporation",
    ];

    for (let i = 0; i < 4; i++) {
      const startPoint = points[i];
      const endPoint = points[(i + 1) % 4];

      ctx.strokeStyle = colors[i];
      ctx.lineWidth = 3;

      // Calculate drawing progress for this line
      const lineProgress = Math.max(0, Math.min(1, (progress - i * 25) / 25));

      if (lineProgress > 0) {
        ctx.beginPath();
        ctx.moveTo(margin + startPoint.x, margin + startPoint.y);

        // Draw partial line based on animation progress
        const deltaX = endPoint.x - startPoint.x;
        const deltaY = endPoint.y - startPoint.y;
        const currentX = startPoint.x + deltaX * lineProgress;
        const currentY = startPoint.y + deltaY * lineProgress;

        ctx.lineTo(margin + currentX, margin + currentY);
        ctx.stroke();

        // Add arrow at current position if animating
        if (isAnimating && lineProgress < 1) {
          drawArrow(
            ctx,
            margin + currentX,
            margin + currentY,
            Math.atan2(deltaY, deltaX),
          );
        }
      }
    }
  };

  const drawArrow = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    angle: number,
  ) => {
    const size = 8;
    ctx.fillStyle = "#ef4444";

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-size, -size / 2);
    ctx.lineTo(-size, size / 2);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  };

  const drawCyclePoints = (
    ctx: CanvasRenderingContext2D,
    points: CyclePoint[],
    margin: number,
  ) => {
    points.forEach((point, index) => {
      const x = margin + point.x;
      const y = margin + point.y;
      const isSelected = selectedPoint === point.id;

      // Point circle
      ctx.fillStyle = isSelected ? "#ef4444" : "#374151";
      ctx.beginPath();
      ctx.arc(x, y, isSelected ? 8 : 6, 0, 2 * Math.PI);
      ctx.fill();

      // Point label
      ctx.fillStyle = "#374151";
      ctx.font = "bold 14px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`${index + 1}`, x, y - 15);
    });
  };

  const drawComponentLabels = (
    ctx: CanvasRenderingContext2D,
    points: CyclePoint[],
    margin: number,
  ) => {
    const components = [
      { name: "🔧 Compressor", position: { x: 0.1, y: 0.8 } },
      { name: "🌡️ Condenser", position: { x: 0.5, y: 0.1 } },
      { name: "🔻 Expansion Valve", position: { x: 0.9, y: 0.2 } },
      { name: "❄️ Evaporator", position: { x: 0.5, y: 0.9 } },
    ];

    ctx.fillStyle = "#6b7280";
    ctx.font = "12px Inter, sans-serif";
    ctx.textAlign = "center";

    components.forEach((comp) => {
      const x =
        margin + comp.position.x * (canvasRef.current!.width - 2 * margin);
      const y =
        margin + comp.position.y * (canvasRef.current!.height - 2 * margin);
      ctx.fillText(comp.name, x, y);
    });
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!cycleData?.points) return;

    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    // Check if click is near any point
    cycleData.points.forEach((point) => {
      const pointX = 60 + point.x;
      const pointY = 60 + point.y;
      const distance = Math.sqrt(
        (clickX - pointX) ** 2 + (clickY - pointY) ** 2,
      );

      if (distance < 15) {
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
          Cycle Visualization - {cycleData?.refrigerant || "No Data"}
        </CardTitle>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onAnimationToggle}
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
            onClick={() => setAnimationFrame(0)}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Visualization */}
          <div className="lg:col-span-2">
            <canvas
              ref={canvasRef}
              width={600}
              height={400}
              className="border rounded-lg cursor-pointer w-full"
              onClick={handleCanvasClick}
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
