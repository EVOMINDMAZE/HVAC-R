import { cn } from "@/lib/utils";

export interface MiniChartProps {
  data: number[];
  type?: "bar" | "line" | "area";
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

export function MiniChart({
  data,
  type = "bar",
  width = 100,
  height = 32,
  color = "hsl(var(--primary))",
  className,
}: MiniChartProps) {
  if (!data || data.length === 0) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  if (type === "bar") {
    const barWidth = width / data.length - 2;
    return (
      <svg width={width} height={height} className={cn("mini-chart", className)}>
        {data.map((v, i) => {
          const barHeight = ((v - min) / range) * (height - 4);
          const x = i * (barWidth + 2);
          const y = height - barHeight;
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              fill={color}
              rx={2}
              opacity={0.7 + (v / max) * 0.3}
            />
          );
        })}
      </svg>
    );
  }

  if (type === "area") {
    const points = data.map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    }).join(" ");

    const areaPoints = `0,${height} ${points} ${width},${height}`;

    return (
      <svg width={width} height={height} className={cn("mini-chart", className)}>
        <defs>
          <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <polygon fill={`url(#gradient-${color})`} points={areaPoints} />
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    );
  }

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={width} height={height} className={cn("mini-chart", className)}>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

export interface ProgressRingProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  showValue?: boolean;
  className?: string;
}

export function ProgressRing({
  value,
  max = 100,
  size = 64,
  strokeWidth = 4,
  color = "hsl(var(--primary))",
  showValue = true,
  className,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const normalizedValue = Math.min(Math.max(value, 0), max);
  const percentage = max > 0 ? (normalizedValue / max) * 100 : 0;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn("progress-ring", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
          className="opacity-20"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      {showValue && (
        <div className="progress-ring__value">
          <span className="text-sm font-bold" style={{ color }}>
            {Math.round(percentage)}%
          </span>
        </div>
      )}
    </div>
  );
}