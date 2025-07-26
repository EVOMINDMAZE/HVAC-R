import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface EquipmentDiagramProps {
  type:
    | "compressor"
    | "evaporator"
    | "condenser"
    | "expansion-valve"
    | "heat-exchanger"
    | "complete-cycle";
  width?: number;
  height?: number;
  showLabels?: boolean;
  animated?: boolean;
  refrigerant?: string;
  className?: string;
}

export function EquipmentDiagram({
  type,
  width = 200,
  height = 150,
  showLabels = true,
  animated = false,
  refrigerant,
  className,
}: EquipmentDiagramProps) {
  const getEquipmentSvg = () => {
    switch (type) {
      case "compressor":
        return (
          <svg
            width={width}
            height={height}
            viewBox="0 0 200 150"
            className={className}
          >
            {/* Compressor Body */}
            <rect
              x="50"
              y="40"
              width="100"
              height="70"
              rx="10"
              fill="#e5e7eb"
              stroke="#374151"
              strokeWidth="2"
            />

            {/* Compressor Motor */}
            <circle
              cx="100"
              cy="75"
              r="25"
              fill="#6b7280"
              stroke="#374151"
              strokeWidth="2"
            />

            {/* Suction Line */}
            <path
              d="M20 75 L50 75"
              stroke="#3b82f6"
              strokeWidth="4"
              fill="none"
            />
            <polygon points="15,70 15,80 25,75" fill="#3b82f6" />

            {/* Discharge Line */}
            <path
              d="M150 75 L180 75"
              stroke="#ef4444"
              strokeWidth="4"
              fill="none"
            />
            <polygon points="175,70 185,75 175,80" fill="#ef4444" />

            {/* Rotating Animation */}
            {animated && (
              <animateTransform
                attributeName="transform"
                attributeType="XML"
                type="rotate"
                from="0 100 75"
                to="360 100 75"
                dur="2s"
                repeatCount="indefinite"
              />
            )}

            {showLabels && (
              <>
                <text
                  x="100"
                  y="130"
                  textAnchor="middle"
                  className="text-sm font-medium fill-gray-700"
                >
                  Compressor
                </text>
                <text
                  x="35"
                  y="95"
                  textAnchor="middle"
                  className="text-xs fill-blue-600"
                >
                  Suction
                </text>
                <text
                  x="165"
                  y="95"
                  textAnchor="middle"
                  className="text-xs fill-red-600"
                >
                  Discharge
                </text>
              </>
            )}
          </svg>
        );

      case "evaporator":
        return (
          <svg
            width={width}
            height={height}
            viewBox="0 0 200 150"
            className={className}
          >
            {/* Evaporator Coils */}
            <g fill="none" stroke="#3b82f6" strokeWidth="3">
              <path d="M30 40 Q50 20, 70 40 Q90 60, 110 40 Q130 20, 150 40 Q170 60, 190 40" />
              <path d="M30 60 Q50 40, 70 60 Q90 80, 110 60 Q130 40, 150 60 Q170 80, 190 60" />
              <path d="M30 80 Q50 60, 70 80 Q90 100, 110 80 Q130 60, 150 80 Q170 100, 190 80" />
              <path d="M30 100 Q50 80, 70 100 Q90 120, 110 100 Q130 80, 150 100 Q170 120, 190 100" />
            </g>

            {/* Air Flow */}
            {animated && (
              <g fill="#60a5fa" opacity="0.6">
                <circle cx="40" cy="30" r="2">
                  <animate
                    attributeName="cy"
                    values="30;120;30"
                    dur="3s"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle cx="80" cy="25" r="2">
                  <animate
                    attributeName="cy"
                    values="25;125;25"
                    dur="3s"
                    begin="0.5s"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle cx="120" cy="30" r="2">
                  <animate
                    attributeName="cy"
                    values="30;120;30"
                    dur="3s"
                    begin="1s"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle cx="160" cy="25" r="2">
                  <animate
                    attributeName="cy"
                    values="25;125;25"
                    dur="3s"
                    begin="1.5s"
                    repeatCount="indefinite"
                  />
                </circle>
              </g>
            )}

            {/* Connection Points */}
            <circle cx="30" cy="70" r="4" fill="#374151" />
            <circle cx="190" cy="70" r="4" fill="#374151" />

            {showLabels && (
              <text
                x="110"
                y="140"
                textAnchor="middle"
                className="text-sm font-medium fill-gray-700"
              >
                Evaporator
              </text>
            )}
          </svg>
        );

      case "condenser":
        return (
          <svg
            width={width}
            height={height}
            viewBox="0 0 200 150"
            className={className}
          >
            {/* Condenser Coils */}
            <g fill="none" stroke="#ef4444" strokeWidth="3">
              <path d="M30 40 Q50 20, 70 40 Q90 60, 110 40 Q130 20, 150 40 Q170 60, 190 40" />
              <path d="M30 60 Q50 40, 70 60 Q90 80, 110 60 Q130 40, 150 60 Q170 80, 190 60" />
              <path d="M30 80 Q50 60, 70 80 Q90 100, 110 80 Q130 60, 150 80 Q170 100, 190 80" />
              <path d="M30 100 Q50 80, 70 100 Q90 120, 110 100 Q130 80, 150 100 Q170 120, 190 100" />
            </g>

            {/* Fan */}
            <g>
              <circle
                cx="110"
                cy="25"
                r="15"
                fill="none"
                stroke="#374151"
                strokeWidth="2"
              />
              <g fill="#374151">
                <path d="M110 15 L105 30 L115 30 Z" />
                <path d="M120 25 L100 20 L100 30 Z" />
                <path d="M110 35 L115 20 L105 20 Z" />
                {animated && (
                  <animateTransform
                    attributeName="transform"
                    attributeType="XML"
                    type="rotate"
                    from="0 110 25"
                    to="360 110 25"
                    dur="1s"
                    repeatCount="indefinite"
                  />
                )}
              </g>
            </g>

            {/* Heat Dissipation */}
            {animated && (
              <g fill="#fbbf24" opacity="0.6">
                <circle cx="70" cy="10" r="2">
                  <animate
                    attributeName="cy"
                    values="10;-10"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.6;0"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle cx="110" cy="5" r="2">
                  <animate
                    attributeName="cy"
                    values="5;-15"
                    dur="2s"
                    begin="0.5s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.6;0"
                    dur="2s"
                    begin="0.5s"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle cx="150" cy="10" r="2">
                  <animate
                    attributeName="cy"
                    values="10;-10"
                    dur="2s"
                    begin="1s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.6;0"
                    dur="2s"
                    begin="1s"
                    repeatCount="indefinite"
                  />
                </circle>
              </g>
            )}

            {/* Connection Points */}
            <circle cx="30" cy="70" r="4" fill="#374151" />
            <circle cx="190" cy="70" r="4" fill="#374151" />

            {showLabels && (
              <text
                x="110"
                y="140"
                textAnchor="middle"
                className="text-sm font-medium fill-gray-700"
              >
                Condenser
              </text>
            )}
          </svg>
        );

      case "expansion-valve":
        return (
          <svg
            width={width}
            height={height}
            viewBox="0 0 200 150"
            className={className}
          >
            {/* Valve Body */}
            <rect
              x="80"
              y="60"
              width="40"
              height="30"
              fill="#d1d5db"
              stroke="#374151"
              strokeWidth="2"
            />

            {/* Inlet Pipe */}
            <rect
              x="30"
              y="70"
              width="50"
              height="10"
              fill="#6b7280"
              stroke="#374151"
              strokeWidth="1"
            />

            {/* Outlet Pipe */}
            <rect
              x="120"
              y="70"
              width="50"
              height="10"
              fill="#6b7280"
              stroke="#374151"
              strokeWidth="1"
            />

            {/* Restriction */}
            <path
              d="M80 75 L95 70 L95 80 L105 70 L105 80 L120 75"
              fill="none"
              stroke="#374151"
              strokeWidth="2"
            />

            {/* Control Element */}
            <rect x="95" y="45" width="10" height="15" fill="#374151" />
            <circle
              cx="100"
              cy="40"
              r="8"
              fill="#9ca3af"
              stroke="#374151"
              strokeWidth="2"
            />

            {/* Pressure Drop Indication */}
            {animated && (
              <g>
                <circle cx="60" cy="75" r="2" fill="#ef4444">
                  <animate
                    attributeName="r"
                    values="2;4;2"
                    dur="1s"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle cx="140" cy="75" r="2" fill="#3b82f6">
                  <animate
                    attributeName="r"
                    values="2;3;2"
                    dur="1s"
                    repeatCount="indefinite"
                  />
                </circle>
              </g>
            )}

            {showLabels && (
              <>
                <text
                  x="100"
                  y="130"
                  textAnchor="middle"
                  className="text-sm font-medium fill-gray-700"
                >
                  Expansion Valve
                </text>
                <text
                  x="55"
                  y="95"
                  textAnchor="middle"
                  className="text-xs fill-red-600"
                >
                  High P
                </text>
                <text
                  x="145"
                  y="95"
                  textAnchor="middle"
                  className="text-xs fill-blue-600"
                >
                  Low P
                </text>
              </>
            )}
          </svg>
        );

      case "complete-cycle":
        return (
          <svg
            width={width}
            height={height}
            viewBox="0 0 400 300"
            className={className}
          >
            {/* Complete Refrigeration Cycle */}

            {/* Evaporator */}
            <g transform="translate(50, 200)">
              <rect
                width="100"
                height="40"
                fill="#e5f3ff"
                stroke="#3b82f6"
                strokeWidth="2"
                rx="5"
              />
              <text
                x="50"
                y="25"
                textAnchor="middle"
                className="text-xs font-medium fill-blue-600"
              >
                Evaporator
              </text>
            </g>

            {/* Compressor */}
            <g transform="translate(300, 200)">
              <circle
                cx="25"
                cy="20"
                r="20"
                fill="#fef3c7"
                stroke="#f59e0b"
                strokeWidth="2"
              />
              <text
                x="25"
                y="50"
                textAnchor="middle"
                className="text-xs font-medium fill-yellow-600"
              >
                Compressor
              </text>
            </g>

            {/* Condenser */}
            <g transform="translate(250, 50)">
              <rect
                width="100"
                height="40"
                fill="#fef2f2"
                stroke="#ef4444"
                strokeWidth="2"
                rx="5"
              />
              <text
                x="50"
                y="25"
                textAnchor="middle"
                className="text-xs font-medium fill-red-600"
              >
                Condenser
              </text>
            </g>

            {/* Expansion Valve */}
            <g transform="translate(50, 50)">
              <polygon
                points="0,20 20,10 20,30"
                fill="#f3f4f6"
                stroke="#6b7280"
                strokeWidth="2"
              />
              <text
                x="10"
                y="50"
                textAnchor="middle"
                className="text-xs font-medium fill-gray-600"
              >
                Expansion
              </text>
            </g>

            {/* Connecting Lines with Flow Direction */}
            <g fill="none" strokeWidth="3">
              {/* Evaporator to Compressor */}
              <path d="M150 220 L300 220" stroke="#3b82f6" />
              <polygon points="290,215 300,220 290,225" fill="#3b82f6" />

              {/* Compressor to Condenser */}
              <path d="M325 200 L325 90 L250 90" stroke="#ef4444" />
              <polygon points="260,85 250,90 260,95" fill="#ef4444" />

              {/* Condenser to Expansion Valve */}
              <path d="M250 70 L70 70" stroke="#10b981" />
              <polygon points="80,65 70,70 80,75" fill="#10b981" />

              {/* Expansion Valve to Evaporator */}
              <path d="M50 70 L50 200" stroke="#8b5cf6" />
              <polygon points="45,190 50,200 55,190" fill="#8b5cf6" />
            </g>

            {/* Refrigerant Flow Animation */}
            {animated && (
              <g>
                <circle r="3" fill="#3b82f6">
                  <animateMotion
                    dur="4s"
                    repeatCount="indefinite"
                    path="M150 220 L300 220 L325 200 L325 90 L250 90 L250 70 L70 70 L50 70 L50 200 Z"
                  />
                </circle>
              </g>
            )}

            {refrigerant && (
              <text
                x="200"
                y="20"
                textAnchor="middle"
                className="text-lg font-bold fill-gray-800"
              >
                {refrigerant} Refrigeration Cycle
              </text>
            )}

            {/* State Points */}
            <g className="text-xs font-bold">
              <circle
                cx="225"
                cy="220"
                r="5"
                fill="#fff"
                stroke="#000"
                strokeWidth="2"
              />
              <text x="225" y="235" textAnchor="middle">
                1
              </text>

              <circle
                cx="325"
                cy="145"
                r="5"
                fill="#fff"
                stroke="#000"
                strokeWidth="2"
              />
              <text x="340" y="150" textAnchor="middle">
                2
              </text>

              <circle
                cx="160"
                cy="70"
                r="5"
                fill="#fff"
                stroke="#000"
                strokeWidth="2"
              />
              <text x="160" y="55" textAnchor="middle">
                3
              </text>

              <circle
                cx="50"
                cy="135"
                r="5"
                fill="#fff"
                stroke="#000"
                strokeWidth="2"
              />
              <text x="35" y="140" textAnchor="middle">
                4
              </text>
            </g>
          </svg>
        );

      default:
        return (
          <svg
            width={width}
            height={height}
            viewBox="0 0 200 150"
            className={className}
          >
            <rect width="200" height="150" fill="#f3f4f6" stroke="#d1d5db" />
            <text
              x="100"
              y="75"
              textAnchor="middle"
              className="text-sm fill-gray-500"
            >
              Equipment Diagram
            </text>
          </svg>
        );
    }
  };

  return getEquipmentSvg();
}

// Props interface for cycle data
interface CycleData {
  points: Array<{
    temperature: number;
    pressure: number;
    enthalpy: number;
    entropy: number;
    quality?: number;
    name: string;
    id: string;
    x: number;
    y: number;
  }>;
  refrigerant: string;
  cycleType: "standard" | "cascade-low" | "cascade-high";
}

interface EquipmentDiagramsProps {
  cycleData?: CycleData;
  isAnimating?: boolean;
  animationSpeed?: number;
}

// Main component that displays equipment diagrams with cycle data
export function EquipmentDiagrams({
  cycleData,
  isAnimating = false,
  animationSpeed = 1000,
}: EquipmentDiagramsProps) {
  return (
    <div className="space-y-6">
      {/* Complete Cycle Overview */}
      <div className="flex justify-center">
        <EquipmentDiagram
          type="complete-cycle"
          width={400}
          height={300}
          animated={isAnimating}
          refrigerant={cycleData?.refrigerant}
          showLabels={true}
        />
      </div>

      {/* Individual Equipment Components */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <EquipmentDiagram
            type="evaporator"
            width={180}
            height={120}
            animated={isAnimating}
            showLabels={true}
          />
          {cycleData && (
            <div className="mt-2 text-sm text-gray-600">
              <div>State 4 → 1</div>
              <div>
                {cycleData.points[0]?.temperature?.toFixed(1) || "0.0"}°C
              </div>
            </div>
          )}
        </div>

        <div className="text-center">
          <EquipmentDiagram
            type="compressor"
            width={180}
            height={120}
            animated={isAnimating}
            showLabels={true}
          />
          {cycleData && (
            <div className="mt-2 text-sm text-gray-600">
              <div>State 1 → 2</div>
              <div>
                {cycleData.points[1]?.temperature?.toFixed(1) || "0.0"}°C
              </div>
            </div>
          )}
        </div>

        <div className="text-center">
          <EquipmentDiagram
            type="condenser"
            width={180}
            height={120}
            animated={isAnimating}
            showLabels={true}
          />
          {cycleData && (
            <div className="mt-2 text-sm text-gray-600">
              <div>State 2 → 3</div>
              <div>
                {cycleData.points[2]?.temperature?.toFixed(1) || "0.0"}°C
              </div>
            </div>
          )}
        </div>

        <div className="text-center">
          <EquipmentDiagram
            type="expansion-valve"
            width={180}
            height={120}
            animated={isAnimating}
            showLabels={true}
          />
          {cycleData && (
            <div className="mt-2 text-sm text-gray-600">
              <div>State 3 → 4</div>
              <div>
                {cycleData.points[3]?.temperature?.toFixed(1) || "0.0"}°C
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cycle Information */}
      {cycleData && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">
            {cycleData.refrigerant}{" "}
            {cycleData.cycleType === "standard"
              ? "Standard"
              : cycleData.cycleType === "cascade-low"
                ? "Cascade Low-Temperature"
                : "Cascade High-Temperature"}{" "}
            Cycle
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {cycleData.points.map((point, index) => (
              <div key={index} className="p-2 bg-white rounded border">
                <div className="font-medium text-blue-600">
                  State {index + 1}
                </div>
                <div className="text-gray-600">{point.name}</div>
                <div className="mt-1">
                  <div>T: {point.temperature?.toFixed(1) || "0.0"}°C</div>
                  <div>P: {((point.pressure || 0) / 1000).toFixed(1)} MPa</div>
                  <div>h: {point.enthalpy?.toFixed(1) || "0.0"} kJ/kg</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Collection of all equipment diagrams
export function EquipmentLibrary() {
  const equipmentTypes = [
    {
      type: "compressor" as const,
      name: "Compressor",
      description: "Increases refrigerant pressure and temperature",
    },
    {
      type: "evaporator" as const,
      name: "Evaporator",
      description: "Absorbs heat from surroundings",
    },
    {
      type: "condenser" as const,
      name: "Condenser",
      description: "Rejects heat to surroundings",
    },
    {
      type: "expansion-valve" as const,
      name: "Expansion Valve",
      description: "Reduces pressure and temperature",
    },
    {
      type: "complete-cycle" as const,
      name: "Complete Cycle",
      description: "Full refrigeration system",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {equipmentTypes.map((equipment) => (
        <Card key={equipment.type}>
          <CardHeader>
            <CardTitle className="text-lg">{equipment.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center mb-4">
              <EquipmentDiagram
                type={equipment.type}
                width={200}
                height={150}
                animated={true}
                showLabels={true}
              />
            </div>
            <p className="text-sm text-gray-600">{equipment.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
